/** Dashboard retail/finance classifier rules. */
export const RETAIL_FINANCE_DASHBOARD_CLASSIFIER_RULES = `- list_products / create_product / link_product_to_service / adjust_inventory / add_retail_sale_to_booking / remove_retail_line / record_expense / list_expenses / summarize_pl / commission_report / payout_export: inventory, retail POS, and finance (Sprint 33).
- create_product: MUTATE — add a retail inventory product. "Add a retail product called QA Test Product priced at 5 dollars" → productName=QA Test Product, price/retailPrice=5 (accept "priced at N dollars", "$N", "price $N", not only "price 5"). NOT configure_recommendation_product (post-checkout upsell product).
- suggest_retail_upsell / add_retail_to_my_booking: provider retail at chair (Sprint 33).
- update_inventory_product: MUTATE — edit an existing product's name/SKU/retail price/unit cost/reorder level, or toggle active status. Requires productName or productId plus at least one field. NOT create_product (new row), NOT adjust_inventory (stock quantity only).
- delete_inventory_product: MUTATE — remove a product from the active catalog (soft — deactivates it). Requires productName or productId.
- unlink_inventory_product: MUTATE — remove a product-to-service link so the product no longer auto-deducts for that service. Requires linkId, or both productName and serviceName. NOT link_product_to_service (creates the link).
- set_recommended_products: MUTATE — bulk-replace the full list of checkout-recommended products for a service or category in one call. Requires serviceName (or categoryId) plus productIds or productNames. "Recommend shampoo and conditioner for the haircut service" → set_recommended_products, serviceName=haircut, productNames=["shampoo","conditioner"].
- record_expense: MUTATE — log a business expense. Requires amount; category must be a real spend type (supplies, rent, utilities, marketing, payroll, travel, software, equipment, office, general) — NEVER date words like today/tomorrow/yesterday. "Add a $20 business expense today for QA test cleaning supplies" → amount=20, category=supplies (from cleaning/supplies), description="QA test cleaning supplies". Optional description from "for …". NOT delete_expense.
- delete_expense: MUTATE — delete a recorded expense. Requires expenseId, or category/description to match. "Delete the $20 QA test cleaning supplies expense I just added" → description="QA test cleaning supplies". Extract description from text before "expense" or "expense for/called X". NOT record_expense (creates one).
- create_commission_rule: MUTATE — set up a commission rule (percent or flat amount) for an employee and/or service. Requires value; optional employeeName, serviceName, type=percent|flat (default percent). "Set commission rate for Gevorg Gasparyan to 20 percent" → create_commission_rule, employeeName="Gevorg Gasparyan", value=20, type=percent. NOT commission_report (read-only).
- list_refunds: READ — list and total the refunds issued (booking payment refunds), optionally scoped to a date range ("this month", "last month", explicit dates). "How many refunds have I issued this month?" → list_refunds. NOT export_analytics_report (full downloadable report, not a quick refund tally), NOT refund_gift_card_order (gift-card-specific mutate action).
- delete_commission_rule: MUTATE — remove a commission rule. Requires ruleId, or employeeName/serviceName to match.
- export_analytics_report: MUTATE — generate the business analytics report (staff performance, service popularity, P&L) as a CSV or printable HTML document. Optional from/to date range, locationId, format=csv|pdf (default csv). "Export my analytics report for this quarter" → export_analytics_report. NOT summarize_pl (single P&L narration only, no exportable file), NOT payout_export (commission payouts only).
- summarize_reviews: READ — summarize customer review ratings and counts, overall or per employee. Optional employeeId to scope to one provider. NOT list_provider_reviews (public-facing per-provider review list on the booking site).
- summarize_adoption_funnel: READ — summarize the consumer app adoption funnel (install → sign-in → book → rebook step counts and conversion) over a period. Optional periodDays (7-90, default 30). NOT summarize_new_registrations (customer sign-up count only, no app funnel steps).`;

/** e2e-bug.146 — prompts that must rescue to retail/finance mutates (not react_agent). */
export const RETAIL_FINANCE_E2E146_RESCUE_SCENARIOS = [
  {
    id: 'e2e146-create-commission-rule',
    prompt: 'Set commission rate for Gevorg Gasparyan to 20 percent',
    expectedAction: 'create_commission_rule' as const,
    paramsPartial: {
      employeeName: 'Gevorg Gasparyan',
      value: 20,
      type: 'percent',
    },
  },
  {
    id: 'e2e146-export-analytics',
    prompt: 'Export my analytics report for this quarter',
    expectedAction: 'export_analytics_report' as const,
    paramsPartial: { dateRange: 'this_quarter' },
  },
] as const;
