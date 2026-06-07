/** Dashboard classifier rules for staff booking tax preview (ai-cmd-tax-12). */
export const QUOTE_STAFF_BOOKING_TAX_CLASSIFIER_RULES = `- quote_staff_booking_tax: READ — preview tax on a catalog service before staff creates a booking: net/tax/gross using business.settings.tax, stacked rules, or per-service metadata.taxRatePercent override. Optional serviceName and sample price. NOT set_service_tax_rate (mutate override), NOT explain_business_tax (salon settings only), and NOT explain_stacked_tax (list rules without a service).
- Examples:
  - "Preview tax on massage before creating a booking" → quote_staff_booking_tax
  - "Quote GST and PST on a $120 haircut for staff booking" → quote_staff_booking_tax
  - "What tax applies to consultation service before I book it?" → quote_staff_booking_tax
  - "How much tax on Swedish massage — does the service override or stacked rules apply?" → quote_staff_booking_tax`;

export const QUOTE_STAFF_BOOKING_TAX_PROMPTS = [
  {
    id: 'preview-massage-before-booking',
    prompt: 'Preview tax on massage before creating a booking',
  },
  {
    id: 'quote-haircut-stacked',
    prompt: 'Quote GST and PST on a $120 haircut for staff booking',
  },
  {
    id: 'consultation-before-book',
    prompt: 'What tax applies to consultation service before I book it?',
  },
  {
    id: 'override-vs-stacked',
    prompt:
      'How much tax on Swedish massage — does the service override or stacked rules apply?',
  },
  {
    id: 'estimate-facial-tax',
    prompt:
      'Estimate tax on classic facial before staff creates the appointment',
  },
  {
    id: 'tax-exempt-preview',
    prompt: 'Preview tax on medical consultation — is it tax-exempt?',
  },
] as const;
