
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { salesTransactionsTable, customersTable } from '../db/schema';
import { getSalesTransactionById } from '../handlers/get_sales_transaction_by_id';

describe('getSalesTransactionById', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return a sales transaction by id', async () => {
    // Create a customer first
    const customerResult = await db.insert(customersTable)
      .values({
        name: 'Test Customer',
        phone: '123-456-7890',
        email: 'test@example.com',
        address: '123 Test St'
      })
      .returning()
      .execute();

    const customerId = customerResult[0].id;

    // Create a sales transaction
    const transactionResult = await db.insert(salesTransactionsTable)
      .values({
        total_amount: '99.99',
        customer_id: customerId
      })
      .returning()
      .execute();

    const transactionId = transactionResult[0].id;

    // Test the handler
    const result = await getSalesTransactionById(transactionId);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(transactionId);
    expect(result!.total_amount).toEqual(99.99);
    expect(typeof result!.total_amount).toEqual('number');
    expect(result!.customer_id).toEqual(customerId);
    expect(result!.transaction_date).toBeInstanceOf(Date);
    expect(result!.created_at).toBeInstanceOf(Date);
  });

  it('should return a transaction without customer', async () => {
    // Create a sales transaction without customer
    const transactionResult = await db.insert(salesTransactionsTable)
      .values({
        total_amount: '25.50',
        customer_id: null
      })
      .returning()
      .execute();

    const transactionId = transactionResult[0].id;

    // Test the handler
    const result = await getSalesTransactionById(transactionId);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(transactionId);
    expect(result!.total_amount).toEqual(25.50);
    expect(result!.customer_id).toBeNull();
    expect(result!.transaction_date).toBeInstanceOf(Date);
    expect(result!.created_at).toBeInstanceOf(Date);
  });

  it('should return null when transaction does not exist', async () => {
    const result = await getSalesTransactionById(999);

    expect(result).toBeNull();
  });

  it('should handle numeric precision correctly', async () => {
    // Create transaction with precise decimal amount
    const transactionResult = await db.insert(salesTransactionsTable)
      .values({
        total_amount: '123.45',
        customer_id: null
      })
      .returning()
      .execute();

    const transactionId = transactionResult[0].id;

    const result = await getSalesTransactionById(transactionId);

    expect(result).not.toBeNull();
    expect(result!.total_amount).toEqual(123.45);
    expect(typeof result!.total_amount).toEqual('number');
  });
});
