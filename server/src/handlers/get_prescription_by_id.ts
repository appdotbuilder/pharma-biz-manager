
import { db } from '../db';
import { prescriptionsTable } from '../db/schema';
import { type Prescription } from '../schema';
import { eq } from 'drizzle-orm';

export const getPrescriptionById = async (id: number): Promise<Prescription | null> => {
  try {
    // Get the prescription record
    const prescriptionResults = await db.select()
      .from(prescriptionsTable)
      .where(eq(prescriptionsTable.id, id))
      .execute();

    if (prescriptionResults.length === 0) {
      return null;
    }

    const prescription = prescriptionResults[0];

    // Return prescription with proper type conversion
    return {
      id: prescription.id,
      patient_name: prescription.patient_name,
      doctor_name: prescription.doctor_name,
      prescription_date: new Date(prescription.prescription_date),
      created_at: prescription.created_at
    };
  } catch (error) {
    console.error('Failed to get prescription by id:', error);
    throw error;
  }
};
