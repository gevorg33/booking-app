import type { PublicCustomerBookingItem } from './types.js';

const baseBooking = (
  overrides: Partial<PublicCustomerBookingItem>,
): PublicCustomerBookingItem => ({
  id: 'b-1',
  startTime: '2026-06-15T14:00:00.000Z',
  endTime: '2026-06-15T15:00:00.000Z',
  status: 'confirmed',
  paymentStatus: 'paid',
  serviceName: 'Haircut',
  employeeName: 'Jane',
  employeeId: 'emp-1',
  serviceId: 'svc-1',
  canCancel: true,
  canReschedule: true,
  ...overrides,
});

export const HOME_SCREEN_WIDGET_SCENARIOS = [
  {
    id: 'upcoming-confirmed-first',
    now: '2026-06-10T12:00:00.000Z',
    bookings: [
      baseBooking({
        id: 'past',
        startTime: '2026-06-01T10:00:00.000Z',
        status: 'completed',
      }),
      baseBooking({
        id: 'next',
        startTime: '2026-06-15T14:00:00.000Z',
        status: 'confirmed',
      }),
      baseBooking({
        id: 'later',
        startTime: '2026-06-20T09:00:00.000Z',
        status: 'pending',
      }),
    ],
    expectNextId: 'next',
    expectRebookId: 'past',
  },
  {
    id: 'skips-past-upcoming',
    now: '2026-06-16T12:00:00.000Z',
    bookings: [
      baseBooking({
        id: 'past-upcoming',
        startTime: '2026-06-15T14:00:00.000Z',
        status: 'confirmed',
      }),
      baseBooking({
        id: 'future',
        startTime: '2026-06-20T09:00:00.000Z',
        status: 'pending',
      }),
    ],
    expectNextId: 'future',
    expectRebookId: null,
  },
  {
    id: 'rebook-latest-completed',
    now: '2026-06-10T12:00:00.000Z',
    bookings: [
      baseBooking({
        id: 'old-done',
        startTime: '2026-05-01T10:00:00.000Z',
        status: 'completed',
        serviceName: 'Manicure',
        serviceId: 'svc-old',
      }),
      baseBooking({
        id: 'recent-done',
        startTime: '2026-06-01T10:00:00.000Z',
        status: 'completed',
        serviceName: 'Color',
        serviceId: 'svc-new',
      }),
    ],
    expectNextId: null,
    expectRebookId: 'recent-done',
  },
  {
    id: 'ignores-cancelled',
    now: '2026-06-10T12:00:00.000Z',
    bookings: [
      baseBooking({ id: 'cancelled', status: 'cancelled' }),
      baseBooking({
        id: 'done',
        startTime: '2026-06-01T10:00:00.000Z',
        status: 'completed',
      }),
    ],
    expectNextId: null,
    expectRebookId: 'done',
  },
] as const;
