
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { customersTable } from '../db/schema';
import { type CreateCustomerInput, type UpdateCustomerInput } from '../schema';
import { updateCustomer } from '../handlers/update_customer';
import { eq } from 'drizzle-orm';

// Test data
const createTestCustomer: CreateCustomerInput = {
  name: 'John Doe',
  phone: '123-456-7890',
  email: 'john@example.com',
  address: '123 Main St'
};

describe('updateCustomer', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update customer with all fields', async () => {
    // Create initial customer
    const created = await db.insert(customersTable)
      .values(createTestCustomer)
      .returning()
      .execute();

    const customerId = created[0].id;

    const updateInput: UpdateCustomerInput = {
      id: customerId,
      name: 'Jane Smith',
      phone: '987-654-3210',
      email: 'jane@example.com',
      address: '456 Oak Ave'
    };

    const result = await updateCustomer(updateInput);

    expect(result.id).toEqual(customerId);
    expect(result.name).toEqual('Jane Smith');
    expect(result.phone).toEqual('987-654-3210');
    expect(result.email).toEqual('jane@example.com');
    expect(result.address).toEqual('456 Oak Ave');
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should update customer with partial fields', async () => {
    // Create initial customer
    const created = await db.insert(customersTable)
      .values(createTestCustomer)
      .returning()
      .execute();

    const customerId = created[0].id;

    const updateInput: UpdateCustomerInput = {
      id: customerId,
      name: 'Updated Name',
      email: 'updated@example.com'
    };

    const result = await updateCustomer(updateInput);

    expect(result.id).toEqual(customerId);
    expect(result.name).toEqual('Updated Name');
    expect(result.phone).toEqual('123-456-7890'); // Should remain unchanged
    expect(result.email).toEqual('updated@example.com');
    expect(result.address).toEqual('123 Main St'); // Should remain unchanged
  });

  it('should handle null values correctly', async () => {
    // Create initial customer
    const created = await db.insert(customersTable)
      .values(createTestCustomer)
      .returning()
      .execute();

    const customerId = created[0].id;

    const updateInput: UpdateCustomerInput = {
      id: customerId,
      phone: null,
      email: null,
      address: null
    };

    const result = await updateCustomer(updateInput);

    expect(result.id).toEqual(customerId);
    expect(result.name).toEqual('John Doe'); // Should remain unchanged
    expect(result.phone).toBeNull();
    expect(result.email).toBeNull();
    expect(result.address).toBeNull();
  });

  it('should save updated customer to database', async () => {
    // Create initial customer
    const created = await db.insert(customersTable)
      .values(createTestCustomer)
      .returning()
      .execute();

    const customerId = created[0].id;

    const updateInput: UpdateCustomerInput = {
      id: customerId,
      name: 'Database Test Name'
    };

    await updateCustomer(updateInput);

    // Verify changes in database
    const customers = await db.select()
      .from(customersTable)
      .where(eq(customersTable.id, customerId))
      .execute();

    expect(customers).toHaveLength(1);
    expect(customers[0].name).toEqual('Database Test Name');
    expect(customers[0].phone).toEqual('123-456-7890'); // Should remain unchanged
  });

  it('should return unchanged customer when no fields provided', async () => {
    // Create initial customer
    const created = await db.insert(customersTable)
      .values(createTestCustomer)
      .returning()
      .execute();

    const customerId = created[0].id;

    const updateInput: UpdateCustomerInput = {
      id: customerId
    };

    const result = await updateCustomer(updateInput);

    expect(result.id).toEqual(customerId);
    expect(result.name).toEqual('John Doe');
    expect(result.phone).toEqual('123-456-7890');
    expect(result.email).toEqual('john@example.com');
    expect(result.address).toEqual('123 Main St');
  });

  it('should throw error for non-existent customer', async () => {
    const updateInput: UpdateCustomerInput = {
      id: 999,
      name: 'Non-existent Customer'
    };

    expect(updateCustomer(updateInput)).rejects.toThrow(/Customer with id 999 not found/i);
  });
});
