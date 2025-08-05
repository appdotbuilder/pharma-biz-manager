
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { suppliersTable } from '../db/schema';
import { type CreateSupplierInput } from '../schema';
import { getSuppliers } from '../handlers/get_suppliers';

// Test supplier data
const testSupplier1: CreateSupplierInput = {
  name: 'MedSupply Corp',
  phone: '+1234567890',
  email: 'contact@medsupply.com',
  address: '123 Medical Plaza, Health City'
};

const testSupplier2: CreateSupplierInput = {
  name: 'PharmaDist Inc',
  phone: '+0987654321',
  email: 'sales@pharmadist.com',
  address: '456 Distribution Center, Medicine Town'
};

const testSupplier3: CreateSupplierInput = {
  name: 'HealthCare Solutions',
  phone: null,
  email: null,
  address: null
};

describe('getSuppliers', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no suppliers exist', async () => {
    const result = await getSuppliers();
    expect(result).toEqual([]);
  });

  it('should return all suppliers', async () => {
    // Create test suppliers
    await db.insert(suppliersTable)
      .values([testSupplier1, testSupplier2, testSupplier3])
      .execute();

    const result = await getSuppliers();

    expect(result).toHaveLength(3);
    
    // Check first supplier
    const supplier1 = result.find(s => s.name === 'MedSupply Corp');
    expect(supplier1).toBeDefined();
    expect(supplier1!.phone).toEqual('+1234567890');
    expect(supplier1!.email).toEqual('contact@medsupply.com');
    expect(supplier1!.address).toEqual('123 Medical Plaza, Health City');
    expect(supplier1!.id).toBeDefined();
    expect(supplier1!.created_at).toBeInstanceOf(Date);

    // Check second supplier
    const supplier2 = result.find(s => s.name === 'PharmaDist Inc');
    expect(supplier2).toBeDefined();
    expect(supplier2!.phone).toEqual('+0987654321');
    expect(supplier2!.email).toEqual('sales@pharmadist.com');
    expect(supplier2!.address).toEqual('456 Distribution Center, Medicine Town');

    // Check supplier with null fields
    const supplier3 = result.find(s => s.name === 'HealthCare Solutions');
    expect(supplier3).toBeDefined();
    expect(supplier3!.phone).toBeNull();
    expect(supplier3!.email).toBeNull();
    expect(supplier3!.address).toBeNull();
  });

  it('should return suppliers with proper field types', async () => {
    await db.insert(suppliersTable)
      .values(testSupplier1)
      .execute();

    const result = await getSuppliers();

    expect(result).toHaveLength(1);
    const supplier = result[0];
    
    expect(typeof supplier.id).toBe('number');
    expect(typeof supplier.name).toBe('string');
    expect(typeof supplier.phone).toBe('string');
    expect(typeof supplier.email).toBe('string');
    expect(typeof supplier.address).toBe('string');
    expect(supplier.created_at).toBeInstanceOf(Date);
  });

  it('should handle suppliers with mixed null and non-null contact info', async () => {
    const mixedSupplier: CreateSupplierInput = {
      name: 'Mixed Contact Supplier',
      phone: '+1111111111',
      email: null,
      address: '789 Mixed Ave'
    };

    await db.insert(suppliersTable)
      .values(mixedSupplier)
      .execute();

    const result = await getSuppliers();

    expect(result).toHaveLength(1);
    const supplier = result[0];
    
    expect(supplier.name).toEqual('Mixed Contact Supplier');
    expect(supplier.phone).toEqual('+1111111111');
    expect(supplier.email).toBeNull();
    expect(supplier.address).toEqual('789 Mixed Ave');
  });
});
