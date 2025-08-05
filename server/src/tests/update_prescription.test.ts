
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { prescriptionsTable, productsTable, prescriptionMedicinesTable } from '../db/schema';
import { type UpdatePrescriptionInput } from '../schema';
import { updatePrescription } from '../handlers/update_prescription';
import { eq } from 'drizzle-orm';

describe('updatePrescription', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update a prescription with all fields', async () => {
    // Create test product first
    const productResult = await db.insert(productsTable)
      .values({
        name: 'Test Medicine',
        current_stock: 100,
        selling_price: '10.50',
        purchase_price: '7.00',
        expiration_date: '2025-12-31'
      })
      .returning()
      .execute();

    // Create prescription
    const prescriptionResult = await db.insert(prescriptionsTable)
      .values({
        patient_name: 'Original Patient',
        doctor_name: 'Original Doctor',
        prescription_date: '2024-01-15'
      })
      .returning()
      .execute();

    // Create prescription medicine
    await db.insert(prescriptionMedicinesTable)
      .values({
        prescription_id: prescriptionResult[0].id,
        product_id: productResult[0].id,
        dosage: '2 tablets daily',
        instructions: 'Take with food'
      })
      .execute();

    const updateInput: UpdatePrescriptionInput = {
      id: prescriptionResult[0].id,
      patient_name: 'Updated Patient',
      doctor_name: 'Updated Doctor',
      prescription_date: new Date('2024-02-20')
    };

    const result = await updatePrescription(updateInput);

    expect(result.id).toEqual(prescriptionResult[0].id);
    expect(result.patient_name).toEqual('Updated Patient');
    expect(result.doctor_name).toEqual('Updated Doctor');
    expect(result.prescription_date).toEqual(new Date('2024-02-20'));
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should update prescription with partial fields', async () => {
    // Create test product first
    const productResult = await db.insert(productsTable)
      .values({
        name: 'Test Medicine',
        current_stock: 100,
        selling_price: '10.50',
        purchase_price: '7.00',
        expiration_date: '2025-12-31'
      })
      .returning()
      .execute();

    // Create prescription
    const prescriptionResult = await db.insert(prescriptionsTable)
      .values({
        patient_name: 'Original Patient',
        doctor_name: 'Original Doctor',
        prescription_date: '2024-01-15'
      })
      .returning()
      .execute();

    // Create prescription medicine
    await db.insert(prescriptionMedicinesTable)
      .values({
        prescription_id: prescriptionResult[0].id,
        product_id: productResult[0].id,
        dosage: '2 tablets daily',
        instructions: 'Take with food'
      })
      .execute();

    const updateInput: UpdatePrescriptionInput = {
      id: prescriptionResult[0].id,
      patient_name: 'Updated Patient Name Only'
    };

    const result = await updatePrescription(updateInput);

    expect(result.id).toEqual(prescriptionResult[0].id);
    expect(result.patient_name).toEqual('Updated Patient Name Only');
    expect(result.doctor_name).toEqual('Original Doctor'); // Should remain unchanged
    expect(result.prescription_date).toEqual(new Date('2024-01-15')); // Should remain unchanged
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save updated prescription to database', async () => {
    // Create test product first
    const productResult = await db.insert(productsTable)
      .values({
        name: 'Test Medicine',
        current_stock: 100,
        selling_price: '10.50',
        purchase_price: '7.00',
        expiration_date: '2025-12-31'
      })
      .returning()
      .execute();

    // Create prescription
    const prescriptionResult = await db.insert(prescriptionsTable)
      .values({
        patient_name: 'Original Patient',
        doctor_name: 'Original Doctor',
        prescription_date: '2024-01-15'
      })
      .returning()
      .execute();

    // Create prescription medicine
    await db.insert(prescriptionMedicinesTable)
      .values({
        prescription_id: prescriptionResult[0].id,
        product_id: productResult[0].id,
        dosage: '2 tablets daily',
        instructions: 'Take with food'
      })
      .execute();

    const updateInput: UpdatePrescriptionInput = {
      id: prescriptionResult[0].id,
      doctor_name: 'Updated Doctor Name'
    };

    await updatePrescription(updateInput);

    // Verify changes were saved to database
    const prescriptions = await db.select()
      .from(prescriptionsTable)
      .where(eq(prescriptionsTable.id, prescriptionResult[0].id))
      .execute();

    expect(prescriptions).toHaveLength(1);
    expect(prescriptions[0].patient_name).toEqual('Original Patient'); // Unchanged
    expect(prescriptions[0].doctor_name).toEqual('Updated Doctor Name'); // Changed
    expect(prescriptions[0].prescription_date).toEqual('2024-01-15'); // Unchanged
    expect(prescriptions[0].created_at).toBeInstanceOf(Date);
  });

  it('should throw error for non-existent prescription', async () => {
    const updateInput: UpdatePrescriptionInput = {
      id: 999,
      patient_name: 'Test Patient'
    };

    expect(updatePrescription(updateInput)).rejects.toThrow(/prescription with id 999 not found/i);
  });
});
