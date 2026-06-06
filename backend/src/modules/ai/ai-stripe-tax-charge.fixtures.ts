/** Dashboard classifier rules for Stripe tax charge explain (ai-cmd-tax-9). */
export const STRIPE_TAX_CHARGE_CLASSIFIER_RULES = `- explain_stripe_tax_charge: READ — explain why Stripe charged a specific amount for a booking: inclusive gross (tax embedded in amountDue) vs exclusive net+tax (amountDue = net + taxAmount from metadata.pricing). Cite frozen pricing fields: taxEnabled, taxName, taxRate, taxModel, taxAmount, netAmount, amountDue, taxRules[]. Optional bookingId or customerName to locate the booking. NOT explain_stripe_checkout_currency (charge ISO currency), NOT explain_checkout_tax (anonymous booking page settings), NOT diagnose_stripe_checkout_failure (session creation errors), and NOT explain_business_tax (salon-wide settings without a booking).
- Examples:
  - "Why did Stripe charge $120 for Jane's booking?" → explain_stripe_tax_charge
  - "Explain the tax on our last Stripe payment" → explain_stripe_tax_charge
  - "Why was VAT added to the Stripe charge for booking abc123?" → explain_stripe_tax_charge
  - "Stripe charged 113 — is that inclusive or exclusive tax?" → explain_stripe_tax_charge`;

export const EXPLAIN_STRIPE_TAX_CHARGE_PROMPTS = [
  {
    id: 'why-stripe-charged-customer',
    prompt: "Why did Stripe charge $120 for Jane's booking?",
  },
  {
    id: 'stripe-tax-inclusive-exclusive',
    prompt: 'Stripe charged 113 — is that inclusive or exclusive tax?',
  },
  {
    id: 'explain-vat-stripe-booking',
    prompt: 'Explain the VAT on our Stripe payment for booking bk-tax-001',
  },
  {
    id: 'why-tax-added-stripe',
    prompt: 'Why was tax added to the Stripe charge for this booking?',
  },
  {
    id: 'stripe-amount-breakdown',
    prompt: 'Break down why Stripe charged the amount on metadata.pricing for the last online payment',
  },
  {
    id: 'stacked-tax-stripe-charge',
    prompt: 'Why did Stripe charge $113 with GST and PST lines on the booking?',
  },
] as const;
