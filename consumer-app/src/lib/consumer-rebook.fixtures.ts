import type { PublicCustomerBookingItem } from './types.js';
import { MOCK_COMPLETED_BOOKING } from './consumer-growth-loops.fixtures.js';

export const REBOOK_QUERY_SCENARIOS = [
  {
    id: 'completed-visit',
    booking: MOCK_COMPLETED_BOOKING,
    expectedDate: '2026-05-01',
    expectedSlot: '2026-05-01T10:00:00.000Z',
    expectedEmployeeId: 'emp-1',
  },
] as const;

export const REBOOK_PATH_SCENARIOS = [
  {
    id: 'account-rebook',
    slug: 'demo-salon',
    booking: MOCK_COMPLETED_BOOKING,
    expectPathContains: '/s/demo-salon/book/svc-haircut',
    expectQueryContains: ['date=2026-05-01', 'slot=2026-05-01', 'employeeId=emp-1', 'rebook=1'],
  },
] as const;

export const REBOOK_PUSH_SCENARIOS = [
  {
    id: 'widget-rebook',
    slug: 'demo-salon',
    booking: MOCK_COMPLETED_BOOKING,
    expectUrlContains: [
      'optischedule://book/demo-salon/book/svc-haircut',
      'employeeId=emp-1',
      'rebook=1',
    ],
  },
] as const;

export const REBOOK_CANDIDATE_BOOKINGS: PublicCustomerBookingItem[] = [
  MOCK_COMPLETED_BOOKING,
  {
    ...MOCK_COMPLETED_BOOKING,
    id: 'bk-old',
    startTime: '2026-04-01T09:00:00.000Z',
    endTime: '2026-04-01T09:45:00.000Z',
  },
];
