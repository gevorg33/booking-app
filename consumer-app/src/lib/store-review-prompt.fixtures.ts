import type { PublicCustomerBookingItem } from './types.js';

export const MOCK_REVIEWABLE_BOOKING: PublicCustomerBookingItem = {
  id: 'bk-review-1',
  serviceId: 'svc-haircut',
  serviceName: 'Haircut',
  employeeId: 'emp-1',
  employeeName: 'Anna',
  startTime: '2026-05-01T10:00:00.000Z',
  endTime: '2026-05-01T10:45:00.000Z',
  status: 'completed',
  paymentStatus: 'paid',
  canReview: true,
  canCancel: false,
  canReschedule: false,
};

export const POST_VISIT_REVIEW_SCENARIOS = [
  {
    id: 'completed-reviewable',
    booking: MOCK_REVIEWABLE_BOOKING,
    expected: true,
  },
  {
    id: 'completed-already-reviewed',
    booking: { ...MOCK_REVIEWABLE_BOOKING, id: 'bk-review-2', canReview: false },
    expected: false,
  },
  {
    id: 'confirmed-not-finished',
    booking: { ...MOCK_REVIEWABLE_BOOKING, id: 'bk-review-3', status: 'confirmed', canReview: false },
    expected: false,
  },
] as const;
