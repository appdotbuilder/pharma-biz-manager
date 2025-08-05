
import { z } from 'zod';

// Product/Medicine schema
export const productSchema = z.object({
  id: z.number(),
  name: z.string(),
  current_stock: z.number().int(),
  selling_price: z.number(),
  purchase_price: z.number(),
  expiration_date: z.coerce.date(),
  created_at: z.coerce.date()
});

export type Product = z.infer<typeof productSchema>;

export const createProductInputSchema = z.object({
  name: z.string().min(1),
  current_stock: z.number().int().nonnegative(),
  selling_price: z.number().positive(),
  purchase_price: z.number().positive(),
  expiration_date: z.coerce.date()
});

export type CreateProductInput = z.infer<typeof createProductInputSchema>;

export const updateProductInputSchema = z.object({
  id: z.number(),
  name: z.string().min(1).optional(),
  current_stock: z.number().int().nonnegative().optional(),
  selling_price: z.number().positive().optional(),
  purchase_price: z.number().positive().optional(),
  expiration_date: z.coerce.date().optional()
});

export type UpdateProductInput = z.infer<typeof updateProductInputSchema>;

// Customer schema
export const customerSchema = z.object({
  id: z.number(),
  name: z.string(),
  phone: z.string().nullable(),
  email: z.string().nullable(),
  address: z.string().nullable(),
  created_at: z.coerce.date()
});

export type Customer = z.infer<typeof customerSchema>;

export const createCustomerInputSchema = z.object({
  name: z.string().min(1),
  phone: z.string().nullable(),
  email: z.string().email().nullable(),
  address: z.string().nullable()
});

export type CreateCustomerInput = z.infer<typeof createCustomerInputSchema>;

export const updateCustomerInputSchema = z.object({
  id: z.number(),
  name: z.string().min(1).optional(),
  phone: z.string().nullable().optional(),
  email: z.string().email().nullable().optional(),
  address: z.string().nullable().optional()
});

export type UpdateCustomerInput = z.infer<typeof updateCustomerInputSchema>;

// Supplier schema
export const supplierSchema = z.object({
  id: z.number(),
  name: z.string(),
  phone: z.string().nullable(),
  email: z.string().nullable(),
  address: z.string().nullable(),
  created_at: z.coerce.date()
});

export type Supplier = z.infer<typeof supplierSchema>;

export const createSupplierInputSchema = z.object({
  name: z.string().min(1),
  phone: z.string().nullable(),
  email: z.string().email().nullable(),
  address: z.string().nullable()
});

export type CreateSupplierInput = z.infer<typeof createSupplierInputSchema>;

export const updateSupplierInputSchema = z.object({
  id: z.number(),
  name: z.string().min(1).optional(),
  phone: z.string().nullable().optional(),
  email: z.string().email().nullable().optional(),
  address: z.string().nullable().optional()
});

export type UpdateSupplierInput = z.infer<typeof updateSupplierInputSchema>;

// Sales Transaction schema
export const salesTransactionSchema = z.object({
  id: z.number(),
  transaction_date: z.coerce.date(),
  total_amount: z.number(),
  customer_id: z.number().nullable(),
  created_at: z.coerce.date()
});

export type SalesTransaction = z.infer<typeof salesTransactionSchema>;

export const createSalesTransactionInputSchema = z.object({
  customer_id: z.number().nullable(),
  items: z.array(z.object({
    product_id: z.number(),
    quantity: z.number().int().positive(),
    unit_price: z.number().positive()
  })).min(1)
});

export type CreateSalesTransactionInput = z.infer<typeof createSalesTransactionInputSchema>;

// Sales Transaction Item schema
export const salesTransactionItemSchema = z.object({
  id: z.number(),
  transaction_id: z.number(),
  product_id: z.number(),
  quantity: z.number().int(),
  unit_price: z.number(),
  subtotal: z.number(),
  created_at: z.coerce.date()
});

export type SalesTransactionItem = z.infer<typeof salesTransactionItemSchema>;

// Prescription schema
export const prescriptionSchema = z.object({
  id: z.number(),
  patient_name: z.string(),
  doctor_name: z.string(),
  prescription_date: z.coerce.date(),
  created_at: z.coerce.date()
});

export type Prescription = z.infer<typeof prescriptionSchema>;

export const createPrescriptionInputSchema = z.object({
  patient_name: z.string().min(1),
  doctor_name: z.string().min(1),
  prescription_date: z.coerce.date(),
  medicines: z.array(z.object({
    product_id: z.number(),
    dosage: z.string().min(1),
    instructions: z.string().nullable()
  })).min(1)
});

export type CreatePrescriptionInput = z.infer<typeof createPrescriptionInputSchema>;

export const updatePrescriptionInputSchema = z.object({
  id: z.number(),
  patient_name: z.string().min(1).optional(),
  doctor_name: z.string().min(1).optional(),
  prescription_date: z.coerce.date().optional()
});

export type UpdatePrescriptionInput = z.infer<typeof updatePrescriptionInputSchema>;

// Prescription Medicine schema
export const prescriptionMedicineSchema = z.object({
  id: z.number(),
  prescription_id: z.number(),
  product_id: z.number(),
  dosage: z.string(),
  instructions: z.string().nullable(),
  created_at: z.coerce.date()
});

export type PrescriptionMedicine = z.infer<typeof prescriptionMedicineSchema>;
