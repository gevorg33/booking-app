import type { BookingDraft } from './booking-draft.util.js';

export const ABANDONED_STEP_SCENARIOS = [
  {
    id: 'confirm-with-slot',
    draft: {
      slug: 'salon-a',
      serviceId: 'svc-1',
      slot: '2026-06-10T09:00:00.000Z',
      updatedAt: '2026-06-08T12:00:00.000Z',
    } satisfies BookingDraft,
    expected: 'confirm' as const,
  },
  {
    id: 'slot-with-date',
    draft: {
      slug: 'salon-a',
      serviceId: 'svc-1',
      date: '2026-06-10',
      updatedAt: '2026-06-08T12:00:00.000Z',
    } satisfies BookingDraft,
    expected: 'slot' as const,
  },
  {
    id: 'service-only',
    draft: {
      slug: 'salon-a',
      serviceId: 'svc-1',
      updatedAt: '2026-06-08T12:00:00.000Z',
    } satisfies BookingDraft,
    expected: 'service' as const,
  },
] as const;

export const RESUMABLE_DRAFT_SCENARIOS = [
  {
    id: 'resumable-slot',
    draft: {
      slug: 'salon-a',
      serviceId: 'svc-1',
      slot: '2026-06-10T09:00:00.000Z',
      updatedAt: '2026-06-08T12:00:00.000Z',
    } satisfies BookingDraft,
    expected: true,
  },
  {
    id: 'not-resumable-empty',
    draft: {
      slug: 'salon-a',
      serviceId: 'svc-1',
      updatedAt: '2026-06-08T12:00:00.000Z',
    } satisfies BookingDraft,
    expected: false,
  },
] as const;
