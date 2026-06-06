import { LOOKUP_BOOKING_TAX_METADATA_PROMPTS } from './ai-lookup-booking-tax-metadata.fixtures.js';
import {
  parseLookupBookingTaxMetadataFromPrompt,
  rescueLookupBookingTaxMetadataIntent,
} from './ai-lookup-booking-tax-metadata.util.js';

describe('ai-lookup-booking-tax-metadata.util (ai-cmd-tax-10)', () => {
  it.each(LOOKUP_BOOKING_TAX_METADATA_PROMPTS)(
    'rescues lookup booking tax metadata prompt $id',
    ({ prompt }) => {
      expect(rescueLookupBookingTaxMetadataIntent(prompt, 'unknown')).toEqual({
        action: 'lookup_booking_tax_metadata',
        rescueReason: 'lookup_booking_tax_metadata',
      });
    },
  );

  it('parses booking id from prompt', () => {
    expect(
      parseLookupBookingTaxMetadataFromPrompt(
        'Lookup tax metadata for booking bk-tax-001',
      ),
    ).toEqual({ bookingId: 'bk-tax-001' });
  });

  it('does not rescue stripe why-charged prompts', () => {
    expect(
      rescueLookupBookingTaxMetadataIntent(
        "Why did Stripe charge $120 for Jane's booking?",
        'unknown',
      ),
    ).toBeNull();
  });
});
