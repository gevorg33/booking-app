/** ai-cmd-dashboard-6.2 — business profile + dashboard overview classifier appendix. */
export const BUSINESS_PROFILE_CLASSIFIER_RULES = `- get_dashboard_overview: READ — today's bookings, active employees, service count, customer count, utilization %, revenue/tax/net-revenue this month, no-show rate. Triggers: dashboard overview, business overview, how is the business doing. NOT summarize_day (single-day appointment list, no revenue/KPIs).
- update_business_profile: MUTATE — set business name, description, phone, email, and/or address (branding/social/location settings stay in the dashboard UI). Requires at least one of name/description/phone/email/address. Triggers: update our business phone number, set the business address to..., change the business name to...
- Examples:
  - "How's the business doing this month?" → get_dashboard_overview
  - "Update our business phone to 555-0100" → update_business_profile, phone=555-0100`;
