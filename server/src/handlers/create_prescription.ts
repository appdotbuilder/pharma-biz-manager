
import { db } from '../db';
import { prescriptionsTable, prescriptionMedicinesTable, productsTable } from '../db/schema';
import { type CreatePrescriptionInput, type Prescription } from '../schema';
import { eq } from 'drizzle-orm';

export const createPrescription = async (input: CreatePrescriptionInput): Promise<Prescription> => {
  try {
    // Validate that all products exist first
    for (const medicine of input.medicines) {
      const product = await db.select()
        .from(productsTable)
        .where(eq(productsTable.id, medicine.product_id))
        .execute();
      
      if (product.length === 0) {
        throw new Error(`Product with id ${medicine.product_id} does not exist`);
      }
    }

    // Use transaction to ensure both prescription and medicines are created together
    const result = await db.transaction(async (tx) => {
      // Create the prescription
      const prescriptionResult = await tx.insert(prescriptionsTable)
        .values({
          patient_name: input.patient_name,
          doctor_name: input.doctor_name,
          prescription_date: input.prescription_date.toISOString().split('T')[0] // Convert Date to date string
        })
        .returning()
        .execute();

      const prescription = prescriptionResult[0];

      // Create prescription medicines
      for (const medicine of input.medicines) {
        await tx.insert(prescriptionMedicinesTable)
          .values({
            prescription_id: prescription.id,
            product_id: medicine.product_id,
            dosage: medicine.dosage,
            instructions: medicine.instructions
          })
          .execute();
      }

      return prescription;
    });

    return {
      ...result,
      prescription_date: new Date(result.prescription_date) // Convert date string back to Date
    };
  } catch (error) {
    console.error('Prescription creation failed:', error);
    throw error;
  }
};
