
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { prescriptionsTable, productsTable, prescriptionMedicinesTable } from '../db/schema';
import { getPrescriptionById } from '../handlers/get_prescription_by_id';

const testPrescription = {
  patient_name: 'John Doe',
  doctor_name: 'Dr. Smith',
  prescription_date: '2024-01-15'
};

const testProduct = {
  name: 'Aspirin',
  current_stock: 100,
  selling_price: '5.99',
  purchase_price: '3.50',
  expiration_date: '2025-12-31'
};

describe('getPrescriptionById', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return prescription when found', async () => {
    // Create test prescription
    const prescriptionResult = await db.insert(prescriptionsTable)
      .values(testPrescription)
      .returning()
      .execute();

    const prescriptionId = prescriptionResult[0].id;

    const result = await getPrescriptionById(prescriptionId);

    expect(result).toBeDefined();
    expect(result!.id).toBe(prescriptionId);
    expect(result!.patient_name).toBe('John Doe');
    expect(result!.doctor_name).toBe('Dr. Smith');
    expect(result!.prescription_date).toBeInstanceOf(Date);
    expect(result!.created_at).toBeInstanceOf(Date);
  });

  it('should return null when prescription not found', async () => {
    const result = await getPrescriptionById(999);

    expect(result).toBeNull();
  });

  it('should handle prescription with medicines correctly', async () => {
    // Create test product first
    const productResult = await db.insert(productsTable)
      .values(testProduct)
      .returning()
      .execute();

    const productId = productResult[0].id;

    // Create test prescription
    const prescriptionResult = await db.insert(prescriptionsTable)
      .values(testPrescription)
      .returning()
      .execute();

    const prescriptionId = prescriptionResult[0].id;

    // Add medicine to prescription
    await db.insert(prescriptionMedicinesTable)
      .values({
        prescription_id: prescriptionId,
        product_id: productId,
        dosage: '2 tablets twice daily',
        instructions: 'Take with food'
      })
      .execute();

    const result = await getPrescriptionById(prescriptionId);

    expect(result).toBeDefined();
    expect(result!.id).toBe(prescriptionId);
    expect(result!.patient_name).toBe('John Doe');
    expect(result!.doctor_name).toBe('Dr. Smith');
  });

  it('should handle date conversion correctly', async () => {
    // Create prescription with specific date
    const specificDate = '2024-03-20';
    const prescriptionResult = await db.insert(prescriptionsTable)
      .values({
        ...testPrescription,
        prescription_date: specificDate
      })
      .returning()
      .execute();

    const prescriptionId = prescriptionResult[0].id;

    const result = await getPrescriptionById(prescriptionId);

    expect(result).toBeDefined();
    expect(result!.prescription_date).toBeInstanceOf(Date);
    expect(result!.prescription_date.toISOString().split('T')[0]).toBe(specificDate);
  });
});
