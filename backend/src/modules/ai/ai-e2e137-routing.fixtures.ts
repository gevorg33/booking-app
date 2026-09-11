/**
 * e2e-bug.137 — domains that fell to tool-less react_agent must rescue to real
 * dashboard actions (routing problem, not missing features).
 */
export const E2E137_ROUTING_RESCUE_SCENARIOS = [
  {
    id: 'revenue-have-i-made',
    prompt: 'How much revenue have I made this month?',
    expectedAction: 'summarize_bookings',
    rescueReason: 'total_earnings',
  },
  {
    id: 'pending-agent-tasks',
    prompt: 'Show me pending AI agent tasks',
    expectedAction: 'list_agent_tasks',
    rescueReason: 'list_tasks',
  },
  {
    id: 'active-promo-codes',
    prompt: 'What promo codes are currently active',
    expectedAction: 'list_promo_codes',
    rescueReason: 'list_promo_codes',
  },
  {
    id: 'commission-employees-earned',
    prompt: 'How much commission have my employees earned this month?',
    expectedAction: 'commission_report',
    rescueReason: 'commission_report',
  },
  {
    // §171 — was `customer_retention`. This fixture is from 2026-07-20; on
    // 2026-08-02 the service gained a second, earlier-running retention producer
    // that answers through the metric resolvers with `customer_retention_rate`.
    // It is the better answer for a prompt asking about a *rate*: the older
    // branch sets `customerMetric: 'at_risk'`, the newer one sets `'retention'`.
    // The action was never wrong — only this label. Nothing went red at the time
    // because `ai-e2e137-routing.util.spec.ts` asserts against its own private
    // copy of the chain rather than the service (`e2e-bug.458`).
    id: 'customer-retention-rate',
    prompt: 'What is my customer retention rate?',
    expectedAction: 'summarize_customers',
    rescueReason: 'customer_retention_rate',
  },
  {
    id: 'sales-tax-rate-configured',
    prompt: "What's my sales tax rate configured to?",
    expectedAction: 'explain_business_tax',
    rescueReason: 'explain_business_tax',
  },
  {
    id: 'ai-automation-settings',
    prompt: 'Summarize my AI automation settings and autopilot rules',
    expectedAction: 'summarize_ai_settings',
    rescueReason: 'summarize_ai_settings',
  },
  {
    id: 'customer-reviews-ratings',
    prompt: 'Show me my customer reviews and ratings',
    expectedAction: 'summarize_reviews',
    rescueReason: 'summarize_reviews',
  },
  {
    id: 'professional-profile',
    prompt: "Show me Mariam Ohanyan's professional profile",
    expectedAction: 'explain_professional_profile',
    rescueReason: 'professional_profile',
  },
  {
    // §171 — this row and `e2e153-how-many-customers` carry the *identical*
    // prompt and asserted opposite things, both shipped 2026-07-20. e2e-bug.153
    // is the deliberate design and it wins on the evidence: `resolveUnscopedCustomerCount`
    // lists `list_customers` in its own `steerable` set, so overriding it is the
    // stated intent, and the resolver answers with `customerMetric: 'overview'`,
    // which is what a count question wants. Aligned rather than deleted so the
    // corpus keeps the row; the duplication itself is `e2e-bug.459`.
    id: 'list-customers-how-many',
    prompt: 'How many customers do I have?',
    expectedAction: 'summarize_customers',
    rescueReason: 'unscoped_customer_count',
  },
  {
    id: 'owner-business-hours',
    prompt: 'What are my business hours?',
    expectedAction: 'explain_business_hours_and_location',
    rescueReason: 'business_hours_location',
  },
] as const;
