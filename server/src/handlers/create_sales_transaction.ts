
import { db } from '../db';
import { salesTransactionsTable, salesTransactionItemsTable, productsTable } from '../db/schema';
import { type CreateSalesTransactionInput, type SalesTransaction } from '../schema';
import { eq, sql } from 'drizzle-orm';

export const createSalesTransaction = async (input: CreateSalesTransactionInput): Promise<SalesTransaction> => {
  try {
    // Start a database transaction
    const result = await db.transaction(async (tx) => {
      // First, validate all products exist and have sufficient stock
      for (const item of input.items) {
        const products = await tx.select()
          .from(productsTable)
          .where(eq(productsTable.id, item.product_id))
          .execute();

        if (products.length === 0) {
          throw new Error(`Product with id ${item.product_id} not found`);
        }

        const product = products[0];
        if (product.current_stock < item.quantity) {
          throw new Error(`Insufficient stock for product ${product.name}. Available: ${product.current_stock}, Required: ${item.quantity}`);
        }
      }

      // Calculate total amount
      const totalAmount = input.items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);

      // Create the sales transaction
      const transactionResult = await tx.insert(salesTransactionsTable)
        .values({
          total_amount: totalAmount.toString(), // Convert number to string for numeric column
          customer_id: input.customer_id
        })
        .returning()
        .execute();

      const transaction = transactionResult[0];

      // Create transaction items and update product stock
      for (const item of input.items) {
        // Create transaction item
        const subtotal = item.quantity * item.unit_price;
        
        await tx.insert(salesTransactionItemsTable)
          .values({
            transaction_id: transaction.id,
            product_id: item.product_id,
            quantity: item.quantity,
            unit_price: item.unit_price.toString(), // Convert number to string for numeric column
            subtotal: subtotal.toString() // Convert number to string for numeric column
          })
          .execute();

        // Update product stock
        await tx.update(productsTable)
          .set({
            current_stock: sql`current_stock - ${item.quantity}`
          })
          .where(eq(productsTable.id, item.product_id))
          .execute();
      }

      return transaction;
    });

    // Convert numeric fields back to numbers before returning
    return {
      ...result,
      total_amount: parseFloat(result.total_amount)
    };
  } catch (error) {
    console.error('Sales transaction creation failed:', error);
    throw error;
  }
};
