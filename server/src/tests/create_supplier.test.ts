
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { suppliersTable } from '../db/schema';
import { type CreateSupplierInput } from '../schema';
import { createSupplier } from '../handlers/create_supplier';
import { eq } from 'drizzle-orm';

// Complete test input with all fields
const testInput: CreateSupplierInput = {
  name: 'Test Supplier',
  phone: '+1234567890',
  email: 'test@supplier.com',
  address: '123 Supplier Street, City, State'
};

// Test with nullable fields
const minimalInput: CreateSupplierInput = {
  name: 'Minimal Supplier',
  phone: null,
  email: null,
  address: null
};

describe('createSupplier', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a supplier with all fields', async () => {
    const result = await createSupplier(testInput);

    // Basic field validation
    expect(result.name).toEqual('Test Supplier');
    expect(result.phone).toEqual('+1234567890');
    expect(result.email).toEqual('test@supplier.com');
    expect(result.address).toEqual('123 Supplier Street, City, State');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should create a supplier with only required fields', async () => {
    const result = await createSupplier(minimalInput);

    // Basic field validation
    expect(result.name).toEqual('Minimal Supplier');
    expect(result.phone).toBeNull();
    expect(result.email).toBeNull();
    expect(result.address).toBeNull();
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save supplier to database', async () => {
    const result = await createSupplier(testInput);

    // Query using proper drizzle syntax
    const suppliers = await db.select()
      .from(suppliersTable)
      .where(eq(suppliersTable.id, result.id))
      .execute();

    expect(suppliers).toHaveLength(1);
    expect(suppliers[0].name).toEqual('Test Supplier');
    expect(suppliers[0].phone).toEqual('+1234567890');
    expect(suppliers[0].email).toEqual('test@supplier.com');
    expect(suppliers[0].address).toEqual('123 Supplier Street, City, State');
    expect(suppliers[0].created_at).toBeInstanceOf(Date);
  });

  it('should create multiple suppliers with different names', async () => {
    const supplier1 = await createSupplier(testInput);
    const supplier2 = await createSupplier({
      name: 'Another Supplier',
      phone: null,
      email: null,
      address: null
    });

    expect(supplier1.id).not.toEqual(supplier2.id);
    expect(supplier1.name).toEqual('Test Supplier');
    expect(supplier2.name).toEqual('Another Supplier');

    // Verify both are in database
    const allSuppliers = await db.select()
      .from(suppliersTable)
      .execute();

    expect(allSuppliers).toHaveLength(2);
  });
});
