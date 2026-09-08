import type { Repository } from 'typeorm';
import { ILike } from 'typeorm';
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

  // e2e-bug.443 — this used to read `{ where: { businessId }, take: 200 }` with
  // no `order` and no `isActive`, then match in memory. Three faults, on a
  // path that writes to a **patient chart**:
  //
  //  1. the 200 were an arbitrary, storage-ordered slice, so past 200 customers
  //     a real patient simply was not in the set and silently failed to
  //     resolve;
  //  2. deactivated customers were candidates, so a former patient could match;
  //  3. with no `order`, which 200 you got could change between identical
  //     calls.
  //
  // Filtering by name in SQL fixes all three: the cap now bounds *matching*
  // rows rather than arbitrary ones, `isActive` is enforced by the database,
  // and the order is deterministic. Exact still beats substring, as before.
  const needle = name.toLowerCase();
  // Escape LIKE metacharacters so a name containing % or _ is matched
  // literally rather than as a wildcard.
  const escaped = needle.replace(/[\\%_]/g, (ch) => `\\${ch}`);
  const customers = await deps.customerRepo.find({
    where: {
      businessId,
      isActive: true,
      name: ILike(`%${escaped}%`),
    },
    order: { name: 'ASC', id: 'ASC' },
    take: 200,
  });
  return (
    customers.find((customer) => customer.name.toLowerCase() === needle) ??
    customers.find((customer) =>
      customer.name.toLowerCase().includes(needle),
    ) ??
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
