import { BookingStatus } from '../booking/entities/booking.entity.js';
import {
  buildCancelAndRebookCompoundParams,
  decomposeCancelAndRebookCompoundPrompt,
} from './ai-cancel-and-rebook-compound.util.js';
import {
  enrichCancelMyBookingParamsFromPrompt,
  matchCustomerOwnedBooking,
} from './ai-cancel-my-booking.util.js';
import {
  extractServiceNameFromPrompt,
  isAvailabilityFillerServiceName,
} from './ai-payments.util.js';
import { E2E89_CANCEL_AND_REBOOK_PROMPTS } from './ai-e2e89-cancel-and-rebook-lookup.fixtures.js';

describe('e2e-bug.89 cancel_and_rebook must not invent serviceName "next available"', () => {
  it('extractServiceNameFromPrompt rejects next-available book phrases', () => {
    expect(
      extractServiceNameFromPrompt(
        'cancel my facemassage appointment and book the next available slot instead',
      ),
    ).toBeNull();
    expect(
      extractServiceNameFromPrompt('book the next available slot'),
    ).toBeNull();
    expect(isAvailabilityFillerServiceName('next available')).toBe(true);
    expect(isAvailabilityFillerServiceName('facemassage')).toBe(false);
  });

  it.each(E2E89_CANCEL_AND_REBOOK_PROMPTS)(
    '$id: compound cancel step keeps real serviceName (not availability filler)',
    ({ prompt, expectedCancelServiceName }) => {
      const steps = decomposeCancelAndRebookCompoundPrompt(prompt);
      expect(steps).toHaveLength(2);
      expect(steps[0].action).toBe('cancel_my_booking');
      const serviceName = steps[0].params.serviceName as string | undefined;
      expect(isAvailabilityFillerServiceName(serviceName)).toBe(false);
      if (expectedCancelServiceName) {
        expect(serviceName?.toLowerCase()).toBe(
          expectedCancelServiceName.toLowerCase(),
        );
      } else {
        expect(serviceName).toBeUndefined();
      }
      expect(steps[1].params.bookingFirstAvailable).toBe(true);
    },
  );

  it('buildCancelAndRebookCompoundParams prefers facemassage over next available', () => {
    const params = buildCancelAndRebookCompoundParams(
      'cancel my facemassage appointment and book the next available slot instead',
    );
    expect(params.serviceName).toBe('facemassage');
    expect(params.bookingFirstAvailable).toBe(true);
  });

  it('enrichCancelMyBookingParamsFromPrompt scrubs inherited next available', () => {
    const enriched = enrichCancelMyBookingParamsFromPrompt(
      { serviceName: 'next available', bookingFirstAvailable: true },
      'cancel my facemassage appointment and book the next available slot instead',
    );
    expect(enriched.serviceName).toBe('facemassage');
  });

  it('matchCustomerOwnedBooking finds facemassage after compound param build', () => {
    const prompt =
      'cancel my facemassage appointment and book the next available slot instead';
    const cancelParams = decomposeCancelAndRebookCompoundPrompt(prompt)[0]
      .params as Record<string, unknown>;
    const enriched = enrichCancelMyBookingParamsFromPrompt(cancelParams, prompt);
    const matched = matchCustomerOwnedBooking(
      [
        {
          id: 'b1',
          status: BookingStatus.CONFIRMED,
          startTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
          service: { name: 'facemassage' },
        },
        {
          id: 'b2',
          status: BookingStatus.CONFIRMED,
          startTime: new Date(Date.now() + 48 * 60 * 60 * 1000),
          service: { name: 'facemassage' },
        },
      ],
      enriched,
      prompt,
      'UTC',
      { allowFirstWhenUnspecified: false },
    );
    expect(matched.booking).toBeNull();
    expect(matched.ambiguous).toHaveLength(2);
    expect(matched.ambiguous.map((b) => b.id).sort()).toEqual(['b1', 'b2']);
  });
});
