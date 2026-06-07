import { MemberRole } from '../../modules/business/entities/business-member.entity.js';
import type { BookingPhiAccessTarget } from './phi-minimum-access.util.js';
import type { ClinicLabStaffContext } from './clinic-lab-access.util.js';

export const CLINIC_LAB_ACCESS_BOOKING: BookingPhiAccessTarget = {
  employeeId: 'emp-primary',
  linkedEmployeeIds: ['emp-assist'],
};

export const CLINIC_LAB_ACCESS_SCENARIOS: Array<{
  id: string;
  ctx: Pick<ClinicLabStaffContext, 'membershipRole' | 'employeeId'>;
  tier: 'lab_ops' | 'receptionist' | 'provider';
  canAccessBooking: boolean;
  queueEmployeeFilter?: string;
}> = [
  {
    id: 'owner-full-access',
    ctx: { membershipRole: MemberRole.OWNER, employeeId: null },
    tier: 'lab_ops',
    canAccessBooking: true,
  },
  {
    id: 'manager-full-access',
    ctx: { membershipRole: MemberRole.MANAGER, employeeId: 'emp-manager' },
    tier: 'lab_ops',
    canAccessBooking: true,
  },
  {
    id: 'receptionist-staff-no-employee',
    ctx: { membershipRole: MemberRole.STAFF, employeeId: null },
    tier: 'receptionist',
    canAccessBooking: true,
  },
  {
    id: 'provider-assigned-primary',
    ctx: { membershipRole: MemberRole.STAFF, employeeId: 'emp-primary' },
    tier: 'provider',
    canAccessBooking: true,
    queueEmployeeFilter: 'emp-primary',
  },
  {
    id: 'provider-assigned-linked',
    ctx: { membershipRole: MemberRole.CONTRIBUTOR, employeeId: 'emp-assist' },
    tier: 'provider',
    canAccessBooking: true,
    queueEmployeeFilter: 'emp-assist',
  },
  {
    id: 'provider-unassigned',
    ctx: { membershipRole: MemberRole.CONTRIBUTOR, employeeId: 'emp-other' },
    tier: 'provider',
    canAccessBooking: false,
    queueEmployeeFilter: 'emp-other',
  },
];

export const CLINIC_LAB_PATIENT_RESULT_SCENARIOS = [
  {
    id: 'patient-own-released',
    viewerCustomerId: 'cust-1',
    result: { customerId: 'cust-1', status: 'Released' },
    allowed: true,
  },
  {
    id: 'patient-other-released',
    viewerCustomerId: 'cust-1',
    result: { customerId: 'cust-2', status: 'Released' },
    allowed: false,
  },
  {
    id: 'patient-own-unreleased',
    viewerCustomerId: 'cust-1',
    result: { customerId: 'cust-1', status: 'Completed' },
    allowed: false,
  },
] as const;
