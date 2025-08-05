
import { db } from '../db';
import { suppliersTable } from '../db/schema';
import { type UpdateSupplierInput, type Supplier } from '../schema';
import { eq } from 'drizzle-orm';

export const updateSupplier = async (input: UpdateSupplierInput): Promise<Supplier> => {
  try {
    // First check if supplier exists
    const existingSupplier = await db.select()
      .from(suppliersTable)
      .where(eq(suppliersTable.id, input.id))
      .execute();

    if (existingSupplier.length === 0) {
      throw new Error(`Supplier with id ${input.id} not found`);
    }

    // Build update object with only provided fields
    const updateData: Partial<typeof suppliersTable.$inferInsert> = {};
    
    if (input.name !== undefined) {
      updateData.name = input.name;
    }
    
    if (input.phone !== undefined) {
      updateData.phone = input.phone;
    }
    
    if (input.email !== undefined) {
      updateData.email = input.email;
    }
    
    if (input.address !== undefined) {
      updateData.address = input.address;
    }

    // If no fields to update, return the existing supplier
    if (Object.keys(updateData).length === 0) {
      return existingSupplier[0];
    }

    // Update supplier record
    const result = await db.update(suppliersTable)
      .set(updateData)
      .where(eq(suppliersTable.id, input.id))
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Supplier update failed:', error);
    throw error;
  }
};
