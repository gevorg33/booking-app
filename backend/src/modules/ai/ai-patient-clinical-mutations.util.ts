import type { Repository } from 'typeorm';
import type { Customer } from '../customer/entities/customer.entity.js';
import { CLINIC_PATIENT_ALERT_TYPES } from '../../common/utils/clinic-patient-alert.types.js';

export const PATIENT_CLINICAL_MUTATIONS_READ_INTENTS = [
  'list_customer_staff_notes',
] as const;

export const PATIENT_CLINICAL_MUTATIONS_MUTATE_INTENTS = [
  'update_clinical_profile',
  'dismiss_patient_alert',
  'release_patient_document',
  'create_encounter_addendum',
  'update_encounter_by_booking',
  'add_customer_staff_note',
] as const;

export const PATIENT_CLINICAL_MUTATIONS_INTENTS = [
  ...PATIENT_CLINICAL_MUTATIONS_READ_INTENTS,
  ...PATIENT_CLINICAL_MUTATIONS_MUTATE_INTENTS,
] as const;

export interface PatientClinicalCustomerResolveDeps {
  customerRepo: Pick<Repository<Customer>, 'find' | 'findOne'>;
}

export async function resolvePatientClinicalCustomer(
  deps: PatientClinicalCustomerResolveDeps,
  businessId: string,
  params: Record<string, unknown>,
): Promise<Customer | null> {
  const customerId =
    typeof params.customerId === 'string' && params.customerId.trim()
      ? params.customerId.trim()
      : undefined;
  if (customerId) {
    return deps.customerRepo.findOne({ where: { id: customerId, businessId } });
  }

  const name =
    typeof params.customerName === 'string' && params.customerName.trim()
      ? params.customerName.trim()
      : undefined;
  if (!name) return null;

  const customers = await deps.customerRepo.find({
    where: { businessId },
    take: 200,
  });
  const needle = name.toLowerCase();
  return (
    customers.find((customer) => customer.name.toLowerCase() === needle) ??
    customers.find((customer) => customer.name.toLowerCase().includes(needle)) ??
    null
  );
}

export function isClinicPatientAlertType(
  value: unknown,
): value is (typeof CLINIC_PATIENT_ALERT_TYPES)[number] {
  return (
    typeof value === 'string' &&
    (CLINIC_PATIENT_ALERT_TYPES as readonly string[]).includes(value)
  );
}
