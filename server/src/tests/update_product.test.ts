
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { productsTable } from '../db/schema';
import { type UpdateProductInput, type CreateProductInput } from '../schema';
import { updateProduct } from '../handlers/update_product';
import { eq } from 'drizzle-orm';

// Test data
const createTestProduct: CreateProductInput = {
  name: 'Original Product',
  current_stock: 100,
  selling_price: 25.99,
  purchase_price: 15.50,
  expiration_date: new Date('2025-12-31')
};

const updateInput: UpdateProductInput = {
  id: 1,
  name: 'Updated Product',
  current_stock: 150,
  selling_price: 29.99,
  purchase_price: 18.75,
  expiration_date: new Date('2026-06-30')
};

describe('updateProduct', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update all product fields', async () => {
    // Create initial product
    await db.insert(productsTable)
      .values({
        name: createTestProduct.name,
        current_stock: createTestProduct.current_stock,
        selling_price: createTestProduct.selling_price.toString(),
        purchase_price: createTestProduct.purchase_price.toString(),
        expiration_date: createTestProduct.expiration_date.toISOString().split('T')[0]
      })
      .execute();

    const result = await updateProduct(updateInput);

    // Verify all fields updated correctly
    expect(result.id).toBe(1);
    expect(result.name).toBe('Updated Product');
    expect(result.current_stock).toBe(150);
    expect(result.selling_price).toBe(29.99);
    expect(result.purchase_price).toBe(18.75);
    expect(result.expiration_date).toEqual(new Date('2026-06-30'));
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should update partial product fields', async () => {
    // Create initial product
    await db.insert(productsTable)
      .values({
        name: createTestProduct.name,
        current_stock: createTestProduct.current_stock,
        selling_price: createTestProduct.selling_price.toString(),
        purchase_price: createTestProduct.purchase_price.toString(),
        expiration_date: createTestProduct.expiration_date.toISOString().split('T')[0]
      })
      .execute();

    // Update only name and stock
    const partialUpdate: UpdateProductInput = {
      id: 1,
      name: 'Partially Updated Product',
      current_stock: 75
    };

    const result = await updateProduct(partialUpdate);

    // Verify only specified fields updated
    expect(result.name).toBe('Partially Updated Product');
    expect(result.current_stock).toBe(75);
    expect(result.selling_price).toBe(25.99); // Original value
    expect(result.purchase_price).toBe(15.50); // Original value
    expect(result.expiration_date).toEqual(new Date('2025-12-31')); // Original value
  });

  it('should save updated product to database', async () => {
    // Create initial product
    await db.insert(productsTable)
      .values({
        name: createTestProduct.name,
        current_stock: createTestProduct.current_stock,
        selling_price: createTestProduct.selling_price.toString(),
        purchase_price: createTestProduct.purchase_price.toString(),
        expiration_date: createTestProduct.expiration_date.toISOString().split('T')[0]
      })
      .execute();

    await updateProduct(updateInput);

    // Query database to verify changes persisted
    const products = await db.select()
      .from(productsTable)
      .where(eq(productsTable.id, 1))
      .execute();

    expect(products).toHaveLength(1);
    const product = products[0];
    expect(product.name).toBe('Updated Product');
    expect(product.current_stock).toBe(150);
    expect(parseFloat(product.selling_price)).toBe(29.99);
    expect(parseFloat(product.purchase_price)).toBe(18.75);
    expect(product.expiration_date).toBe('2026-06-30');
  });

  it('should throw error for non-existent product', async () => {
    const nonExistentUpdate: UpdateProductInput = {
      id: 999,
      name: 'Non-existent Product'
    };

    expect(updateProduct(nonExistentUpdate)).rejects.toThrow(/product with id 999 not found/i);
  });

  it('should handle numeric price updates correctly', async () => {
    // Create initial product
    await db.insert(productsTable)
      .values({
        name: createTestProduct.name,
        current_stock: createTestProduct.current_stock,
        selling_price: createTestProduct.selling_price.toString(),
        purchase_price: createTestProduct.purchase_price.toString(),
        expiration_date: createTestProduct.expiration_date.toISOString().split('T')[0]
      })
      .execute();

    // Update only prices
    const priceUpdate: UpdateProductInput = {
      id: 1,
      selling_price: 99.95,
      purchase_price: 65.25
    };

    const result = await updateProduct(priceUpdate);

    // Verify numeric types are correct
    expect(typeof result.selling_price).toBe('number');
    expect(typeof result.purchase_price).toBe('number');
    expect(result.selling_price).toBe(99.95);
    expect(result.purchase_price).toBe(65.25);
  });
});
