
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { productsTable } from '../db/schema';
import { type CreateProductInput } from '../schema';
import { createProduct } from '../handlers/create_product';
import { eq } from 'drizzle-orm';

// Test input with future expiration date
const testInput: CreateProductInput = {
  name: 'Test Medicine',
  current_stock: 50,
  selling_price: 25.99,
  purchase_price: 15.50,
  expiration_date: new Date('2025-12-31')
};

describe('createProduct', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a product', async () => {
    const result = await createProduct(testInput);

    // Basic field validation
    expect(result.name).toEqual('Test Medicine');
    expect(result.current_stock).toEqual(50);
    expect(result.selling_price).toEqual(25.99);
    expect(result.purchase_price).toEqual(15.50);
    expect(result.expiration_date).toEqual(new Date('2025-12-31'));
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);

    // Verify numeric types
    expect(typeof result.selling_price).toBe('number');
    expect(typeof result.purchase_price).toBe('number');
  });

  it('should save product to database', async () => {
    const result = await createProduct(testInput);

    // Query using proper drizzle syntax
    const products = await db.select()
      .from(productsTable)
      .where(eq(productsTable.id, result.id))
      .execute();

    expect(products).toHaveLength(1);
    expect(products[0].name).toEqual('Test Medicine');
    expect(products[0].current_stock).toEqual(50);
    expect(parseFloat(products[0].selling_price)).toEqual(25.99);
    expect(parseFloat(products[0].purchase_price)).toEqual(15.50);
    expect(products[0].created_at).toBeInstanceOf(Date);
  });

  it('should reject expired products', async () => {
    const expiredInput: CreateProductInput = {
      ...testInput,
      expiration_date: new Date('2020-01-01') // Past date
    };

    await expect(createProduct(expiredInput)).rejects.toThrow(/expiration date must be in the future/i);
  });

  it('should allow products expiring today', async () => {
    const today = new Date();
    const todayInput: CreateProductInput = {
      ...testInput,
      expiration_date: today
    };

    const result = await createProduct(todayInput);
    expect(result.expiration_date.toDateString()).toEqual(today.toDateString());
  });

  it('should handle zero stock correctly', async () => {
    const zeroStockInput: CreateProductInput = {
      ...testInput,
      current_stock: 0
    };

    const result = await createProduct(zeroStockInput);
    expect(result.current_stock).toEqual(0);
  });

  it('should handle high precision prices', async () => {
    const precisionInput: CreateProductInput = {
      ...testInput,
      selling_price: 99.99,
      purchase_price: 49.95
    };

    const result = await createProduct(precisionInput);
    expect(result.selling_price).toEqual(99.99);
    expect(result.purchase_price).toEqual(49.95);
  });
});
