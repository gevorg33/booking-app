/** Dashboard classifier rules for customer tax paid summary (ai-cmd-tax-13). */
export const SUMMARIZE_CUSTOMER_TAX_PAID_CLASSIFIER_RULES = `- summarize_customer_tax_paid: READ — total tax paid across a customer's appointment history from booking metadata.pricing (sum taxAmount on paid appointments shown on the customer profile). Requires customerName. NOT lookup_customer (general profile), NOT summarize_customers (rankings/segments), and NOT lookup_booking_tax_metadata (single booking snapshot).
- Examples:
  - "How much tax has Jane paid across her appointments?" → summarize_customer_tax_paid
  - "Summarize total VAT paid by customer John Smith" → summarize_customer_tax_paid
  - "What tax did Maria pay on her booking history?" → summarize_customer_tax_paid
  - "Show total tax collected from Jane's appointment profile metadata" → summarize_customer_tax_paid`;

export const SUMMARIZE_CUSTOMER_TAX_PAID_PROMPTS = [
  {
    id: 'jane-tax-across-appointments',
    prompt: 'How much tax has Jane paid across her appointments?',
  },
  {
    id: 'summarize-john-vat',
    prompt: 'Summarize total VAT paid by customer John Smith',
  },
  {
    id: 'maria-booking-history-tax',
    prompt: 'What tax did Maria pay on her booking history?',
  },
  {
    id: 'profile-metadata-tax-total',
    prompt: 'Show total tax collected from Jane appointment profile metadata',
  },
  {
    id: 'customer-tax-paid-total',
    prompt: 'Total tax paid by customer Jane Doe from appointment history',
  },
  {
    id: 'how-much-gst-jane',
    prompt: 'How much GST has Jane paid on her paid appointments?',
  },
] as const;
