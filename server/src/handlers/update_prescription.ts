
import { db } from '../db';
import { prescriptionsTable } from '../db/schema';
import { type UpdatePrescriptionInput, type Prescription } from '../schema';
import { eq } from 'drizzle-orm';

export const updatePrescription = async (input: UpdatePrescriptionInput): Promise<Prescription> => {
  try {
    // First verify the prescription exists
    const existingPrescription = await db.select()
      .from(prescriptionsTable)
      .where(eq(prescriptionsTable.id, input.id))
      .execute();

    if (existingPrescription.length === 0) {
      throw new Error(`Prescription with id ${input.id} not found`);
    }

    // Build update object with only provided fields
    const updateData: Partial<{
      patient_name: string;
      doctor_name: string;
      prescription_date: string;
    }> = {};

    if (input.patient_name !== undefined) {
      updateData.patient_name = input.patient_name;
    }

    if (input.doctor_name !== undefined) {
      updateData.doctor_name = input.doctor_name;
    }

    if (input.prescription_date !== undefined) {
      updateData.prescription_date = input.prescription_date.toISOString().split('T')[0];
    }

    // Perform the update
    const result = await db.update(prescriptionsTable)
      .set(updateData)
      .where(eq(prescriptionsTable.id, input.id))
      .returning()
      .execute();

    const prescription = result[0];
    return {
      ...prescription,
      prescription_date: new Date(prescription.prescription_date)
    };
  } catch (error) {
    console.error('Prescription update failed:', error);
    throw error;
  }
};
