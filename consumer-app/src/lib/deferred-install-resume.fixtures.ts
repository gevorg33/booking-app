import type { DeferredInstallLink } from './deferred-install-link.util.js';

export const DEFERRED_INSTALL_RESUME_SCENARIOS = [
  {
    id: 'service-only',
    link: {
      slug: 'salon-a',
      serviceId: 'svc-1',
      capturedAt: '2026-06-08T00:00:00.000Z',
    } satisfies DeferredInstallLink,
    path: '/s/salon-a/book/svc-1',
  },
  {
    id: 'service-slot-confirm',
    link: {
      slug: 'salon-a',
      serviceId: 'svc-1',
      date: '2026-06-10',
      slot: '2026-06-10T14:00:00.000Z',
      employeeId: 'emp-9',
      installSource: 'qr',
      capturedAt: '2026-06-08T00:00:00.000Z',
    } satisfies DeferredInstallLink,
    path:
      '/s/salon-a/book/svc-1?date=2026-06-10&slot=2026-06-10T14%3A00%3A00.000Z&employeeId=emp-9&deferredResume=1',
  },
] as const;

export const DEFERRED_INSTALL_RESUME_SEARCH_SCENARIOS = [
  {
    id: 'confirm-resume',
    search:
      '?date=2026-06-10&slot=2026-06-10T14%3A00%3A00.000Z&deferredResume=1',
    slot: '2026-06-10T14:00:00.000Z',
    expectResume: true,
    expectSkipDiscovery: true,
    expectCollapseSchedule: true,
  },
  {
    id: 'slot-without-flag',
    search: '?date=2026-06-10&slot=2026-06-10T14%3A00%3A00.000Z',
    slot: '2026-06-10T14:00:00.000Z',
    expectResume: false,
    expectSkipDiscovery: false,
    expectCollapseSchedule: false,
  },
] as const;
