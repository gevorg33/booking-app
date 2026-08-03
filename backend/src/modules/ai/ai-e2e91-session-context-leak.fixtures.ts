/**
 * e2e-bug.91 — booking_help / guide_user_flow / public assistant must never
 * echo orchestration internals (_capabilityHints, _entityMemoryBlock,
 * trace/role keys) in sessionContext returned to anonymous clients.
 */
export const E2E91_LEAKED_SESSION_KEYS = [
  '_capabilityHints',
  '_entityMemoryBlock',
  '_entityMemoryAliases',
  '_conversationSummary',
  '_ragContextBlock',
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

/** Substrings that must never appear in a public assistant HTTP body. */
export const E2E91_LEAK_BODY_MARKERS = [
  '_capabilityHints',
  '_entityMemoryBlock',
  '_entityMemoryAliases',
  '_commandTraceId',
  'PublicBookingAssistantService',
  'FULL SYSTEM PROMPT',
] as const;

export const E2E91_DIRTY_SESSION_CONTEXT = {
  serviceName: 'Massage',
  guideFlowId: 'public-booking-flow',
  guideStepIndex: 0,
  completedSteps: [0],
  _capabilityHints:
    'FULL SYSTEM PROMPT listing create_booking, summarize_day, …',
  _entityMemoryBlock: 'mary → customer=Mary',
  _entityMemoryAliases: { mary: 'customer=Mary' },
  _conversationSummary: 'internal summary',
  _ragContextBlock: 'rag block',
  _commandTraceId: 'trace-e2e91',
  _accessTier: 'client',
  _actorRole: 'client',
  _roleProfile: 'owner',
  _membershipRole: 'client',
  _planTierId: 'starter',
  _scopedEmployeeId: 'emp-1',
  _locationId: 'loc-1',
  _branchHint: 'downtown',
  _confidenceHigh: 0.9,
  _abVariantId: 'ab-1',
} as const;

/**
 * Live prompts that historically dumped the full debug bag (esp. when
 * falling through to guide_user_flow / booking_help).
 */
export const E2E91_LIVE_LEAK_PROMPTS = [
  {
    id: 'e2e91-how-book',
    prompt: 'how do I book with you?',
  },
  {
    id: 'e2e91-booking-help',
    prompt: 'booking help',
  },
  {
    id: 'e2e91-gift-shipment',
    prompt: 'Where is my physical gift card shipment?',
  },
  {
    id: 'e2e91-resume-draft',
    prompt: 'Continue where I left off with my booking',
  },
  {
    id: 'e2e91-guide-home-tab',
    prompt: 'How do I use the Home tab?',
  },
  {
    id: 'e2e91-guide-packages',
    prompt: 'How do I buy a package?',
  },
  {
    id: 'e2e91-list-services',
    prompt: 'what services do you offer?',
  },
  {
    id: 'e2e91-bare-help',
    prompt: 'help',
  },
] as const;
