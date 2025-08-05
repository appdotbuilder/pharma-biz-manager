
import { db } from '../db';
import { productsTable } from '../db/schema';
import { type CreateProductInput, type Product } from '../schema';

export async function createProduct(input: CreateProductInput): Promise<Product> {
  try {
    // Validate expiration date is in the future
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set to start of day for fair comparison
    
    if (input.expiration_date < today) {
      throw new Error('Expiration date must be in the future');
    }

    // Insert product record
    const result = await db.insert(productsTable)
      .values({
        name: input.name,
        current_stock: input.current_stock,
        selling_price: input.selling_price.toString(), // Convert number to string for numeric column
        purchase_price: input.purchase_price.toString(), // Convert number to string for numeric column
        expiration_date: input.expiration_date.toISOString().split('T')[0] // Convert Date to YYYY-MM-DD string
      })
      .returning()
      .execute();

    // Convert numeric fields back to numbers before returning
    const product = result[0];
    return {
      ...product,
      selling_price: parseFloat(product.selling_price), // Convert string back to number
      purchase_price: parseFloat(product.purchase_price), // Convert string back to number
      expiration_date: new Date(product.expiration_date) // Convert date string back to Date
    };
  } catch (error) {
    console.error('Product creation failed:', error);
    throw error;
  }
}
