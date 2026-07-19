/**
 * e2e-bug.30 / e2e-bug.97 / api-bug.1 — guest/self-service `customer:<uuid>`
 * actors must not crash BookingService.update → findOne →
 * resolveStaffPhiContext → ensureMember.
 */
export const E2E97_GUEST_ACTOR_SCENARIOS = [
  {
    id: 'e2e-bug.30-customer-prefixed-actor',
    actorId: 'customer:36400df4-1111-4111-8111-111111111111',
    expectEnsureMember: false,
  },
  {
    id: 'e2e97-non-uuid-actor',
    actorId: 'not-a-uuid-actor',
    expectEnsureMember: false,
  },
  {
    id: 'e2e97-staff-uuid-actor',
    actorId: '11111111-1111-4111-8111-111111111111',
    expectEnsureMember: true,
  },
] as const;

export type E2e97GuestActorScenario =
  (typeof E2E97_GUEST_ACTOR_SCENARIOS)[number];
