import type { BookingDraft } from './booking-draft.util.js';

export const BOOKING_DRAFT_SCENARIOS = [
  {
    id: 'resume-path-with-slot',
    draft: {
      slug: 'glow-nails',
      serviceId: 'svc-1',
      employeeId: 'emp-1',
      date: '2026-06-10',
      slot: '2026-06-10T09:00:00.000Z',
      updatedAt: '2026-06-08T12:00:00.000Z',
    } satisfies BookingDraft,
    expectedPath:
      '/s/glow-nails/book/svc-1?date=2026-06-10&slot=2026-06-10T09%3A00%3A00.000Z&employeeId=emp-1&resume=1',
    stale: false,
  },
  {
    id: 'stale-draft',
    draft: {
      slug: 'glow-nails',
      serviceId: 'svc-1',
      updatedAt: '2026-05-01T12:00:00.000Z',
    } satisfies BookingDraft,
    expectedPath: '/s/glow-nails/book/svc-1?resume=1',
    stale: true,
  },
] as const;
