
import { db } from '../db';
import { productsTable } from '../db/schema';
import { type Product } from '../schema';
import { asc } from 'drizzle-orm';

export interface GetProductsOptions {
  includeExpired?: boolean;
  lowStockThreshold?: number;
  lowStockOnly?: boolean;
}

export async function getProducts(options: GetProductsOptions = {}): Promise<Product[]> {
  try {
    const results = await db.select().from(productsTable).orderBy(asc(productsTable.name)).execute();

    // Convert numeric fields and apply filters in JavaScript
    let products = results.map(product => ({
      ...product,
      selling_price: parseFloat(product.selling_price),
      purchase_price: parseFloat(product.purchase_price),
      expiration_date: new Date(product.expiration_date),
      created_at: product.created_at
    }));

    // Apply expiration filter
    if (!options.includeExpired) {
      const today = new Date();
      products = products.filter(product => product.expiration_date >= today);
    }

    // Apply low stock filter
    if (options.lowStockOnly && typeof options.lowStockThreshold === 'number') {
      products = products.filter(product => product.current_stock < options.lowStockThreshold!);
    }

    return products;
  } catch (error) {
    console.error('Failed to fetch products:', error);
    throw error;
  }
}
