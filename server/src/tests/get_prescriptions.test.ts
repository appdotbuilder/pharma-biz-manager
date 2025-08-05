
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { prescriptionsTable } from '../db/schema';
import { getPrescriptions, type GetPrescriptionsFilters } from '../handlers/get_prescriptions';

describe('getPrescriptions', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  const createTestPrescription = async (overrides: any = {}) => {
    const defaultData = {
      patient_name: 'John Doe',
      doctor_name: 'Dr. Smith',
      prescription_date: '2024-01-15', // Use string format for date column
      ...overrides
    };

    const result = await db.insert(prescriptionsTable)
      .values(defaultData)
      .returning()
      .execute();

    return result[0];
  };

  it('should return all prescriptions when no filters provided', async () => {
    // Create test prescriptions
    await createTestPrescription({ patient_name: 'Alice Johnson' });
    await createTestPrescription({ patient_name: 'Bob Wilson' });
    await createTestPrescription({ patient_name: 'Carol Davis' });

    const result = await getPrescriptions();

    expect(result).toHaveLength(3);
    expect(result[0].patient_name).toBeDefined();
    expect(result[0].doctor_name).toBeDefined();
    expect(result[0].prescription_date).toBeInstanceOf(Date);
    expect(result[0].created_at).toBeInstanceOf(Date);
    expect(result[0].id).toBeDefined();
  });

  it('should filter by patient name (case-insensitive partial match)', async () => {
    await createTestPrescription({ patient_name: 'Alice Johnson' });
    await createTestPrescription({ patient_name: 'Bob Wilson' });
    await createTestPrescription({ patient_name: 'alice smith' });

    const filters: GetPrescriptionsFilters = {
      patient_name: 'alice'
    };

    const result = await getPrescriptions(filters);

    expect(result).toHaveLength(2);
    result.forEach(prescription => {
      expect(prescription.patient_name.toLowerCase()).toContain('alice');
    });
  });

  it('should filter by doctor name (case-insensitive partial match)', async () => {
    await createTestPrescription({ doctor_name: 'Dr. Smith' });
    await createTestPrescription({ doctor_name: 'Dr. Johnson' });
    await createTestPrescription({ doctor_name: 'Dr. smith-jones' });

    const filters: GetPrescriptionsFilters = {
      doctor_name: 'smith'
    };

    const result = await getPrescriptions(filters);

    expect(result).toHaveLength(2);
    result.forEach(prescription => {
      expect(prescription.doctor_name.toLowerCase()).toContain('smith');
    });
  });

  it('should filter by date range', async () => {
    await createTestPrescription({ prescription_date: '2024-01-10' });
    await createTestPrescription({ prescription_date: '2024-01-15' });
    await createTestPrescription({ prescription_date: '2024-01-20' });
    await createTestPrescription({ prescription_date: '2024-01-25' });

    const filters: GetPrescriptionsFilters = {
      start_date: new Date('2024-01-12'),
      end_date: new Date('2024-01-22')
    };

    const result = await getPrescriptions(filters);

    expect(result).toHaveLength(2);
    result.forEach(prescription => {
      expect(prescription.prescription_date >= new Date('2024-01-12')).toBe(true);
      expect(prescription.prescription_date <= new Date('2024-01-22')).toBe(true);
    });
  });

  it('should filter by start date only', async () => {
    await createTestPrescription({ prescription_date: '2024-01-10' });
    await createTestPrescription({ prescription_date: '2024-01-15' });
    await createTestPrescription({ prescription_date: '2024-01-20' });

    const filters: GetPrescriptionsFilters = {
      start_date: new Date('2024-01-15')
    };

    const result = await getPrescriptions(filters);

    expect(result).toHaveLength(2);
    result.forEach(prescription => {
      expect(prescription.prescription_date >= new Date('2024-01-15')).toBe(true);
    });
  });

  it('should filter by end date only', async () => {
    await createTestPrescription({ prescription_date: '2024-01-10' });
    await createTestPrescription({ prescription_date: '2024-01-15' });
    await createTestPrescription({ prescription_date: '2024-01-20' });

    const filters: GetPrescriptionsFilters = {
      end_date: new Date('2024-01-15')
    };

    const result = await getPrescriptions(filters);

    expect(result).toHaveLength(2);
    result.forEach(prescription => {
      expect(prescription.prescription_date <= new Date('2024-01-15')).toBe(true);
    });
  });

  it('should combine multiple filters', async () => {
    await createTestPrescription({ 
      patient_name: 'Alice Johnson',
      doctor_name: 'Dr. Smith',
      prescription_date: '2024-01-15'
    });
    await createTestPrescription({ 
      patient_name: 'Alice Wilson',
      doctor_name: 'Dr. Jones',
      prescription_date: '2024-01-15'
    });
    await createTestPrescription({ 
      patient_name: 'Alice Johnson',
      doctor_name: 'Dr. Smith',
      prescription_date: '2024-01-25'
    });

    const filters: GetPrescriptionsFilters = {
      patient_name: 'alice',
      doctor_name: 'smith',
      start_date: new Date('2024-01-10'),
      end_date: new Date('2024-01-20')
    };

    const result = await getPrescriptions(filters);

    expect(result).toHaveLength(1);
    expect(result[0].patient_name).toEqual('Alice Johnson');
    expect(result[0].doctor_name).toEqual('Dr. Smith');
    expect(result[0].prescription_date).toEqual(new Date('2024-01-15'));
  });

  it('should return empty array when no prescriptions match filters', async () => {
    await createTestPrescription({ patient_name: 'John Doe' });

    const filters: GetPrescriptionsFilters = {
      patient_name: 'nonexistent'
    };

    const result = await getPrescriptions(filters);

    expect(result).toHaveLength(0);
  });

  it('should return empty array when no prescriptions exist', async () => {
    const result = await getPrescriptions();

    expect(result).toHaveLength(0);
  });

  it('should order prescriptions by date (most recent first)', async () => {
    await createTestPrescription({ 
      patient_name: 'Patient A',
      prescription_date: '2024-01-10'
    });
    await createTestPrescription({ 
      patient_name: 'Patient B',
      prescription_date: '2024-01-20'
    });
    await createTestPrescription({ 
      patient_name: 'Patient C',
      prescription_date: '2024-01-15'
    });

    const result = await getPrescriptions();

    expect(result).toHaveLength(3);
    expect(result[0].prescription_date).toEqual(new Date('2024-01-20'));
    expect(result[1].prescription_date).toEqual(new Date('2024-01-15'));
    expect(result[2].prescription_date).toEqual(new Date('2024-01-10'));
  });

  it('should convert prescription_date to Date object', async () => {
    await createTestPrescription({ 
      patient_name: 'Test Patient',
      prescription_date: '2024-01-15'
    });

    const result = await getPrescriptions();

    expect(result).toHaveLength(1);
    expect(result[0].prescription_date).toBeInstanceOf(Date);
    expect(typeof result[0].prescription_date).toBe('object');
    expect(result[0].prescription_date.getTime()).toBe(new Date('2024-01-15').getTime());
  });
});
