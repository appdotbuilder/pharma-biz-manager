
import { serial, text, pgTable, timestamp, numeric, integer, date } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const productsTable = pgTable('products', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  current_stock: integer('current_stock').notNull(),
  selling_price: numeric('selling_price', { precision: 10, scale: 2 }).notNull(),
  purchase_price: numeric('purchase_price', { precision: 10, scale: 2 }).notNull(),
  expiration_date: date('expiration_date').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

export const customersTable = pgTable('customers', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  phone: text('phone'),
  email: text('email'),
  address: text('address'),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

export const suppliersTable = pgTable('suppliers', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  phone: text('phone'),
  email: text('email'),
  address: text('address'),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

export const salesTransactionsTable = pgTable('sales_transactions', {
  id: serial('id').primaryKey(),
  transaction_date: timestamp('transaction_date').defaultNow().notNull(),
  total_amount: numeric('total_amount', { precision: 10, scale: 2 }).notNull(),
  customer_id: integer('customer_id'),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

export const salesTransactionItemsTable = pgTable('sales_transaction_items', {
  id: serial('id').primaryKey(),
  transaction_id: integer('transaction_id').notNull(),
  product_id: integer('product_id').notNull(),
  quantity: integer('quantity').notNull(),
  unit_price: numeric('unit_price', { precision: 10, scale: 2 }).notNull(),
  subtotal: numeric('subtotal', { precision: 10, scale: 2 }).notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

export const prescriptionsTable = pgTable('prescriptions', {
  id: serial('id').primaryKey(),
  patient_name: text('patient_name').notNull(),
  doctor_name: text('doctor_name').notNull(),
  prescription_date: date('prescription_date').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

export const prescriptionMedicinesTable = pgTable('prescription_medicines', {
  id: serial('id').primaryKey(),
  prescription_id: integer('prescription_id').notNull(),
  product_id: integer('product_id').notNull(),
  dosage: text('dosage').notNull(),
  instructions: text('instructions'),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Relations
export const productsRelations = relations(productsTable, ({ many }) => ({
  salesTransactionItems: many(salesTransactionItemsTable),
  prescriptionMedicines: many(prescriptionMedicinesTable),
}));

export const customersRelations = relations(customersTable, ({ many }) => ({
  salesTransactions: many(salesTransactionsTable),
}));

export const salesTransactionsRelations = relations(salesTransactionsTable, ({ one, many }) => ({
  customer: one(customersTable, {
    fields: [salesTransactionsTable.customer_id],
    references: [customersTable.id],
  }),
  items: many(salesTransactionItemsTable),
}));

export const salesTransactionItemsRelations = relations(salesTransactionItemsTable, ({ one }) => ({
  transaction: one(salesTransactionsTable, {
    fields: [salesTransactionItemsTable.transaction_id],
    references: [salesTransactionsTable.id],
  }),
  product: one(productsTable, {
    fields: [salesTransactionItemsTable.product_id],
    references: [productsTable.id],
  }),
}));

export const prescriptionsRelations = relations(prescriptionsTable, ({ many }) => ({
  medicines: many(prescriptionMedicinesTable),
}));

export const prescriptionMedicinesRelations = relations(prescriptionMedicinesTable, ({ one }) => ({
  prescription: one(prescriptionsTable, {
    fields: [prescriptionMedicinesTable.prescription_id],
    references: [prescriptionsTable.id],
  }),
  product: one(productsTable, {
    fields: [prescriptionMedicinesTable.product_id],
    references: [productsTable.id],
  }),
}));

// Export all tables for proper query building
export const tables = {
  products: productsTable,
  customers: customersTable,
  suppliers: suppliersTable,
  salesTransactions: salesTransactionsTable,
  salesTransactionItems: salesTransactionItemsTable,
  prescriptions: prescriptionsTable,
  prescriptionMedicines: prescriptionMedicinesTable,
};
