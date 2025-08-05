
import { db } from '../db';
import { suppliersTable } from '../db/schema';
import { type CreateSupplierInput, type Supplier } from '../schema';

export const createSupplier = async (input: CreateSupplierInput): Promise<Supplier> => {
  try {
    // Insert supplier record
    const result = await db.insert(suppliersTable)
      .values({
        name: input.name,
        phone: input.phone,
        email: input.email,
        address: input.address
      })
      .returning()
      .execute();

    const supplier = result[0];
    return supplier;
  } catch (error) {
    console.error('Supplier creation failed:', error);
    throw error;
  }
};
