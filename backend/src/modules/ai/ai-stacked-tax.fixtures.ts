/** Dashboard classifier rules for stacked tax rules (ai-cmd-tax-6..7). */
export const STACKED_TAX_CLASSIFIER_RULES = `- configure_stacked_tax_rules: MUTATE — add, stack, or remove parallel tax rules in business.settings.tax.rules (GST + PST, federal + state). Each rule has name + rate percent; effective rate is the sum. Triggers: add/stack + multiple named rates; remove/delete + named tax rule. Enables tax when adding rules. NOT configure_business_tax (single salon-wide rate/model), NOT set_service_tax_rate (per-service override), and NOT explain_stacked_tax (read-only).
- explain_stacked_tax: READ — list each stacked tax rule, combined effective rate, and per-rule example breakdown on a sample price (exclusive adds lines; inclusive splits embedded tax). NOT explain_business_tax (single-rate settings), NOT explain_checkout_tax (customer booking page), and NOT configure_stacked_tax_rules (mutate).
- Examples:
  - "Add 5% GST and 8% PST" → configure_stacked_tax_rules, rules=[{name:GST,rate:5},{name:PST,rate:8}]
  - "Stack federal and state sales tax" → configure_stacked_tax_rules (clarify rates if missing)
  - "Remove the state tax rule" → configure_stacked_tax_rules, removeRuleName=state
  - "Explain our stacked tax rules with a $100 example" → explain_stacked_tax
  - "What is our combined GST plus PST rate?" → explain_stacked_tax`;

export const CONFIGURE_STACKED_TAX_RULES_PROMPTS = [
  {
    id: 'add-gst-pst',
    prompt: 'Add 5% GST and 8% PST',
    operation: 'add' as const,
    rules: [
      { name: 'GST', rate: 5 },
      { name: 'PST', rate: 8 },
    ],
  },
  {
    id: 'stack-federal-state',
    prompt: 'Stack 2% federal and 5% state sales tax',
    operation: 'add' as const,
    rules: [
      { name: 'Federal', rate: 2 },
      { name: 'State', rate: 5 },
    ],
  },
  {
    id: 'stack-federal-state-no-rates',
    prompt: 'Stack federal and state sales tax',
    operation: 'add' as const,
    rules: [] as const,
    clarify: true,
  },
  {
    id: 'add-provincial-vat',
    prompt: 'Add 13% HST and 5% provincial tax',
    operation: 'add' as const,
    rules: [
      { name: 'HST', rate: 13 },
      { name: 'Provincial', rate: 5 },
    ],
  },
  {
    id: 'remove-state-rule',
    prompt: 'Remove the state tax rule',
    operation: 'remove' as const,
    removeRuleName: 'state',
  },
  {
    id: 'delete-pst-rule',
    prompt: 'Delete the PST tax rule',
    operation: 'remove' as const,
    removeRuleName: 'pst',
  },
  {
    id: 'stack-gst-at-rates',
    prompt: 'Stack GST at 5% and PST at 8%',
    operation: 'add' as const,
    rules: [
      { name: 'GST', rate: 5 },
      { name: 'PST', rate: 8 },
    ],
  },
] as const;

export const EXPLAIN_STACKED_TAX_PROMPTS = [
  {
    id: 'explain-stacked-rules',
    prompt: 'Explain our stacked tax rules',
  },
  {
    id: 'combined-gst-pst-rate',
    prompt: 'What is our combined GST plus PST rate?',
  },
  {
    id: 'list-each-rule',
    prompt: 'List each stacked tax rule and the combined effective rate',
  },
  {
    id: 'stacked-breakdown-100',
    prompt: 'Explain stacked tax with a breakdown example on $100',
  },
  {
    id: 'federal-state-breakdown',
    prompt: 'Show federal and state tax breakdown on a sample price',
  },
  {
    id: 'how-stacked-works',
    prompt: 'How do our stacked tax rules work on checkout?',
  },
] as const;
