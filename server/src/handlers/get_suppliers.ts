
import { db } from '../db';
import { suppliersTable } from '../db/schema';
import { type Supplier } from '../schema';

export async function getSuppliers(): Promise<Supplier[]> {
  try {
    const results = await db.select()
      .from(suppliersTable)
      .execute();

    return results.map(supplier => ({
      ...supplier,
      // No numeric conversions needed for suppliers table
      // All fields are text, integer (id), or timestamp
    }));
  } catch (error) {
    console.error('Failed to fetch suppliers:', error);
    throw error;
  }
}
