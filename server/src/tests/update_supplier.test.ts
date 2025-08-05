
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { suppliersTable } from '../db/schema';
import { type CreateSupplierInput, type UpdateSupplierInput } from '../schema';
import { updateSupplier } from '../handlers/update_supplier';
import { eq } from 'drizzle-orm';

// Test data
const testSupplier: CreateSupplierInput = {
  name: 'Original Supplier',
  phone: '123-456-7890',
  email: 'original@supplier.com',
  address: '123 Original St'
};

describe('updateSupplier', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update supplier name', async () => {
    // Create initial supplier
    const created = await db.insert(suppliersTable)
      .values(testSupplier)
      .returning()
      .execute();

    const supplierId = created[0].id;

    // Update supplier name
    const updateInput: UpdateSupplierInput = {
      id: supplierId,
      name: 'Updated Supplier Name'
    };

    const result = await updateSupplier(updateInput);

    expect(result.id).toEqual(supplierId);
    expect(result.name).toEqual('Updated Supplier Name');
    expect(result.phone).toEqual('123-456-7890'); // Should remain unchanged
    expect(result.email).toEqual('original@supplier.com'); // Should remain unchanged
    expect(result.address).toEqual('123 Original St'); // Should remain unchanged
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should update multiple fields', async () => {
    // Create initial supplier
    const created = await db.insert(suppliersTable)
      .values(testSupplier)
      .returning()
      .execute();

    const supplierId = created[0].id;

    // Update multiple fields
    const updateInput: UpdateSupplierInput = {
      id: supplierId,
      name: 'New Supplier Name',
      phone: '987-654-3210',
      email: 'new@supplier.com'
    };

    const result = await updateSupplier(updateInput);

    expect(result.name).toEqual('New Supplier Name');
    expect(result.phone).toEqual('987-654-3210');
    expect(result.email).toEqual('new@supplier.com');
    expect(result.address).toEqual('123 Original St'); // Should remain unchanged
  });

  it('should update nullable fields to null', async () => {
    // Create initial supplier
    const created = await db.insert(suppliersTable)
      .values(testSupplier)
      .returning()
      .execute();

    const supplierId = created[0].id;

    // Update nullable fields to null
    const updateInput: UpdateSupplierInput = {
      id: supplierId,
      phone: null,
      email: null,
      address: null
    };

    const result = await updateSupplier(updateInput);

    expect(result.name).toEqual('Original Supplier'); // Should remain unchanged
    expect(result.phone).toBeNull();
    expect(result.email).toBeNull();
    expect(result.address).toBeNull();
  });

  it('should persist changes in database', async () => {
    // Create initial supplier
    const created = await db.insert(suppliersTable)
      .values(testSupplier)
      .returning()
      .execute();

    const supplierId = created[0].id;

    // Update supplier
    const updateInput: UpdateSupplierInput = {
      id: supplierId,
      name: 'Database Updated Supplier',
      phone: '555-0123'
    };

    await updateSupplier(updateInput);

    // Verify changes were persisted
    const suppliers = await db.select()
      .from(suppliersTable)
      .where(eq(suppliersTable.id, supplierId))
      .execute();

    expect(suppliers).toHaveLength(1);
    expect(suppliers[0].name).toEqual('Database Updated Supplier');
    expect(suppliers[0].phone).toEqual('555-0123');
    expect(suppliers[0].email).toEqual('original@supplier.com'); // Should remain unchanged
  });

  it('should return existing supplier when no fields to update', async () => {
    // Create initial supplier
    const created = await db.insert(suppliersTable)
      .values(testSupplier)
      .returning()
      .execute();

    const supplierId = created[0].id;

    // Update with no fields
    const updateInput: UpdateSupplierInput = {
      id: supplierId
    };

    const result = await updateSupplier(updateInput);

    expect(result.id).toEqual(supplierId);
    expect(result.name).toEqual('Original Supplier');
    expect(result.phone).toEqual('123-456-7890');
    expect(result.email).toEqual('original@supplier.com');
    expect(result.address).toEqual('123 Original St');
  });

  it('should throw error when supplier does not exist', async () => {
    const updateInput: UpdateSupplierInput = {
      id: 999,
      name: 'Non-existent Supplier'
    };

    await expect(updateSupplier(updateInput)).rejects.toThrow(/supplier with id 999 not found/i);
  });
});
