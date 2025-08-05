
import { db } from '../db';
import { salesTransactionsTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type SalesTransaction } from '../schema';

export async function getSalesTransactionById(id: number): Promise<SalesTransaction | null> {
  try {
    const results = await db.select()
      .from(salesTransactionsTable)
      .where(eq(salesTransactionsTable.id, id))
      .execute();

    if (results.length === 0) {
      return null;
    }

    const transaction = results[0];
    return {
      ...transaction,
      total_amount: parseFloat(transaction.total_amount) // Convert numeric field back to number
    };
  } catch (error) {
    console.error('Failed to get sales transaction:', error);
    throw error;
  }
}
