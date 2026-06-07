import { MemberRole } from '../business/entities/business-member.entity.js';
import { BookingStatus } from '../booking/entities/booking.entity.js';

export const CLINIC_AFTER_VISIT_SUMMARY_FIXTURES = [
  {
    id: 'avs-1',
    businessId: 'biz-1',
    customerId: 'cust-1',
    bookingId: 'booking-1',
    authorEmployeeId: 'emp-provider',
    description: 'Follow up in two weeks. Continue current medication.',
    releasedToPatient: false,
    createdAt: new Date('2026-06-01T10:00:00.000Z'),
    updatedAt: new Date('2026-06-01T10:00:00.000Z'),
    author: { name: 'Dr. Lee' },
  },
] as const;

export const CLINIC_AFTER_VISIT_SUMMARY_UPSERT_SCENARIOS = [
  {
    id: 'basic-summary',
    dto: {
      description: 'Rest, fluids, and return if symptoms worsen.',
    },
  },
  {
    id: 'multiline-summary',
    dto: {
      description:
        'Diagnosis: upper respiratory infection.\nPlan: supportive care.',
    },
  },
] as const;

export const CLINIC_AFTER_VISIT_SUMMARY_ACCESS_SCENARIOS = [
  {
    id: 'provider-assigned',
    role: MemberRole.STAFF,
    employeeId: 'emp-provider',
    canAuthor: true,
  },
  {
    id: 'manager',
    role: MemberRole.MANAGER,
    employeeId: 'emp-manager',
    canAuthor: true,
  },
  {
    id: 'unassigned-provider',
    role: MemberRole.STAFF,
    employeeId: 'emp-other',
    canAuthor: false,
  },
] as const;

export const CLINIC_AFTER_VISIT_SUMMARY_BOOKING = {
  id: 'booking-1',
  businessId: 'biz-1',
  customerId: 'cust-1',
  employeeId: 'emp-provider',
  linkedEmployeeIds: [] as string[],
  status: BookingStatus.COMPLETED,
  startTime: new Date('2026-06-01T09:00:00.000Z'),
  endTime: new Date('2026-06-01T09:30:00.000Z'),
  service: {
    name: 'General consultation',
    metadata: { serviceType: 'consultation' },
  },
  employee: { name: 'Dr. Lee' },
} as const;

export const CLINIC_AFTER_VISIT_SUMMARY_PDF_CONTEXT = {
  businessName: 'City Polyclinic',
  patientName: 'Jane Doe',
  providerName: 'Dr. Lee',
  serviceName: 'General consultation',
  visitStart: new Date('2026-06-01T09:00:00.000Z'),
  description: 'Continue medication.\nSchedule follow-up.',
  businessSettings: { dateFormat: 'DD/MM/YYYY', timeFormat: '24h' },
} as const;
