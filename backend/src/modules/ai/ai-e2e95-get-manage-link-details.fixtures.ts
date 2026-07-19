/**
 * e2e-bug.95 — get_manage_link must surface manageUrl/manageToken through
 * commandResultToPublicAssistantResult (not strip them from details).
 */
export const E2E95_GET_MANAGE_LINK_DETAIL_SCENARIOS = [
  {
    id: 'e2e95-forwards-manageUrl',
    detailKey: 'manageUrl' as const,
    detailValue: 'https://book.example/s/salon/manage?bookingId=b1&token=t1',
  },
  {
    id: 'e2e95-forwards-manageToken',
    detailKey: 'manageToken' as const,
    detailValue: 'a1b2c3d4e5f60718293a4b5c6d7e8f90',
  },
] as const;

export type E2e95GetManageLinkDetailScenario =
  (typeof E2E95_GET_MANAGE_LINK_DETAIL_SCENARIOS)[number];
