import type { DeferredInstallLink, InstallSource } from './deferred-install-link.util.js';

export const DEFERRED_INSTALL_LINK_SCENARIOS: Array<{
  id: string;
  url: string;
  expected: DeferredInstallLink | null;
}> = [
  {
    id: 'book-slug-only',
    url: 'https://app.example.com/book/glow-nails',
    expected: { slug: 'glow-nails', capturedAt: '2026-06-01T00:00:00.000Z' },
  },
  {
    id: 'book-with-service-and-src',
    url: 'https://app.example.com/book/spa-one?serviceId=svc-42&src=qr&utm_campaign=venue_qr',
    expected: {
      slug: 'spa-one',
      serviceId: 'svc-42',
      installSource: 'qr',
      campaign: 'venue_qr',
      capturedAt: '2026-06-01T00:00:00.000Z',
    },
  },
  {
    id: 'book-with-service-slot',
    url:
      'https://app.example.com/book/spa-one?serviceId=svc-42&date=2026-06-10&slot=2026-06-10T14%3A00%3A00.000Z&employeeId=emp-9&src=qr',
    expected: {
      slug: 'spa-one',
      serviceId: 'svc-42',
      date: '2026-06-10',
      slot: '2026-06-10T14:00:00.000Z',
      installSource: 'qr',
      capturedAt: '2026-06-01T00:00:00.000Z',
    },
  },
  {
    id: 'referral-ref-param',
    url: 'https://app.example.com/book/salon-a?ref=FRIEND10&serviceId=svc-1',
    expected: {
      slug: 'salon-a',
      serviceId: 'svc-1',
      installSource: 'referral',
      referralCode: 'FRIEND10',
      capturedAt: '2026-06-01T00:00:00.000Z',
    },
  },
  {
    id: 'paid-ad-utm',
    url: 'https://app.example.com/book/salon-a?utm_source=facebook&utm_medium=paid&serviceId=svc-9',
    expected: {
      slug: 'salon-a',
      serviceId: 'svc-9',
      installSource: 'ad',
      capturedAt: '2026-06-01T00:00:00.000Z',
    },
  },
  {
    id: 'custom-scheme',
    url: 'optischedule://book/my-salon?src=web_banner',
    expected: {
      slug: 'my-salon',
      installSource: 'web_banner',
      capturedAt: '2026-06-01T00:00:00.000Z',
    },
  },
  {
    id: 'no-slug',
    url: 'https://app.example.com/about',
    expected: null,
  },
];

export const DEFERRED_NAVIGATION_SCENARIOS: Array<{
  id: string;
  link: DeferredInstallLink;
  path: string;
}> = [
  {
    id: 'salon-home',
    link: { slug: 'salon-a', capturedAt: '2026-06-01T00:00:00.000Z' },
    path: '/s/salon-a',
  },
  {
    id: 'salon-service',
    link: { slug: 'salon-a', serviceId: 'svc-1', capturedAt: '2026-06-01T00:00:00.000Z' },
    path: '/s/salon-a/book/svc-1',
  },
  {
    id: 'salon-service-slot-confirm',
    link: {
      slug: 'salon-a',
      serviceId: 'svc-1',
      date: '2026-06-10',
      slot: '2026-06-10T14:00:00.000Z',
      capturedAt: '2026-06-01T00:00:00.000Z',
    },
    path:
      '/s/salon-a/book/svc-1?date=2026-06-10&slot=2026-06-10T14%3A00%3A00.000Z&deferredResume=1',
  },
];

export const DEEP_LINK_LAUNCH_SCENARIOS: Array<{
  id: string;
  url: string;
  path: string;
  installSource?: InstallSource;
}> = [
  {
    id: 'resume-service-after-install',
    url: 'https://app.example.com/book/salon-a?serviceId=svc-42&src=qr',
    path: '/s/salon-a/book/svc-42',
    installSource: 'qr',
  },
  {
    id: 'resume-service-slot-confirm',
    url:
      'https://app.example.com/book/salon-a?serviceId=svc-42&date=2026-06-10&slot=2026-06-10T14%3A00%3A00.000Z&src=qr',
    path:
      '/s/salon-a/book/svc-42?date=2026-06-10&slot=2026-06-10T14%3A00%3A00.000Z&deferredResume=1',
    installSource: 'qr',
  },
  {
    id: 'resume-salon-only',
    url: 'https://app.example.com/book/salon-a?src=link',
    path: '/s/salon-a',
    installSource: 'link',
  },
];

export const INSTALL_ATTRIBUTION_PARAM_SCENARIOS: Array<{
  id: string;
  params: {
    src?: string;
    ref?: string;
    utm_source?: string;
    utm_medium?: string;
  };
  expected?: InstallSource;
}> = [
  { id: 'explicit-src', params: { src: 'qr' }, expected: 'qr' },
  { id: 'ref-referral', params: { ref: 'abc' }, expected: 'referral' },
  { id: 'utm-paid', params: { utm_source: 'facebook', utm_medium: 'cpc' }, expected: 'ad' },
  { id: 'utm-invite', params: { utm_source: 'invite' }, expected: 'referral' },
  { id: 'none', params: {}, expected: undefined },
];
