export type TenantAppInstallScenario = {
  id: string;
  frontendUrl: string;
  slug: string;
  serviceId?: string;
  campaign: 'venue_qr' | 'confirmation_qr' | 'receipt_qr';
  expectedUrl: string;
};

export const TENANT_APP_INSTALL_URL_SCENARIOS: TenantAppInstallScenario[] = [
  {
    id: 'venue-salon-only',
    frontendUrl: 'https://app.test',
    slug: 'glow-nails',
    campaign: 'venue_qr',
    expectedUrl: 'https://app.test/book/glow-nails?src=qr&utm_campaign=venue_qr',
  },
  {
    id: 'confirmation-with-service',
    frontendUrl: 'https://app.test/',
    slug: 'spa-one',
    serviceId: 'svc-42',
    campaign: 'confirmation_qr',
    expectedUrl:
      'https://app.test/book/spa-one?serviceId=svc-42&src=qr&utm_campaign=confirmation_qr',
  },
  {
    id: 'receipt-salon-only',
    frontendUrl: 'https://app.test',
    slug: 'salon-a',
    campaign: 'receipt_qr',
    expectedUrl: 'https://app.test/book/salon-a?src=qr&utm_campaign=receipt_qr',
  },
];

export const TENANT_APP_INSTALL_INVALID_SLUG_SCENARIOS = [
  { id: 'spaces', slug: 'bad slug' },
  { id: 'empty', slug: '' },
] as const;
