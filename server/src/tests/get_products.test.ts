
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { productsTable } from '../db/schema';
import { type CreateProductInput } from '../schema';
import { getProducts } from '../handlers/get_products';

// Test products with different expiration dates and stock levels
// Using clearly future and past dates to avoid date comparison issues
const tomorrow = new Date();
tomorrow.setDate(tomorrow.getDate() + 1);

const nextYear = new Date();
nextYear.setFullYear(nextYear.getFullYear() + 1);

const lastYear = new Date();
lastYear.setFullYear(lastYear.getFullYear() - 1);

const testProducts: CreateProductInput[] = [
  {
    name: 'Aspirin',
    current_stock: 50,
    selling_price: 9.99,
    purchase_price: 5.00,
    expiration_date: nextYear // Clearly future date
  },
  {
    name: 'Ibuprofen',
    current_stock: 5, // Low stock
    selling_price: 12.50,
    purchase_price: 7.00,
    expiration_date: tomorrow // Clearly future date
  },
  {
    name: 'Expired Medicine',
    current_stock: 25,
    selling_price: 15.00,
    purchase_price: 8.00,
    expiration_date: lastYear // Clearly past date
  },
  {
    name: 'Paracetamol',
    current_stock: 100,
    selling_price: 8.99,
    purchase_price: 4.50,
    expiration_date: nextYear // Clearly future date
  }
];

describe('getProducts', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  beforeEach(async () => {
    // Insert test products
    for (const product of testProducts) {
      await db.insert(productsTable).values({
        name: product.name,
        current_stock: product.current_stock,
        selling_price: product.selling_price.toString(),
        purchase_price: product.purchase_price.toString(),
        expiration_date: product.expiration_date.toISOString().split('T')[0]
      }).execute();
    }
  });

  it('should fetch all products with proper type conversions', async () => {
    const products = await getProducts({ includeExpired: true });

    expect(products).toHaveLength(4);
    
    // Verify type conversions
    const aspirin = products.find(p => p.name === 'Aspirin');
    expect(aspirin).toBeDefined();
    expect(typeof aspirin!.selling_price).toBe('number');
    expect(typeof aspirin!.purchase_price).toBe('number');
    expect(aspirin!.selling_price).toBe(9.99);
    expect(aspirin!.purchase_price).toBe(5.00);
    expect(aspirin!.current_stock).toBe(50);
    expect(aspirin!.expiration_date).toBeInstanceOf(Date);
    expect(aspirin!.created_at).toBeInstanceOf(Date);
    expect(aspirin!.id).toBeDefined();
  });

  it('should exclude expired products by default', async () => {
    const products = await getProducts();

    // Should not include the expired medicine
    const expiredProduct = products.find(p => p.name === 'Expired Medicine');
    expect(expiredProduct).toBeUndefined();
    
    // Should include non-expired products (3 products: Aspirin, Ibuprofen, Paracetamol)
    expect(products).toHaveLength(3);
    const nonExpiredNames = products.map(p => p.name);
    expect(nonExpiredNames).not.toContain('Expired Medicine');
  });

  it('should include expired products when requested', async () => {
    const products = await getProducts({ includeExpired: true });

    expect(products).toHaveLength(4);
    
    const expiredProduct = products.find(p => p.name === 'Expired Medicine');
    expect(expiredProduct).toBeDefined();
    expect(expiredProduct!.expiration_date < new Date()).toBe(true);
  });

  it('should filter for low stock products only', async () => {
    const products = await getProducts({ 
      includeExpired: true, 
      lowStockOnly: true, 
      lowStockThreshold: 10 
    });

    // Only Ibuprofen has stock < 10 (stock = 5)
    expect(products).toHaveLength(1);
    expect(products[0].name).toBe('Ibuprofen');
    expect(products[0].current_stock).toBe(5);
  });

  it('should handle low stock threshold with different values', async () => {
    const lowStockProducts = await getProducts({ 
      includeExpired: true, 
      lowStockOnly: true, 
      lowStockThreshold: 30 
    });

    // Products with stock < 30: Ibuprofen (5) and Expired Medicine (25)
    expect(lowStockProducts).toHaveLength(2);
    const stockLevels = lowStockProducts.map(p => p.current_stock);
    expect(stockLevels.every(stock => stock < 30)).toBe(true);
  });

  it('should return products ordered by name', async () => {
    const products = await getProducts({ includeExpired: true });

    expect(products).toHaveLength(4);
    
    // Products should be ordered by name ascending
    for (let i = 0; i < products.length - 1; i++) {
      expect(products[i].name <= products[i + 1].name).toBe(true);
    }
  });

  it('should handle empty database', async () => {
    // Clear all products
    await db.delete(productsTable).execute();

    const products = await getProducts();
    expect(products).toHaveLength(0);
  });

  it('should combine filters correctly', async () => {
    const products = await getProducts({ 
      includeExpired: false, // Exclude expired
      lowStockOnly: true, 
      lowStockThreshold: 10 
    });

    // Should only include Ibuprofen (non-expired and low stock)
    expect(products).toHaveLength(1);
    expect(products[0].name).toBe('Ibuprofen');
    expect(products[0].current_stock).toBe(5);
    expect(products[0].expiration_date >= new Date()).toBe(true);
  });

  it('should handle no filters (default behavior)', async () => {
    const products = await getProducts();

    // Should exclude expired products by default (3 non-expired products)
    const productNames = products.map(p => p.name);
    expect(productNames).not.toContain('Expired Medicine');
    expect(products).toHaveLength(3);
    
    // Verify all returned products are not expired
    const today = new Date();
    products.forEach(product => {
      expect(product.expiration_date >= today).toBe(true);
    });
  });

  it('should handle low stock threshold without lowStockOnly flag', async () => {
    // If lowStockOnly is false or undefined, threshold should be ignored
    const products = await getProducts({ 
      includeExpired: true, 
      lowStockThreshold: 10 
      // lowStockOnly is undefined/false
    });

    // Should return all products since lowStockOnly is not true
    expect(products).toHaveLength(4);
  });
});
