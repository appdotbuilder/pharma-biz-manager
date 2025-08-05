
import { db } from '../db';
import { prescriptionsTable } from '../db/schema';
import { type Prescription } from '../schema';
import { and, gte, lte, ilike, type SQL, desc } from 'drizzle-orm';

export interface GetPrescriptionsFilters {
  patient_name?: string;
  doctor_name?: string;
  start_date?: Date;
  end_date?: Date;
}

export async function getPrescriptions(filters: GetPrescriptionsFilters = {}): Promise<Prescription[]> {
  try {
    const conditions: SQL<unknown>[] = [];

    // Filter by patient name (case-insensitive partial match)
    if (filters.patient_name) {
      conditions.push(ilike(prescriptionsTable.patient_name, `%${filters.patient_name}%`));
    }

    // Filter by doctor name (case-insensitive partial match)
    if (filters.doctor_name) {
      conditions.push(ilike(prescriptionsTable.doctor_name, `%${filters.doctor_name}%`));
    }

    // Filter by date range - convert dates to strings for comparison
    if (filters.start_date) {
      const startDateStr = filters.start_date.toISOString().split('T')[0];
      conditions.push(gte(prescriptionsTable.prescription_date, startDateStr));
    }

    if (filters.end_date) {
      const endDateStr = filters.end_date.toISOString().split('T')[0];
      conditions.push(lte(prescriptionsTable.prescription_date, endDateStr));
    }

    // Build the final query
    const baseQuery = db.select().from(prescriptionsTable);
    
    const queryWithConditions = conditions.length > 0
      ? baseQuery.where(conditions.length === 1 ? conditions[0] : and(...conditions))
      : baseQuery;

    const finalQuery = queryWithConditions.orderBy(desc(prescriptionsTable.prescription_date));

    const results = await finalQuery.execute();

    // Convert string dates to Date objects to match Prescription type
    return results.map(prescription => ({
      ...prescription,
      prescription_date: new Date(prescription.prescription_date)
    }));
  } catch (error) {
    console.error('Failed to fetch prescriptions:', error);
    throw error;
  }
}
