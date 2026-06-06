/** Dashboard classifier rules for reports / P&L KPI currency (ai-cmd-curr-13). */
export const REPORTS_CURRENCY_CLASSIFIER_RULES = `- explain_reports_currency: READ — explain why dashboard overview revenue, Reports staff/service revenue columns, and Operations P&L KPIs (gross revenue, expenses, commissions, net profit) show a specific ISO currency code. All analytics payloads use the salon business default currency via getBusinessDefaultCurrency; v1 does not apply FX conversion or mix currencies in totals. NOT explain_business_currency (default currency settings overview), NOT summarize_pl or summarize_staff (fetch revenue numbers), and NOT summarize_revenue_kpis (natural-language revenue summary).
- Examples:
  - "Why do staff revenue reports show amounts in AMD?" → explain_reports_currency
  - "Explain the currency on our analytics reports page" → explain_reports_currency
  - "What currency code do P&L and operations KPIs use?" → explain_reports_currency
  - "Do reports convert between currencies?" → explain_reports_currency
  - "Почему в отчётах выручка показана в драмах?" → explain_reports_currency
  - "Ինչու են հաշվետվություններում գումարները ցուցադրվում դրամով" → explain_reports_currency`;

export const EXPLAIN_REPORTS_CURRENCY_PROMPTS = [
  {
    id: 'why-staff-revenue-amd',
    prompt: 'Why do staff revenue reports show amounts in AMD?',
  },
  {
    id: 'explain-analytics-reports-currency',
    prompt: 'Explain the currency on our analytics reports page',
  },
  {
    id: 'what-currency-pl-kpis',
    prompt: 'What currency code do P&L and operations KPIs use?',
  },
  {
    id: 'why-dashboard-revenue-euros',
    prompt: 'Why is dashboard revenue this month labeled in euros?',
  },
  {
    id: 'reports-revenue-eur-label',
    prompt: 'Reports show Revenue (EUR) — why that currency?',
  },
  {
    id: 'do-reports-convert-fx',
    prompt: 'Do reports convert between currencies?',
  },
  {
    id: 'why-service-revenue-currency',
    prompt: 'Why does the service popularity revenue column use our salon currency?',
  },
  {
    id: 'operations-pl-currency-code',
    prompt: 'What currency are Operations net profit and expenses shown in?',
  },
  {
    id: 'ru-reports-revenue-dram',
    prompt: 'Почему в отчётах выручка показана в драмах?',
  },
  {
    id: 'hy-reports-amounts-dram',
    prompt: 'Ինչու են հաշվետվություններում գումարները ցուցադրվում դրամով',
  },
] as const;
