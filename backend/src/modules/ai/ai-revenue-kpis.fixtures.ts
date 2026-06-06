/** Dashboard classifier rules for combined revenue KPI summary (ai-cmd-curr-14). */
export const REVENUE_KPIS_CLASSIFIER_RULES = `- summarize_revenue_kpis: READ — natural-language summary of dashboard overview revenue (revenueThisMonth, netRevenueThisMonth, bookings) plus Reports staff/service revenue for the current or requested period, all in business currency. Combines DashboardService overview with Analytics staffPerformance and servicePopularity. NOT explain_reports_currency (why KPIs show a currency code / no FX), NOT summarize_pl (P&L expenses/commissions only), NOT summarize_staff (top-N provider ranking), and NOT summarize_bookings bookingMetric=revenue (single total earnings figure only).
- Examples:
  - "Summarize revenue KPIs for this month" → summarize_revenue_kpis
  - "Give me a dashboard and reports revenue overview for the current period" → summarize_revenue_kpis
  - "Revenue KPI summary — dashboard plus analytics reports" → summarize_revenue_kpis
  - "What's our revenue picture this month across dashboard and reports?" → summarize_revenue_kpis
  - "Сводка по выручке на дашборде и в отчётах за текущий период" → summarize_revenue_kpis
  - "Ամփոփի՛ր եկամուտի KPI-ները դաշտբորդում և հաշվետվություններում" → summarize_revenue_kpis`;

export const SUMMARIZE_REVENUE_KPIS_PROMPTS = [
  {
    id: 'summarize-kpis-this-month',
    prompt: 'Summarize revenue KPIs for this month',
  },
  {
    id: 'dashboard-reports-overview',
    prompt:
      'Give me a dashboard and reports revenue overview for the current period',
  },
  {
    id: 'kpi-summary-dashboard-analytics',
    prompt: 'Revenue KPI summary — dashboard plus analytics reports',
  },
  {
    id: 'revenue-picture-month',
    prompt:
      "What's our revenue picture this month across dashboard and reports?",
  },
  {
    id: 'summarize-salon-revenue-kpis',
    prompt: 'Summarize our salon revenue KPIs in business currency',
  },
  {
    id: 'overview-staff-service-revenue',
    prompt:
      'Overview of dashboard revenue this month and staff/service totals from reports',
  },
  {
    id: 'tell-me-revenue-kpis',
    prompt: 'Tell me the revenue KPIs for dashboard overview and reports',
  },
  {
    id: 'current-period-revenue-snapshot',
    prompt: 'Current period revenue snapshot — dashboard and reports',
  },
  {
    id: 'ru-revenue-kpi-period',
    prompt: 'Сводка по выручке на дашборде и в отчётах за текущий период',
  },
  {
    id: 'hy-revenue-kpi-dashboard-reports',
    prompt: 'Ամփոփի՛ր եկամուտի KPI-ները դաշտբորդում և հաշվետվություններում',
  },
] as const;
