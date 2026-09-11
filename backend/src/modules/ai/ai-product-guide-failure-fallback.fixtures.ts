import type { CommandSurface } from './ai-command-registry.types.js';

/** Post-failure guide fallback scenarios (ai-guide-1.8.3, acc-4.7, n99-1). */
export const POST_FAILURE_GUIDE_FALLBACK_SCENARIOS = [
  {
    id: 'dashboard-unknown-clarify',
    surface: 'dashboard' as CommandSurface,
    route: '/dashboard/schedule',
    locale: 'en',
    result: {
      success: false,
      action: 'unknown',
      summary:
        "I didn't fully understand that command. Which of these did you mean?",
      details: {
        needsClarification: true,
        pipelineStage: 'unknown_intent_clarify',
      },
    },
    expectSnippet: true,
  },
  {
    id: 'provider-validator-clarify',
    surface: 'provider' as CommandSurface,
    route: '/tabs/today',
    locale: 'en',
    result: {
      success: false,
      action: 'mark_paid',
      summary: 'Which booking should I mark as paid?',
      details: { needsClarification: true },
    },
    // AI-ROADMAP Phase 6 (AI-TODO): this fixture encoded the bug. The command
    // is known (`mark_paid`) and the summary is already a precise question —
    // "Which booking should I mark as paid?" — so appending a product-guide
    // tour answers a question the user did not ask instead of the one the
    // assistant did. A clarify-needed command now yields the question alone.
    expectSnippet: false,
  },
  {
    id: 'customer-handler-failure',
    surface: 'customer' as CommandSurface,
    route: '/s/book',
    locale: 'en',
    result: {
      success: false,
      action: 'book_nearest_slot',
      summary: 'No available slots matched that request.',
      details: {},
    },
    expectSnippet: true,
  },
  {
    id: 'public-unknown-clarify',
    surface: 'public' as CommandSurface,
    route: '/book/checkout',
    locale: 'en',
    result: {
      success: false,
      action: 'unknown',
      summary: "I didn't fully understand that. What would you like to do?",
      details: {
        needsClarification: true,
        pipelineStage: 'unknown_intent_clarify',
      },
    },
    expectSnippet: true,
  },
  {
    id: 'skip-when-success',
    surface: 'dashboard' as CommandSurface,
    route: '/dashboard/schedule',
    locale: 'en',
    result: {
      success: true,
      action: 'query_bookings',
      summary: 'Found 3 bookings.',
      details: {},
    },
    expectSnippet: false,
  },
  {
    id: 'skip-when-guide-present',
    surface: 'dashboard' as CommandSurface,
    route: '/dashboard/schedule',
    locale: 'en',
    result: {
      success: false,
      action: 'guide_user_flow',
      summary: 'Guide clarify',
      details: { needsClarification: true },
      guide: {
        summary: 'Existing guide',
        steps: [{ title: 'Step 1', body: 'Body' }],
      },
    },
    expectSnippet: false,
  },
  {
    id: 'skip-security-blocked',
    surface: 'customer' as CommandSurface,
    route: '/s/account',
    locale: 'en',
    result: {
      success: false,
      action: 'security_blocked',
      summary: 'Not allowed.',
      details: {},
    },
    expectSnippet: false,
  },
  // e2e-bug.53 — shouldAppend stays true, but weak routes must not attach a guide
  {
    id: 'skip-customer-default-tabs-route',
    surface: 'customer' as CommandSurface,
    route: '/s',
    locale: 'en',
    prompt: 'Hello',
    result: {
      success: false,
      action: 'unknown',
      summary: "I didn't fully understand that. What would you like to do?",
      details: {
        needsClarification: true,
        pipelineStage: 'unknown_intent_clarify',
      },
    },
    expectSnippet: true,
    expectGuideAttached: false,
  },
  {
    id: 'skip-public-overview-default-route',
    surface: 'public' as CommandSurface,
    route: '/book',
    locale: 'en',
    prompt: 'Hello',
    result: {
      success: false,
      action: 'unknown',
      summary: "I didn't fully understand that. What would you like to do?",
      details: {
        needsClarification: true,
        pipelineStage: 'unknown_intent_clarify',
      },
    },
    expectSnippet: true,
    expectGuideAttached: false,
  },
] as const;
