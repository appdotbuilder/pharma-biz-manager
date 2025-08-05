
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { productsTable, salesTransactionsTable, salesTransactionItemsTable, customersTable } from '../db/schema';
import { type CreateSalesTransactionInput } from '../schema';
import { createSalesTransaction } from '../handlers/create_sales_transaction';
import { eq } from 'drizzle-orm';

describe('createSalesTransaction', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a sales transaction with items', async () => {
    // Create test customer
    const customerResult = await db.insert(customersTable)
      .values({
        name: 'Test Customer',
        phone: null,
        email: null,
        address: null
      })
      .returning()
      .execute();
    const customer = customerResult[0];

    // Create test products
    const product1Result = await db.insert(productsTable)
      .values({
        name: 'Medicine A',
        current_stock: 50,
        selling_price: '10.00',
        purchase_price: '8.00',
        expiration_date: '2025-12-31'
      })
      .returning()
      .execute();

    const product2Result = await db.insert(productsTable)
      .values({
        name: 'Medicine B',
        current_stock: 30,
        selling_price: '15.50',
        purchase_price: '12.00',
        expiration_date: '2025-12-31'
      })
      .returning()
      .execute();

    const product1 = product1Result[0];
    const product2 = product2Result[0];

    // Test input
    const testInput: CreateSalesTransactionInput = {
      customer_id: customer.id,
      items: [
        {
          product_id: product1.id,
          quantity: 5,
          unit_price: 10.00
        },
        {
          product_id: product2.id,
          quantity: 2,
          unit_price: 15.50
        }
      ]
    };

    const result = await createSalesTransaction(testInput);

    // Verify transaction
    expect(result.id).toBeDefined();
    expect(result.total_amount).toEqual(81.00); // (5 * 10.00) + (2 * 15.50)
    expect(result.customer_id).toEqual(customer.id);
    expect(result.transaction_date).toBeInstanceOf(Date);
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save transaction and items to database', async () => {
    // Create test product
    const productResult = await db.insert(productsTable)
      .values({
        name: 'Test Medicine',
        current_stock: 100,
        selling_price: '25.00',
        purchase_price: '20.00',
        expiration_date: '2025-12-31'
      })
      .returning()
      .execute();
    const product = productResult[0];

    const testInput: CreateSalesTransactionInput = {
      customer_id: null,
      items: [
        {
          product_id: product.id,
          quantity: 3,
          unit_price: 25.00
        }
      ]
    };

    const result = await createSalesTransaction(testInput);

    // Verify transaction in database
    const transactions = await db.select()
      .from(salesTransactionsTable)
      .where(eq(salesTransactionsTable.id, result.id))
      .execute();

    expect(transactions).toHaveLength(1);
    expect(parseFloat(transactions[0].total_amount)).toEqual(75.00);
    expect(transactions[0].customer_id).toBeNull();

    // Verify transaction items in database
    const items = await db.select()
      .from(salesTransactionItemsTable)
      .where(eq(salesTransactionItemsTable.transaction_id, result.id))
      .execute();

    expect(items).toHaveLength(1);
    expect(items[0].product_id).toEqual(product.id);
    expect(items[0].quantity).toEqual(3);
    expect(parseFloat(items[0].unit_price)).toEqual(25.00);
    expect(parseFloat(items[0].subtotal)).toEqual(75.00);
  });

  it('should update product stock quantities', async () => {
    // Create test product
    const productResult = await db.insert(productsTable)
      .values({
        name: 'Stock Test Medicine',
        current_stock: 20,
        selling_price: '12.50',
        purchase_price: '10.00',
        expiration_date: '2025-12-31'
      })
      .returning()
      .execute();
    const product = productResult[0];

    const testInput: CreateSalesTransactionInput = {
      customer_id: null,
      items: [
        {
          product_id: product.id,
          quantity: 7,
          unit_price: 12.50
        }
      ]
    };

    await createSalesTransaction(testInput);

    // Verify stock was updated
    const updatedProducts = await db.select()
      .from(productsTable)
      .where(eq(productsTable.id, product.id))
      .execute();

    expect(updatedProducts[0].current_stock).toEqual(13); // 20 - 7 = 13
  });

  it('should throw error for non-existent product', async () => {
    const testInput: CreateSalesTransactionInput = {
      customer_id: null,
      items: [
        {
          product_id: 99999, // Non-existent product
          quantity: 1,
          unit_price: 10.00
        }
      ]
    };

    await expect(createSalesTransaction(testInput)).rejects.toThrow(/Product with id 99999 not found/i);
  });

  it('should throw error for insufficient stock', async () => {
    // Create test product with low stock
    const productResult = await db.insert(productsTable)
      .values({
        name: 'Low Stock Medicine',
        current_stock: 2,
        selling_price: '20.00',
        purchase_price: '15.00',
        expiration_date: '2025-12-31'
      })
      .returning()
      .execute();
    const product = productResult[0];

    const testInput: CreateSalesTransactionInput = {
      customer_id: null,
      items: [
        {
          product_id: product.id,
          quantity: 5, // More than available stock
          unit_price: 20.00
        }
      ]
    };

    await expect(createSalesTransaction(testInput)).rejects.toThrow(/Insufficient stock/i);

    // Verify stock wasn't changed
    const products = await db.select()
      .from(productsTable)
      .where(eq(productsTable.id, product.id))
      .execute();

    expect(products[0].current_stock).toEqual(2); // Stock should remain unchanged
  });

  it('should handle multiple items correctly', async () => {
    // Create multiple test products
    const product1Result = await db.insert(productsTable)
      .values({
        name: 'Product 1',
        current_stock: 15,
        selling_price: '5.00',
        purchase_price: '4.00',
        expiration_date: '2025-12-31'
      })
      .returning()
      .execute();

    const product2Result = await db.insert(productsTable)
      .values({
        name: 'Product 2',
        current_stock: 8,
        selling_price: '7.25',
        purchase_price: '6.00',
        expiration_date: '2025-12-31'
      })
      .returning()
      .execute();

    const product1 = product1Result[0];
    const product2 = product2Result[0];

    const testInput: CreateSalesTransactionInput = {
      customer_id: null,
      items: [
        {
          product_id: product1.id,
          quantity: 3,
          unit_price: 5.00
        },
        {
          product_id: product2.id,
          quantity: 2,
          unit_price: 7.25
        }
      ]
    };

    const result = await createSalesTransaction(testInput);

    // Verify total calculation
    expect(result.total_amount).toEqual(29.50); // (3 * 5.00) + (2 * 7.25)

    // Verify both stocks were updated
    const updatedProduct1 = await db.select()
      .from(productsTable)
      .where(eq(productsTable.id, product1.id))
      .execute();

    const updatedProduct2 = await db.select()
      .from(productsTable)
      .where(eq(productsTable.id, product2.id))
      .execute();

    expect(updatedProduct1[0].current_stock).toEqual(12); // 15 - 3
    expect(updatedProduct2[0].current_stock).toEqual(6);  // 8 - 2

    // Verify both items were created
    const items = await db.select()
      .from(salesTransactionItemsTable)
      .where(eq(salesTransactionItemsTable.transaction_id, result.id))
      .execute();

    expect(items).toHaveLength(2);
  });
});
