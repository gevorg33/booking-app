/** Provider app classifier rules for appointment tax display (ai-cmd-tax-11). */
export const APPOINTMENT_TAX_CLASSIFIER_RULES = `- explain_appointment_tax: READ — explain tax lines on the provider appointment payment breakdown: inclusive vs exclusive model, per-rule taxLines, and amount collected when marked paid (metadata.pricing + paymentStatus). Optional bookingId from prompt or session. NOT explain_provider_payment_currency (ISO currency symbol), NOT explain_payment_status (paid/pending only), and NOT lookup_booking_tax_metadata (support metadata dump).
- Examples:
  - "Explain tax lines on this appointment payment breakdown" → explain_appointment_tax
  - "Is VAT included in the amount we collected?" → explain_appointment_tax
  - "What tax was collected when I marked this booking paid?" → explain_appointment_tax
  - "Show inclusive vs exclusive tax on appointment bk-tax-001" → explain_appointment_tax`;

export const EXPLAIN_APPOINTMENT_TAX_PROMPTS = [
  {
    id: 'explain-tax-lines-breakdown',
    prompt: 'Explain tax lines on this appointment payment breakdown',
  },
  {
    id: 'vat-included-collected',
    prompt: 'Is VAT included in the amount we collected?',
  },
  {
    id: 'tax-when-marked-paid',
    prompt: 'What tax was collected when I marked this booking paid?',
  },
  {
    id: 'inclusive-exclusive-appointment',
    prompt: 'Show inclusive vs exclusive tax on appointment bk-tax-001',
  },
  {
    id: 'gst-lines-provider',
    prompt: 'Why do I see GST lines on this appointment detail?',
  },
  {
    id: 'collected-amount-tax',
    prompt: 'How much tax is in the collected payment for this appointment?',
  },
  {
    id: 'why-vat-breakdown',
    prompt: 'Why VAT on this breakdown?',
  },
  {
    id: 'inclusive-vs-exclusive-tax',
    prompt: 'Inclusive vs exclusive tax?',
  },
] as const;
