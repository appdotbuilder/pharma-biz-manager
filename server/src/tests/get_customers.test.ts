
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { customersTable } from '../db/schema';
import { type CreateCustomerInput } from '../schema';
import { getCustomers } from '../handlers/get_customers';

// Test customer data
const testCustomer1: CreateCustomerInput = {
  name: 'John Doe',
  phone: '555-1234',
  email: 'john@example.com',
  address: '123 Main St'
};

const testCustomer2: CreateCustomerInput = {
  name: 'Jane Smith',
  phone: '555-5678',
  email: 'jane@example.com',
  address: '456 Oak Ave'
};

const testCustomer3: CreateCustomerInput = {
  name: 'Bob Johnson',
  phone: null,
  email: null,
  address: null
};

describe('getCustomers', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no customers exist', async () => {
    const result = await getCustomers();

    expect(result).toEqual([]);
  });

  it('should return all customers', async () => {
    // Create test customers
    await db.insert(customersTable).values([
      testCustomer1,
      testCustomer2,
      testCustomer3
    ]).execute();

    const result = await getCustomers();

    expect(result).toHaveLength(3);
    
    // Check first customer
    const john = result.find(c => c.name === 'John Doe');
    expect(john).toBeDefined();
    expect(john!.phone).toEqual('555-1234');
    expect(john!.email).toEqual('john@example.com');
    expect(john!.address).toEqual('123 Main St');
    expect(john!.id).toBeDefined();
    expect(john!.created_at).toBeInstanceOf(Date);

    // Check second customer
    const jane = result.find(c => c.name === 'Jane Smith');
    expect(jane).toBeDefined();
    expect(jane!.phone).toEqual('555-5678');
    expect(jane!.email).toEqual('jane@example.com');
    expect(jane!.address).toEqual('456 Oak Ave');

    // Check customer with null values
    const bob = result.find(c => c.name === 'Bob Johnson');
    expect(bob).toBeDefined();
    expect(bob!.phone).toBeNull();
    expect(bob!.email).toBeNull();
    expect(bob!.address).toBeNull();
  });

  it('should return customers in database insertion order', async () => {
    // Insert customers in specific order
    await db.insert(customersTable).values(testCustomer1).execute();
    await db.insert(customersTable).values(testCustomer2).execute();
    await db.insert(customersTable).values(testCustomer3).execute();

    const result = await getCustomers();

    expect(result).toHaveLength(3);
    expect(result[0].name).toEqual('John Doe');
    expect(result[1].name).toEqual('Jane Smith');
    expect(result[2].name).toEqual('Bob Johnson');
  });

  it('should include all required customer fields', async () => {
    await db.insert(customersTable).values(testCustomer1).execute();

    const result = await getCustomers();

    expect(result).toHaveLength(1);
    const customer = result[0];

    // Verify all schema fields are present
    expect(typeof customer.id).toBe('number');
    expect(typeof customer.name).toBe('string');
    expect(customer.phone === null || typeof customer.phone === 'string').toBe(true);
    expect(customer.email === null || typeof customer.email === 'string').toBe(true);
    expect(customer.address === null || typeof customer.address === 'string').toBe(true);
    expect(customer.created_at).toBeInstanceOf(Date);
  });
});
