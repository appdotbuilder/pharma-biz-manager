
import { db } from '../db';
import { customersTable } from '../db/schema';
import { type Customer } from '../schema';

export async function getCustomers(): Promise<Customer[]> {
  try {
    const results = await db.select()
      .from(customersTable)
      .execute();

    return results;
  } catch (error) {
    console.error('Failed to fetch customers:', error);
    throw error;
  }
}
