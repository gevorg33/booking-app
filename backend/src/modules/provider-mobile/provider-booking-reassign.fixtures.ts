/** prov-exp-4.2 — booking reassignment scenarios. */

import { BookingStatus } from '../booking/entities/booking.entity.js';

export const PROVIDER_REASSIGN_ELIGIBILITY_SCENARIOS = [
  {
    id: 'manager-active-booking',
    access: { viewMode: 'team' as const, employeeId: null },
    booking: {
      id: 'bk-1',
      employeeId: 'emp-1',
      status: BookingStatus.CONFIRMED,
      startTime: '2026-06-09T10:00:00.000Z',
      serviceId: 'svc-1',
      multiServiceGroupId: null,
    },
    allowed: true,
  },
  {
    id: 'provider-own-booking',
    access: { viewMode: 'provider' as const, employeeId: 'emp-1' },
    booking: {
      id: 'bk-1',
      employeeId: 'emp-1',
      status: BookingStatus.CONFIRMED,
      startTime: '2026-06-09T10:00:00.000Z',
      serviceId: 'svc-1',
      multiServiceGroupId: null,
    },
    allowed: true,
  },
  {
    id: 'provider-other-booking',
    access: { viewMode: 'provider' as const, employeeId: 'emp-1' },
    booking: {
      id: 'bk-2',
      employeeId: 'emp-2',
      status: BookingStatus.CONFIRMED,
      startTime: '2026-06-09T11:00:00.000Z',
      serviceId: 'svc-1',
      multiServiceGroupId: null,
    },
    allowed: false,
  },
  {
    id: 'completed-booking',
    access: { viewMode: 'team' as const, employeeId: null },
    booking: {
      id: 'bk-3',
      employeeId: 'emp-1',
      status: BookingStatus.COMPLETED,
      startTime: '2026-06-09T09:00:00.000Z',
      serviceId: 'svc-1',
      multiServiceGroupId: null,
    },
    allowed: false,
  },
  {
    id: 'multi-service-blocked',
    access: { viewMode: 'team' as const, employeeId: null },
    booking: {
      id: 'bk-4',
      employeeId: 'emp-1',
      status: BookingStatus.CONFIRMED,
      startTime: '2026-06-09T12:00:00.000Z',
      serviceId: 'svc-1',
      multiServiceGroupId: 'group-1',
    },
    allowed: false,
  },
] as const;
