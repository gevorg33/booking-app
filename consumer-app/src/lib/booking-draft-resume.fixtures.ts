import type { BookingDraft } from './booking-draft.util.js';

export const BOOKING_DRAFT_RESUME_CONTEXT_SCENARIOS = [
  {
    id: 'confirm-with-slot',
    input: {
      search: '?date=2026-06-10&slot=2026-06-10T14:00:00.000Z&resume=1',
      slug: 'salon-a',
      serviceId: 'svc-1',
      slot: '2026-06-10T14:00:00.000Z',
      draft: {
        slug: 'salon-a',
        serviceId: 'svc-1',
        date: '2026-06-10',
        slot: '2026-06-10T14:00:00.000Z',
        guestContact: { name: 'Alex', email: 'alex@example.com', phone: '' },
        updatedAt: '2026-06-08T12:00:00.000Z',
      } satisfies BookingDraft,
    },
    expectResume: true,
    expectStep: 'confirm' as const,
    expectSkipDiscovery: true,
    expectCollapseSchedule: true,
  },
  {
    id: 'slot-step-date-only',
    input: {
      search: '?date=2026-06-10&resume=1',
      slug: 'salon-a',
      serviceId: 'svc-1',
      slot: '',
      draft: {
        slug: 'salon-a',
        serviceId: 'svc-1',
        date: '2026-06-10',
        updatedAt: '2026-06-08T12:00:00.000Z',
      } satisfies BookingDraft,
    },
    expectResume: true,
    expectStep: 'slot' as const,
    expectSkipDiscovery: false,
    expectCollapseSchedule: false,
  },
  {
    id: 'wrong-service',
    input: {
      search: '?resume=1',
      slug: 'salon-a',
      serviceId: 'svc-2',
      slot: '',
      draft: {
        slug: 'salon-a',
        serviceId: 'svc-1',
        date: '2026-06-10',
        updatedAt: '2026-06-08T12:00:00.000Z',
      } satisfies BookingDraft,
    },
    expectResume: false,
    expectStep: 'slot' as const,
    expectSkipDiscovery: false,
    expectCollapseSchedule: false,
  },
  {
    id: 'missing-resume-flag',
    input: {
      search: '?date=2026-06-10&slot=2026-06-10T14:00:00.000Z',
      slug: 'salon-a',
      serviceId: 'svc-1',
      slot: '2026-06-10T14:00:00.000Z',
      draft: {
        slug: 'salon-a',
        serviceId: 'svc-1',
        slot: '2026-06-10T14:00:00.000Z',
        updatedAt: '2026-06-08T12:00:00.000Z',
      } satisfies BookingDraft,
    },
    expectResume: false,
    expectStep: 'confirm' as const,
    expectSkipDiscovery: false,
    expectCollapseSchedule: false,
  },
] as const;

export const BOOKING_DRAFT_REDIRECT_SCENARIOS = [
  {
    id: 'redirect-from-home',
    pathname: '/',
    draft: {
      slug: 'salon-a',
      serviceId: 'svc-1',
      slot: '2026-06-10T09:00:00.000Z',
      updatedAt: '2026-06-08T12:00:00.000Z',
    } satisfies BookingDraft,
    stale: false,
    expectRedirect: true,
  },
  {
    id: 'already-on-resume-path',
    pathname: '/s/salon-a/book/svc-1?resume=1&slot=2026-06-10T09%3A00%3A00.000Z',
    draft: {
      slug: 'salon-a',
      serviceId: 'svc-1',
      slot: '2026-06-10T09:00:00.000Z',
      updatedAt: '2026-06-08T12:00:00.000Z',
    } satisfies BookingDraft,
    stale: false,
    expectRedirect: false,
  },
  {
    id: 'stale-draft',
    pathname: '/',
    draft: {
      slug: 'salon-a',
      serviceId: 'svc-1',
      date: '2026-06-10',
      updatedAt: '2026-05-01T12:00:00.000Z',
    } satisfies BookingDraft,
    stale: true,
    expectRedirect: false,
  },
] as const;

export const BOOKING_DRAFT_RESUME_COPY_SCENARIOS = [
  {
    id: 'confirm',
    step: 'confirm' as const,
    expectIncludes: 'confirm',
  },
  {
    id: 'slot',
    step: 'slot' as const,
    expectIncludes: 'time',
  },
  {
    id: 'service',
    step: 'service' as const,
    expectIncludes: 'booking',
  },
] as const;
