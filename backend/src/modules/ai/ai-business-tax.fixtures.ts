import { TAX_DISPLAY_EN_CLASSIFIER_RULES } from './ai-tax-display-en.fixtures.js';

/** Dashboard classifier rules for business tax settings (ai-cmd-tax-1..7). */
export const BUSINESS_TAX_CLASSIFIER_RULES = `- configure_business_tax: MUTATE — set salon-wide tax settings in business.settings.tax: enabled, name (VAT/GST/Sales Tax), rate percent, and pricing model (inclusive | exclusive). Triggers: enable/disable + VAT/GST/sales tax + rate percent; switch/set tax-inclusive or tax-exclusive pricing; set GST/VAT rate. NOT explain_business_tax (read-only status), NOT set_service_tax_rate (per-service override), NOT configure_stacked_tax_rules (parallel rules), and NOT explain_checkout_tax (customer booking page).
- set_service_tax_rate: MUTATE — set per-service tax override on catalog service.metadata.taxRatePercent (0 = tax-exempt, positive = override rate). Triggers: make/apply/set + service name or category + tax-exempt or N% tax + only. Requires confirmation before updating rows. NOT configure_business_tax (salon-wide settings) and NOT explain_business_tax (read-only).
- configure_stacked_tax_rules: MUTATE — add, stack, or remove parallel tax rules in business.settings.tax.rules (GST + PST, federal + state). Each rule has name + rate; effective rate is the sum. Triggers: add/stack + multiple named rates; remove/delete + named tax rule. NOT configure_business_tax (single rate), NOT set_service_tax_rate (per-service), and NOT explain_stacked_tax (read-only).
- explain_business_tax: READ — explain current business.settings.tax: enabled, name, rate, inclusive/exclusive model, tax number; show example net/tax/gross breakdown on a sample price. NOT configure_business_tax (mutate), NOT set_service_tax_rate (per-service override), NOT explain_stacked_tax (stacked rules), and NOT explain_checkout_tax (customer booking page).
- explain_stacked_tax: READ — list each stacked tax rule, combined effective rate, and per-rule example breakdown on a sample price. NOT explain_business_tax (single-rate settings), NOT explain_checkout_tax (customer booking page), and NOT configure_stacked_tax_rules (mutate).
- quote_staff_booking_tax: READ — preview tax on a catalog service before staff creates a booking; cite stacked rules vs per-service metadata.taxRatePercent override. Optional serviceName and sample price. NOT set_service_tax_rate (mutate), NOT explain_business_tax (salon settings), and NOT explain_stacked_tax (rules list without a service).
- summarize_customer_tax_paid: READ — total tax paid across a customer's paid appointment history from metadata.pricing.taxAmount (customer profile). Requires customerName. NOT lookup_customer (general profile) and NOT summarize_customers (rankings).
- lookup_booking_tax_metadata: READ — retrieve frozen metadata.pricing tax snapshot from a booking after Stripe checkout for disputes/receipts. Optional bookingId or customerName. NOT explain_stripe_tax_charge (why charged) and NOT explain_appointment_tax (provider breakdown).
- explain_stripe_tax_charge: READ — explain why Stripe charged a booking amount using frozen metadata.pricing tax fields (inclusive gross vs exclusive net+tax, taxRules breakdown). Optional bookingId or customerName. NOT explain_stripe_checkout_currency (ISO currency), NOT explain_checkout_tax (booking page settings), and NOT diagnose_stripe_checkout_failure (session errors).
- Examples:
  - "Enable 20% VAT" → configure_business_tax, enabled=true, rate=20, name=VAT
  - "Switch to tax-inclusive pricing" → configure_business_tax, model=inclusive
  - "Set our GST rate to 5%" → configure_business_tax, enabled=true, rate=5, name=GST
  - "Make massage services tax-exempt" → set_service_tax_rate, serviceQuery=massage, taxRatePercent=0
  - "Apply 10% tax to medical consultations only" → set_service_tax_rate, serviceQuery=medical consultations, taxRatePercent=10
  - "What is our current VAT rate?" → explain_business_tax
  - "Explain our salon tax settings with an example on $100" → explain_business_tax
  - "Add 5% GST and 8% PST" → configure_stacked_tax_rules
  - "Remove the state tax rule" → configure_stacked_tax_rules
  - "Explain our stacked tax rules" → explain_stacked_tax
  - "Why did Stripe charge $120 for Jane's booking?" → explain_stripe_tax_charge
  - "Lookup tax metadata for booking bk-tax-001" → lookup_booking_tax_metadata
  - "Preview tax on massage before creating a booking" → quote_staff_booking_tax
  - "How much tax has Jane paid across her appointments?" → summarize_customer_tax_paid

${TAX_DISPLAY_EN_CLASSIFIER_RULES}`;

export const CONFIGURE_BUSINESS_TAX_PROMPTS = [
  {
    id: 'enable-20-vat',
    prompt: 'Enable 20% VAT',
    enabled: true,
    rate: 20,
    name: 'VAT',
  },
  {
    id: 'switch-tax-inclusive',
    prompt: 'Switch to tax-inclusive pricing',
    model: 'inclusive' as const,
  },
  {
    id: 'set-gst-5',
    prompt: 'Set our GST rate to 5%',
    enabled: true,
    rate: 5,
    name: 'GST',
  },
  {
    id: 'enable-10-sales-tax',
    prompt: 'Enable 10% sales tax',
    enabled: true,
    rate: 10,
    name: 'Sales Tax',
  },
  {
    id: 'tax-exclusive-pricing',
    prompt: 'Use tax-exclusive pricing',
    model: 'exclusive' as const,
  },
  {
    id: 'disable-vat',
    prompt: 'Disable VAT for our salon',
    enabled: false,
  },
] as const;

export const SET_SERVICE_TAX_RATE_PROMPTS = [
  {
    id: 'massage-tax-exempt',
    prompt: 'Make massage services tax-exempt',
    serviceQuery: 'massage',
    taxRatePercent: 0,
  },
  {
    id: 'medical-10-only',
    prompt: 'Apply 10% tax to medical consultations only',
    serviceQuery: 'medical consultations',
    taxRatePercent: 10,
  },
  {
    id: 'spa-zero-tax',
    prompt: 'Set spa services to 0% tax',
    serviceQuery: 'spa',
    taxRatePercent: 0,
  },
  {
    id: 'facials-5-percent',
    prompt: 'Apply 5% tax to facial services only',
    serviceQuery: 'facial',
    taxRatePercent: 5,
  },
  {
    id: 'consultation-exempt',
    prompt: 'Make consultation services tax-exempt',
    serviceQuery: 'consultation',
    taxRatePercent: 0,
  },
  {
    id: 'dental-8-percent',
    prompt: 'Set 8% tax on dental services',
    serviceQuery: 'dental',
    taxRatePercent: 8,
  },
] as const;

export const EXPLAIN_BUSINESS_TAX_PROMPTS = [
  {
    id: 'what-vat-rate',
    prompt: 'What is our current VAT rate?',
  },
  {
    id: 'explain-salon-tax',
    prompt: 'Explain our salon tax settings',
  },
  {
    id: 'current-tax-model',
    prompt: 'Show our current tax name, rate, and pricing model',
  },
  {
    id: 'tax-breakdown-example',
    prompt: 'Explain business tax with an example breakdown on $100',
  },
  {
    id: 'tax-number-status',
    prompt: 'What tax number do we have on file and is tax enabled?',
  },
  {
    id: 'how-tax-works',
    prompt: 'How does our business tax work on checkout?',
  },
] as const;
