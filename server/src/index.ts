
import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';
import { z } from 'zod';

// Import schemas
import {
  createProductInputSchema,
  updateProductInputSchema,
  createCustomerInputSchema,
  updateCustomerInputSchema,
  createSupplierInputSchema,
  updateSupplierInputSchema,
  createSalesTransactionInputSchema,
  createPrescriptionInputSchema,
  updatePrescriptionInputSchema
} from './schema';

// Import handlers
import { createProduct } from './handlers/create_product';
import { getProducts } from './handlers/get_products';
import { updateProduct } from './handlers/update_product';
import { createCustomer } from './handlers/create_customer';
import { getCustomers } from './handlers/get_customers';
import { updateCustomer } from './handlers/update_customer';
import { createSupplier } from './handlers/create_supplier';
import { getSuppliers } from './handlers/get_suppliers';
import { updateSupplier } from './handlers/update_supplier';
import { createSalesTransaction } from './handlers/create_sales_transaction';
import { getSalesTransactions } from './handlers/get_sales_transactions';
import { getSalesTransactionById } from './handlers/get_sales_transaction_by_id';
import { createPrescription } from './handlers/create_prescription';
import { getPrescriptions } from './handlers/get_prescriptions';
import { getPrescriptionById } from './handlers/get_prescription_by_id';
import { updatePrescription } from './handlers/update_prescription';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),

  // Product/Medicine routes
  createProduct: publicProcedure
    .input(createProductInputSchema)
    .mutation(({ input }) => createProduct(input)),
  getProducts: publicProcedure
    .query(() => getProducts()),
  updateProduct: publicProcedure
    .input(updateProductInputSchema)
    .mutation(({ input }) => updateProduct(input)),

  // Customer routes
  createCustomer: publicProcedure
    .input(createCustomerInputSchema)
    .mutation(({ input }) => createCustomer(input)),
  getCustomers: publicProcedure
    .query(() => getCustomers()),
  updateCustomer: publicProcedure
    .input(updateCustomerInputSchema)
    .mutation(({ input }) => updateCustomer(input)),

  // Supplier routes
  createSupplier: publicProcedure
    .input(createSupplierInputSchema)
    .mutation(({ input }) => createSupplier(input)),
  getSuppliers: publicProcedure
    .query(() => getSuppliers()),
  updateSupplier: publicProcedure
    .input(updateSupplierInputSchema)
    .mutation(({ input }) => updateSupplier(input)),

  // Sales Transaction routes
  createSalesTransaction: publicProcedure
    .input(createSalesTransactionInputSchema)
    .mutation(({ input }) => createSalesTransaction(input)),
  getSalesTransactions: publicProcedure
    .query(() => getSalesTransactions()),
  getSalesTransactionById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(({ input }) => getSalesTransactionById(input.id)),

  // Prescription routes
  createPrescription: publicProcedure
    .input(createPrescriptionInputSchema)
    .mutation(({ input }) => createPrescription(input)),
  getPrescriptions: publicProcedure
    .query(() => getPrescriptions()),
  getPrescriptionById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(({ input }) => getPrescriptionById(input.id)),
  updatePrescription: publicProcedure
    .input(updatePrescriptionInputSchema)
    .mutation(({ input }) => updatePrescription(input)),
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors()(req, res, next);
    },
    router: appRouter,
    createContext() {
      return {};
    },
  });
  server.listen(port);
  console.log(`TRPC server listening at port: ${port}`);
}

start();
