/** Dashboard/support classifier rules for booking tax metadata lookup (ai-cmd-tax-10). */
export const LOOKUP_BOOKING_TAX_METADATA_CLASSIFIER_RULES = `- lookup_booking_tax_metadata: READ — retrieve frozen tax breakdown from booking metadata.pricing after Stripe checkout (taxEnabled, taxName, taxRate, taxModel, taxAmount, netAmount, amountDue, taxRules[], amountPaid). For disputes, receipts, and support tickets. Optional bookingId or customerName. NOT explain_stripe_tax_charge (why Stripe charged), NOT explain_appointment_tax (provider payment breakdown), and NOT explain_business_tax (salon settings).
- Examples:
  - "Lookup tax metadata for booking bk-tax-001" → lookup_booking_tax_metadata
  - "Show metadata.pricing tax breakdown for Jane's Stripe checkout" → lookup_booking_tax_metadata
  - "Retrieve tax fields from booking metadata for a receipt dispute" → lookup_booking_tax_metadata
  - "Get frozen VAT breakdown after Stripe payment for booking abc123" → lookup_booking_tax_metadata`;

export const LOOKUP_BOOKING_TAX_METADATA_PROMPTS = [
  {
    id: 'lookup-booking-tax-metadata',
    prompt: 'Lookup tax metadata for booking bk-tax-001',
  },
  {
    id: 'show-pricing-tax-breakdown',
    prompt: 'Show metadata.pricing tax breakdown for Jane Stripe checkout',
  },
  {
    id: 'retrieve-dispute-tax',
    prompt: 'Retrieve tax fields from booking metadata for a receipt dispute',
  },
  {
    id: 'get-frozen-vat-stripe',
    prompt:
      'Get frozen VAT breakdown after Stripe payment for booking bk-tax-001',
  },
  {
    id: 'support-tax-metadata',
    prompt: 'Pull booking tax metadata for support ticket — booking bk-tax-001',
  },
  {
    id: 'stripe-checkout-tax-snapshot',
    prompt:
      'What tax snapshot is stored on metadata.pricing for the Stripe checkout booking?',
  },
] as const;
