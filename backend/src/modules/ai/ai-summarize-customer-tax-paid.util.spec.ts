import { SUMMARIZE_CUSTOMER_TAX_PAID_PROMPTS } from './ai-summarize-customer-tax-paid.fixtures.js';
import {
  parseSummarizeCustomerTaxPaidFromPrompt,
  rescueSummarizeCustomerTaxPaidIntent,
} from './ai-summarize-customer-tax-paid.util.js';

describe('ai-summarize-customer-tax-paid.util (ai-cmd-tax-13)', () => {
  it.each(SUMMARIZE_CUSTOMER_TAX_PAID_PROMPTS)(
    'rescues summarize customer tax paid prompt $id',
    ({ prompt }) => {
      expect(rescueSummarizeCustomerTaxPaidIntent(prompt, 'unknown')).toEqual({
        action: 'summarize_customer_tax_paid',
        rescueReason: 'summarize_customer_tax_paid',
      });
    },
  );

  it('parses customer name from prompt', () => {
    expect(
      parseSummarizeCustomerTaxPaidFromPrompt(
        'How much tax has Jane paid across her appointments?',
      ),
    ).toEqual({ customerName: 'Jane' });
  });

  it('does not rescue general customer lookup prompts', () => {
    expect(
      rescueSummarizeCustomerTaxPaidIntent(
        'Look up customer Jane and show her last visit',
        'unknown',
      ),
    ).toBeNull();
  });
});
