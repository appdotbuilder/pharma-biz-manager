
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { customersTable } from '../db/schema';
import { type CreateCustomerInput } from '../schema';
import { createCustomer } from '../handlers/create_customer';
import { eq } from 'drizzle-orm';

// Test input with all fields
const testInput: CreateCustomerInput = {
  name: 'John Doe',
  phone: '+1234567890',
  email: 'john.doe@example.com',
  address: '123 Main St, City, State'
};

// Test input with minimal required fields
const minimalInput: CreateCustomerInput = {
  name: 'Jane Smith',
  phone: null,
  email: null,
  address: null
};

describe('createCustomer', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a customer with all fields', async () => {
    const result = await createCustomer(testInput);

    // Basic field validation
    expect(result.name).toEqual('John Doe');
    expect(result.phone).toEqual('+1234567890');
    expect(result.email).toEqual('john.doe@example.com');
    expect(result.address).toEqual('123 Main St, City, State');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should create a customer with minimal fields', async () => {
    const result = await createCustomer(minimalInput);

    // Basic field validation
    expect(result.name).toEqual('Jane Smith');
    expect(result.phone).toBeNull();
    expect(result.email).toBeNull();
    expect(result.address).toBeNull();
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save customer to database', async () => {
    const result = await createCustomer(testInput);

    // Query using proper drizzle syntax
    const customers = await db.select()
      .from(customersTable)
      .where(eq(customersTable.id, result.id))
      .execute();

    expect(customers).toHaveLength(1);
    expect(customers[0].name).toEqual('John Doe');
    expect(customers[0].phone).toEqual('+1234567890');
    expect(customers[0].email).toEqual('john.doe@example.com');
    expect(customers[0].address).toEqual('123 Main St, City, State');
    expect(customers[0].created_at).toBeInstanceOf(Date);
  });

  it('should handle null values correctly', async () => {
    const result = await createCustomer(minimalInput);

    // Verify in database
    const customers = await db.select()
      .from(customersTable)
      .where(eq(customersTable.id, result.id))
      .execute();

    expect(customers).toHaveLength(1);
    expect(customers[0].name).toEqual('Jane Smith');
    expect(customers[0].phone).toBeNull();
    expect(customers[0].email).toBeNull();
    expect(customers[0].address).toBeNull();
  });

  it('should create multiple customers with unique IDs', async () => {
    const customer1 = await createCustomer(testInput);
    const customer2 = await createCustomer({
      ...minimalInput,
      name: 'Different Customer'
    });

    expect(customer1.id).not.toEqual(customer2.id);
    expect(customer1.name).toEqual('John Doe');
    expect(customer2.name).toEqual('Different Customer');

    // Verify both exist in database
    const allCustomers = await db.select()
      .from(customersTable)
      .execute();

    expect(allCustomers).toHaveLength(2);
  });
});
