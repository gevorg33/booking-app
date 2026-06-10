export const SERVICE_BOOKING_POPULARITY_WINDOW_SCENARIOS = [
  {
    id: 'window-90-days-inclusive',
    referenceIso: '2026-06-10T15:30:00.000Z',
    expectedStartIso: '2026-03-13T00:00:00.000Z',
    expectedEndIso: '2026-06-10T23:59:59.999Z',
  },
] as const;

export const BUILD_SERVICE_BOOKING_COUNT_MAP_SCENARIOS = [
  {
    id: 'map-parses-string-counts',
    rows: [
      { serviceId: 'svc-a', count: '12' },
      { serviceId: 'svc-b', count: 3 },
    ],
    expected: { 'svc-a': 12, 'svc-b': 3 },
  },
  {
    id: 'map-skips-invalid-rows',
    rows: [
      { serviceId: 'svc-a', count: 'not-a-number' },
      { serviceId: 'svc-b', count: '5' },
    ],
    expected: { 'svc-b': 5 },
  },
] as const;
