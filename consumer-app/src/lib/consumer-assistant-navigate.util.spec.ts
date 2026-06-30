import { describe, expect, it } from 'vitest';
import {
  buildConsumerAssistantHref,
  dateKeyFromStartTime,
  parseMultiServiceIdsParam,
} from './consumer-assistant-navigate.util.js';

describe('buildConsumerAssistantHref', () => {
  it('maps single-service checkout to BookPage query params', () => {
    expect(
      buildConsumerAssistantHref('glow-nails', {
        path: 'checkout',
        query: {
          serviceId: 'svc-1',
          startTime: '2026-06-09T14:00:00.000Z',
          employeeId: 'emp-2',
        },
      }),
    ).toBe(
      '/s/glow-nails/book/svc-1?slot=2026-06-09T14%3A00%3A00.000Z&date=2026-06-09&employeeId=emp-2',
    );
  });

  it('maps resume pending payment checkout with session_id', () => {
    expect(
      buildConsumerAssistantHref('glow-nails', {
        path: 'checkout',
        query: {
          serviceId: 'svc-1',
          startTime: '2026-06-09T14:00:00.000Z',
          session_id: 'cs_test_resume',
          resumePayment: '1',
        },
      }),
    ).toBe(
      '/s/glow-nails/book/svc-1?slot=2026-06-09T14%3A00%3A00.000Z&date=2026-06-09&session_id=cs_test_resume',
    );
  });

  it('maps multi-service checkout to multi book route', () => {
    expect(
      buildConsumerAssistantHref('glow-nails', {
        path: 'multi/checkout',
        query: {
          services: 'svc-a,svc-b',
          startTime: '2026-06-09T09:00:00.000Z',
          employeeId: 'emp-1',
          employeeName: 'Mary',
        },
      }),
    ).toBe(
      '/s/glow-nails/book/multi/checkout?services=svc-a%2Csvc-b&startTime=2026-06-09T09%3A00%3A00.000Z&employeeId=emp-1&employeeName=Mary',
    );
  });

  it('maps services navigate to services tab', () => {
    expect(
      buildConsumerAssistantHref('glow-nails', {
        path: 'services',
        query: {},
      }),
    ).toBe('/s/glow-nails/services');
  });

  it('maps professionals navigate to professionals picker', () => {
    expect(
      buildConsumerAssistantHref('glow-nails', {
        path: 'professionals',
        query: {},
      }),
    ).toBe('/s/glow-nails/professionals');
  });

  it('maps professionals navigate with slot to professional services', () => {
    expect(
      buildConsumerAssistantHref('glow-nails', {
        path: 'professionals',
        query: {
          employeeId: 'emp-1',
          startTime: '2026-06-09T10:00:00.000Z',
          employeeName: 'Alex',
        },
      }),
    ).toContain('/s/glow-nails/professionals/services?');
  });

  it('maps package picker navigate to /book/any', () => {
    expect(
      buildConsumerAssistantHref('glow-nails', {
        path: 'packages',
        query: {},
      }),
    ).toBe('/s/glow-nails/book/any');
  });

  it('maps named package navigate to package confirm', () => {
    expect(
      buildConsumerAssistantHref('glow-nails', {
        path: 'packages',
        query: { packageId: 'pkg-spa' },
      }),
    ).toBe('/s/glow-nails/book/packages/pkg-spa');
  });

  it('maps package checkout navigate with lines to package checkout', () => {
    const lines = JSON.stringify([
      {
        serviceId: 'svc-a',
        employeeId: 'emp-1',
        startTime: '2026-06-09T10:00:00.000Z',
      },
    ]);
    expect(
      buildConsumerAssistantHref('glow-nails', {
        path: 'checkout',
        query: {
          packageId: 'pkg-spa',
          lines,
          employeeName: 'Alex',
        },
      }),
    ).toBe(
      '/s/glow-nails/book/packages/pkg-spa/checkout?packageId=pkg-spa&lines=' +
        encodeURIComponent(lines) +
        '&employeeName=Alex',
    );
  });

  it('maps checkout packageId without lines to package confirm', () => {
    expect(
      buildConsumerAssistantHref('glow-nails', {
        path: 'checkout',
        query: { packageId: 'pkg-spa' },
      }),
    ).toBe('/s/glow-nails/book/packages/pkg-spa');
  });

  it('maps multi-service checkout query on checkout path', () => {
    expect(
      buildConsumerAssistantHref('glow-nails', {
        path: 'checkout',
        query: { services: 'svc-a,svc-b', startTime: '2026-06-09T09:00:00.000Z' },
      }),
    ).toBe(
      '/s/glow-nails/book/multi/checkout?services=svc-a%2Csvc-b&startTime=2026-06-09T09%3A00%3A00.000Z',
    );
  });

  it('maps guide navigate to guide page with topicId', () => {
    expect(
      buildConsumerAssistantHref('glow-nails', {
        path: 'guide',
        query: { topicId: 'consumer-getting-started' },
      }),
    ).toBe('/s/glow-nails/guide?topicId=consumer-getting-started');
  });

  it('maps account and rebook checkout paths', () => {
    expect(
      buildConsumerAssistantHref('glow-nails', {
        path: 'account',
        query: { tab: 'subscriptions' },
      }),
    ).toBe('/s/glow-nails/account?tab=subscriptions');
    expect(
      buildConsumerAssistantHref('glow-nails', {
        path: 'account',
        query: { section: 'privacy' },
      }),
    ).toBe('/s/glow-nails/account?section=privacy');
    expect(
      buildConsumerAssistantHref('glow-nails', {
        path: 'profile',
        query: {},
      }),
    ).toBe('/s/glow-nails/profile');
    expect(
      buildConsumerAssistantHref('glow-nails', {
        path: 'home',
        query: {},
      }),
    ).toBe('/s/glow-nails/home');
    expect(
      buildConsumerAssistantHref('glow-nails', {
        path: 'checkout',
        query: {
          serviceId: 'svc-1',
          startTime: '2026-06-09T14:00:00.000Z',
          rebook: '1',
          rebookBookingId: 'b1',
        },
      }),
    ).toContain('rebook=1');
  });
});

describe('dateKeyFromStartTime', () => {
  it('extracts UTC date key from ISO timestamp', () => {
    expect(dateKeyFromStartTime('2026-06-09T14:00:00.000Z')).toBe('2026-06-09');
  });
});

describe('parseMultiServiceIdsParam', () => {
  it('parses and deduplicates comma-separated ids', () => {
    expect(parseMultiServiceIdsParam('a,b, a')).toEqual(['a', 'b']);
  });
});
