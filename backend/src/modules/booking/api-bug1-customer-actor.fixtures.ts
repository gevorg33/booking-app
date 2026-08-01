/**
 * api-bug.1 / e2e-bug.30 / e2e-bug.97 — guest/self-service `customer:<uuid>`
 * actors must never hit BookingService.ensureMember (Postgres rejects
 * non-UUID actor strings → raw 500 on manage reschedule/cancel).
 */
export const API_BUG1_CUSTOMER_ACTOR_SCENARIOS = [
  {
    id: 'api1-customer-prefixed-actor',
    actorId: 'customer:36400df4-1111-4111-8111-111111111111',
    expectEnsureMember: false,
    expectAuditRole: 'customer' as const,
  },
  {
    id: 'api1-customer-prefixed-uppercase-uuid',
    actorId: 'customer:AAAAAAAA-BBBB-4CCC-8DDD-EEEEEEEEEEEE',
    expectEnsureMember: false,
    expectAuditRole: 'customer' as const,
  },
  {
    id: 'api1-non-uuid-actor',
    actorId: 'not-a-uuid-actor',
    expectEnsureMember: false,
    expectAuditRole: 'public' as const,
  },
  {
    id: 'api1-empty-actor',
    actorId: '',
    expectEnsureMember: false,
    expectAuditRole: 'public' as const,
  },
  {
    id: 'api1-staff-uuid-actor',
    actorId: '11111111-1111-4111-8111-111111111111',
    expectEnsureMember: true,
    expectAuditRole: 'manager' as const,
  },
] as const;

export type ApiBug1CustomerActorScenario =
  (typeof API_BUG1_CUSTOMER_ACTOR_SCENARIOS)[number];

/** Live QA cases for manage-token reschedule/cancel (no raw Postgres uuid leak). */
export const API_BUG1_LIVE_SCENARIOS = [
  {
    id: 'api1-live-manage-reschedule',
    action: 'reschedule' as const,
    expectStatus: 201,
    forbidBody: [
      'invalid input syntax for type uuid',
      'QueryFailedError',
      'customer:',
    ],
  },
  {
    id: 'api1-live-manage-cancel',
    action: 'cancel' as const,
    expectStatus: 201,
    forbidBody: [
      'invalid input syntax for type uuid',
      'QueryFailedError',
      'customer:',
    ],
  },
  {
    id: 'api1-live-garbage-token-reschedule',
    action: 'reschedule_garbage_token' as const,
    expectStatusMax: 403,
    forbidBody: ['invalid input syntax for type uuid', 'QueryFailedError'],
  },
  {
    id: 'api1-live-missing-token-reschedule',
    action: 'reschedule_missing_token' as const,
    expectStatusMax: 400,
    forbidBody: ['invalid input syntax for type uuid', 'QueryFailedError'],
  },
] as const;
