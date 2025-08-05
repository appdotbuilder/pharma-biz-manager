
import { db } from '../db';
import { productsTable } from '../db/schema';
import { type UpdateProductInput, type Product } from '../schema';
import { eq } from 'drizzle-orm';

export const updateProduct = async (input: UpdateProductInput): Promise<Product> => {
  try {
    // Check if product exists
    const existingProducts = await db.select()
      .from(productsTable)
      .where(eq(productsTable.id, input.id))
      .execute();

    if (existingProducts.length === 0) {
      throw new Error(`Product with id ${input.id} not found`);
    }

    // Build update values with proper conversions
    const updateValues: any = {};
    
    if (input.name !== undefined) {
      updateValues.name = input.name;
    }
    
    if (input.current_stock !== undefined) {
      updateValues.current_stock = input.current_stock;
    }
    
    if (input.selling_price !== undefined) {
      updateValues.selling_price = input.selling_price.toString();
    }
    
    if (input.purchase_price !== undefined) {
      updateValues.purchase_price = input.purchase_price.toString();
    }
    
    if (input.expiration_date !== undefined) {
      updateValues.expiration_date = input.expiration_date.toISOString().split('T')[0];
    }

    // Update product record
    const result = await db.update(productsTable)
      .set(updateValues)
      .where(eq(productsTable.id, input.id))
      .returning()
      .execute();

    // Convert fields back to proper types before returning
    const product = result[0];
    return {
      ...product,
      selling_price: parseFloat(product.selling_price),
      purchase_price: parseFloat(product.purchase_price),
      expiration_date: new Date(product.expiration_date)
    };
  } catch (error) {
    console.error('Product update failed:', error);
    throw error;
  }
};
