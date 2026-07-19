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
    id: 'customer-retention-rate',
    prompt: 'What is my customer retention rate?',
    expectedAction: 'summarize_customers',
    rescueReason: 'customer_retention',
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
    id: 'list-customers-how-many',
    prompt: 'How many customers do I have?',
    expectedAction: 'list_customers',
    rescueReason: 'list_customers',
  },
  {
    id: 'owner-business-hours',
    prompt: 'What are my business hours?',
    expectedAction: 'explain_business_hours_and_location',
    rescueReason: 'business_hours_location',
  },
] as const;
