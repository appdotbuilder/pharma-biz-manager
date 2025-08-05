
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { prescriptionsTable, prescriptionMedicinesTable, productsTable } from '../db/schema';
import { type CreatePrescriptionInput } from '../schema';
import { createPrescription } from '../handlers/create_prescription';
import { eq } from 'drizzle-orm';

describe('createPrescription', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a prescription with medicines', async () => {
    // Create test products first
    const product1 = await db.insert(productsTable)
      .values({
        name: 'Aspirin',
        current_stock: 100,
        selling_price: '5.99',
        purchase_price: '3.99',
        expiration_date: '2024-12-31'
      })
      .returning()
      .execute();

    const product2 = await db.insert(productsTable)
      .values({
        name: 'Ibuprofen',
        current_stock: 50,
        selling_price: '8.99',
        purchase_price: '6.99',
        expiration_date: '2024-11-30'
      })
      .returning()
      .execute();

    const testInput: CreatePrescriptionInput = {
      patient_name: 'John Doe',
      doctor_name: 'Dr. Smith',
      prescription_date: new Date('2024-01-15'),
      medicines: [
        {
          product_id: product1[0].id,
          dosage: '500mg twice daily',
          instructions: 'Take with food'
        },
        {
          product_id: product2[0].id,
          dosage: '200mg as needed',
          instructions: null
        }
      ]
    };

    const result = await createPrescription(testInput);

    // Validate prescription fields
    expect(result.patient_name).toEqual('John Doe');
    expect(result.doctor_name).toEqual('Dr. Smith');
    expect(result.prescription_date).toEqual(new Date('2024-01-15'));
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save prescription to database', async () => {
    // Create test product
    const product = await db.insert(productsTable)
      .values({
        name: 'Test Medicine',
        current_stock: 25,
        selling_price: '12.50',
        purchase_price: '8.50',
        expiration_date: '2024-10-31'
      })
      .returning()
      .execute();

    const testInput: CreatePrescriptionInput = {
      patient_name: 'Jane Smith',
      doctor_name: 'Dr. Johnson',
      prescription_date: new Date('2024-02-01'),
      medicines: [
        {
          product_id: product[0].id,
          dosage: '100mg daily',
          instructions: 'Take in the morning'
        }
      ]
    };

    const result = await createPrescription(testInput);

    // Verify prescription in database
    const prescriptions = await db.select()
      .from(prescriptionsTable)
      .where(eq(prescriptionsTable.id, result.id))
      .execute();

    expect(prescriptions).toHaveLength(1);
    expect(prescriptions[0].patient_name).toEqual('Jane Smith');
    expect(prescriptions[0].doctor_name).toEqual('Dr. Johnson');
    expect(new Date(prescriptions[0].prescription_date)).toEqual(new Date('2024-02-01'));

    // Verify prescription medicines in database
    const medicines = await db.select()
      .from(prescriptionMedicinesTable)
      .where(eq(prescriptionMedicinesTable.prescription_id, result.id))
      .execute();

    expect(medicines).toHaveLength(1);
    expect(medicines[0].product_id).toEqual(product[0].id);
    expect(medicines[0].dosage).toEqual('100mg daily');
    expect(medicines[0].instructions).toEqual('Take in the morning');
  });

  it('should create multiple prescription medicines', async () => {
    // Create multiple test products
    const products = await db.insert(productsTable)
      .values([
        {
          name: 'Medicine A',
          current_stock: 30,
          selling_price: '15.00',
          purchase_price: '10.00',
          expiration_date: '2024-12-15'
        },
        {
          name: 'Medicine B',
          current_stock: 20,
          selling_price: '22.50',
          purchase_price: '18.00',
          expiration_date: '2025-01-30'
        },
        {
          name: 'Medicine C',
          current_stock: 40,
          selling_price: '7.25',
          purchase_price: '4.75',
          expiration_date: '2024-09-20'
        }
      ])
      .returning()
      .execute();

    const testInput: CreatePrescriptionInput = {
      patient_name: 'Bob Wilson',
      doctor_name: 'Dr. Brown',
      prescription_date: new Date('2024-03-10'),
      medicines: [
        {
          product_id: products[0].id,
          dosage: '250mg three times daily',
          instructions: 'Take before meals'
        },
        {
          product_id: products[1].id,
          dosage: '50mg once daily',
          instructions: 'Take at bedtime'
        },
        {
          product_id: products[2].id,
          dosage: '10mg as needed',
          instructions: null
        }
      ]
    };

    const result = await createPrescription(testInput);

    // Verify all prescription medicines were created
    const medicines = await db.select()
      .from(prescriptionMedicinesTable)
      .where(eq(prescriptionMedicinesTable.prescription_id, result.id))
      .execute();

    expect(medicines).toHaveLength(3);
    
    // Verify each medicine entry
    const medicineA = medicines.find(m => m.product_id === products[0].id);
    expect(medicineA).toBeDefined();
    expect(medicineA!.dosage).toEqual('250mg three times daily');
    expect(medicineA!.instructions).toEqual('Take before meals');

    const medicineB = medicines.find(m => m.product_id === products[1].id);
    expect(medicineB).toBeDefined();
    expect(medicineB!.dosage).toEqual('50mg once daily');
    expect(medicineB!.instructions).toEqual('Take at bedtime');

    const medicineC = medicines.find(m => m.product_id === products[2].id);
    expect(medicineC).toBeDefined();
    expect(medicineC!.dosage).toEqual('10mg as needed');
    expect(medicineC!.instructions).toBeNull();
  });

  it('should throw error when product does not exist', async () => {
    const testInput: CreatePrescriptionInput = {
      patient_name: 'Test Patient',
      doctor_name: 'Test Doctor',
      prescription_date: new Date('2024-01-01'),
      medicines: [
        {
          product_id: 999, // Non-existent product
          dosage: '100mg daily',
          instructions: 'Test instructions'
        }
      ]
    };

    await expect(createPrescription(testInput)).rejects.toThrow(/Product with id 999 does not exist/);
  });

  it('should handle null instructions correctly', async () => {
    // Create test product
    const product = await db.insert(productsTable)
      .values({
        name: 'Simple Medicine',
        current_stock: 15,
        selling_price: '9.99',
        purchase_price: '6.99',
        expiration_date: '2024-08-15'
      })
      .returning()
      .execute();

    const testInput: CreatePrescriptionInput = {
      patient_name: 'Mary Johnson',
      doctor_name: 'Dr. Davis',
      prescription_date: new Date('2024-04-20'),
      medicines: [
        {
          product_id: product[0].id,
          dosage: '75mg twice daily',
          instructions: null
        }
      ]
    };

    const result = await createPrescription(testInput);

    // Verify null instructions are handled correctly
    const medicines = await db.select()
      .from(prescriptionMedicinesTable)
      .where(eq(prescriptionMedicinesTable.prescription_id, result.id))
      .execute();

    expect(medicines).toHaveLength(1);
    expect(medicines[0].instructions).toBeNull();
  });
});
