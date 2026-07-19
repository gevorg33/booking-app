/**
 * e2e-bug.91 — booking_help / public assistant must never echo orchestration
 * internals (_capabilityHints, _entityMemoryBlock, trace/role keys) in
 * sessionContext returned to anonymous clients.
 */
export const E2E91_LEAKED_SESSION_KEYS = [
  '_capabilityHints',
  '_entityMemoryBlock',
  '_commandTraceId',
  '_accessTier',
  '_actorRole',
  '_roleProfile',
  '_membershipRole',
  '_planTierId',
  '_scopedEmployeeId',
  '_locationId',
  '_branchHint',
  '_confidenceHigh',
  '_abVariantId',
] as const;

export const E2E91_DIRTY_SESSION_CONTEXT = {
  serviceName: 'Massage',
  guideFlowId: 'public-booking-flow',
  guideStepIndex: 0,
  completedSteps: [0],
  _capabilityHints:
    'FULL SYSTEM PROMPT listing create_booking, summarize_day, …',
  _entityMemoryBlock: 'Mariam → employee Mariam Ohanyan',
  _commandTraceId: 'trace-e2e91',
  _accessTier: 'client',
  _actorRole: 'client',
  _roleProfile: 'customer',
  _membershipRole: 'client',
  _planTierId: 'starter',
  _scopedEmployeeId: 'emp-1',
  _locationId: 'loc-1',
  _branchHint: 'downtown',
  _confidenceHigh: 0.9,
  _abVariantId: 'ab-1',
} as const;
