
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { customersTable, productsTable, salesTransactionsTable, salesTransactionItemsTable } from '../db/schema';
import { getSalesTransactions } from '../handlers/get_sales_transactions';

describe('getSalesTransactions', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no transactions exist', async () => {
    const result = await getSalesTransactions();
    expect(result).toEqual([]);
  });

  it('should fetch all sales transactions', async () => {
    // Create test customer
    const customerResult = await db.insert(customersTable)
      .values({
        name: 'Test Customer',
        phone: '1234567890',
        email: 'test@example.com',
        address: '123 Test St'
      })
      .returning()
      .execute();
    const customerId = customerResult[0].id;

    // Create test product
    const productResult = await db.insert(productsTable)
      .values({
        name: 'Test Medicine',
        current_stock: 100,
        selling_price: '19.99',
        purchase_price: '15.00',
        expiration_date: '2025-01-01'
      })
      .returning()
      .execute();
    const productId = productResult[0].id;

    // Create test sales transactions
    const transaction1 = await db.insert(salesTransactionsTable)
      .values({
        total_amount: '99.99',
        customer_id: customerId
      })
      .returning()
      .execute();

    const transaction2 = await db.insert(salesTransactionsTable)
      .values({
        total_amount: '49.50',
        customer_id: null
      })
      .returning()
      .execute();

    // Create transaction items
    await db.insert(salesTransactionItemsTable)
      .values({
        transaction_id: transaction1[0].id,
        product_id: productId,
        quantity: 5,
        unit_price: '19.99',
        subtotal: '99.95'
      })
      .execute();

    const result = await getSalesTransactions();

    expect(result).toHaveLength(2);
    
    // Check first transaction
    const firstTransaction = result.find(t => t.id === transaction1[0].id);
    expect(firstTransaction).toBeDefined();
    expect(typeof firstTransaction!.total_amount).toBe('number');
    expect(firstTransaction!.total_amount).toBe(99.99);
    expect(firstTransaction!.customer_id).toBe(customerId);
    expect(firstTransaction!.transaction_date).toBeInstanceOf(Date);
    expect(firstTransaction!.created_at).toBeInstanceOf(Date);

    // Check second transaction (no customer)
    const secondTransaction = result.find(t => t.id === transaction2[0].id);
    expect(secondTransaction).toBeDefined();
    expect(typeof secondTransaction!.total_amount).toBe('number');
    expect(secondTransaction!.total_amount).toBe(49.50);
    expect(secondTransaction!.customer_id).toBeNull();
  });

  it('should handle transactions with different total amounts correctly', async () => {
    // Create transactions with various amounts to test numeric conversion
    await db.insert(salesTransactionsTable)
      .values([
        { total_amount: '0.99', customer_id: null },
        { total_amount: '1000.00', customer_id: null },
        { total_amount: '25.50', customer_id: null }
      ])
      .execute();

    const result = await getSalesTransactions();

    expect(result).toHaveLength(3);
    
    // Use numeric sort with comparison function
    const amounts = result.map(t => t.total_amount).sort((a, b) => a - b);
    expect(amounts).toEqual([0.99, 25.50, 1000.00]);
    
    // Verify all amounts are numbers
    result.forEach(transaction => {
      expect(typeof transaction.total_amount).toBe('number');
      expect(transaction.id).toBeDefined();
      expect(transaction.transaction_date).toBeInstanceOf(Date);
      expect(transaction.created_at).toBeInstanceOf(Date);
    });
  });
});
