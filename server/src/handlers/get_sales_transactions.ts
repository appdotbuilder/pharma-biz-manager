
import { db } from '../db';
import { salesTransactionsTable, customersTable, salesTransactionItemsTable, productsTable } from '../db/schema';
import { type SalesTransaction } from '../schema';

export const getSalesTransactions = async (): Promise<SalesTransaction[]> => {
  try {
    const results = await db.select()
      .from(salesTransactionsTable)
      .execute();

    // Convert numeric fields back to numbers before returning
    return results.map(transaction => ({
      ...transaction,
      total_amount: parseFloat(transaction.total_amount)
    }));
  } catch (error) {
    console.error('Failed to fetch sales transactions:', error);
    throw error;
  }
};
