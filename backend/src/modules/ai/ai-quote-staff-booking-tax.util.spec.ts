import { QUOTE_STAFF_BOOKING_TAX_PROMPTS } from './ai-quote-staff-booking-tax.fixtures.js';
import {
  parseQuoteStaffBookingTaxFromPrompt,
  rescueQuoteStaffBookingTaxIntent,
} from './ai-quote-staff-booking-tax.util.js';

describe('ai-quote-staff-booking-tax.util (ai-cmd-tax-12)', () => {
  it.each(QUOTE_STAFF_BOOKING_TAX_PROMPTS)(
    'rescues quote staff booking tax prompt $id',
    ({ prompt }) => {
      expect(rescueQuoteStaffBookingTaxIntent(prompt, 'unknown')).toEqual({
        action: 'quote_staff_booking_tax',
        rescueReason: 'quote_staff_booking_tax',
      });
    },
  );

  it('parses service query and sample price', () => {
    expect(
      parseQuoteStaffBookingTaxFromPrompt(
        'Quote GST and PST on a $120 haircut for staff booking',
      ),
    ).toEqual({ serviceQuery: 'haircut', samplePrice: 120 });
  });

  it('does not rescue salon settings explain prompts', () => {
    expect(
      rescueQuoteStaffBookingTaxIntent(
        'Explain our salon tax settings with an example on $100',
        'unknown',
      ),
    ).toBeNull();
  });
});
