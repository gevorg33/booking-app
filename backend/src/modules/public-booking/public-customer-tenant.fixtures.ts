/** e2e-bug.218 — cross-tenant public customer session scenarios. */

export type PublicCustomerTenantFixture = {
  id: string;
  payloadBusinessId: string;
  routeBusinessId: string;
  expectMatch: boolean;
};

export const PUBLIC_CUSTOMER_TENANT_MATCH_SCENARIOS: PublicCustomerTenantFixture[] =
  [
    {
      id: 'same-tenant',
      payloadBusinessId: 'biz-a',
      routeBusinessId: 'biz-a',
      expectMatch: true,
    },
    {
      id: 'cross-tenant-salon-on-clinic',
      payloadBusinessId: 'biz-salon',
      routeBusinessId: 'biz-clinic',
      expectMatch: false,
    },
    {
      id: 'empty-payload',
      payloadBusinessId: '',
      routeBusinessId: 'biz-a',
      expectMatch: false,
    },
    {
      id: 'empty-route',
      payloadBusinessId: 'biz-a',
      routeBusinessId: '',
      expectMatch: false,
    },
    {
      id: 'whitespace-mismatch',
      payloadBusinessId: ' biz-a ',
      routeBusinessId: 'biz-b',
      expectMatch: false,
    },
    {
      id: 'whitespace-same',
      payloadBusinessId: ' biz-a ',
      routeBusinessId: 'biz-a',
      expectMatch: true,
    },
  ];

export const PUBLIC_CUSTOMER_SLUG_READ_SCENARIOS: Array<{
  id: string;
  params: unknown;
  expected: string | null;
}> = [
  { id: 'slug-present', params: { slug: 'gevgas-ops' }, expected: 'gevgas-ops' },
  { id: 'slug-trim', params: { slug: '  salon  ' }, expected: 'salon' },
  { id: 'slug-missing', params: { id: 'x' }, expected: null },
  { id: 'slug-empty', params: { slug: '   ' }, expected: null },
  { id: 'params-null', params: null, expected: null },
];
