import { CHECK_AND_BOOK_CORE_PROMPTS } from './ai-check-and-book.fixtures.js';
import {
  buildSharedBookingContextFromPrompt,
  mergeSharedBookingContext,
  mergeSharedBookingStepParams,
  pickSharedBookingContextSlice,
  propagateSharedBookingContextAcrossSteps,
} from './ai-compound-booking-context.util.js';
import { decomposePaymentsCompoundPrompt } from './ai-payments.util.js';

describe('ai-compound-booking-context.util (ai-cmd-h2)', () => {
  it('builds shared booking context with service, time window, and allProviders', () => {
    const prompt =
      'check who is free tomorrow evening for permanent lashes, book the nearest slot';
    const shared = buildSharedBookingContextFromPrompt(prompt);
    expect(shared.serviceName).toBe('permanent lashes');
    expect(shared.timeOfDay).toBe('evening');
    expect(shared.notBeforeTime).toBe('17:00');
    expect(shared.allProviders).toBe(true);
    expect(shared.date).toBeTruthy();
  });

  it('merges without blanking inherited segment values', () => {
    expect(
      mergeSharedBookingContext(
        { serviceName: 'massage', timeOfDay: 'evening' },
        { bookingFirstAvailable: true },
      ),
    ).toEqual({
      serviceName: 'massage',
      timeOfDay: 'evening',
      bookingFirstAvailable: true,
    });
    expect(
      mergeSharedBookingContext(
        { serviceName: 'massage' },
        { serviceName: '', timeOfDay: 'morning' },
      ),
    ).toEqual({
      serviceName: 'massage',
      timeOfDay: 'morning',
    });
  });

  it('propagates booking context to every compound step', () => {
    const prompt = CHECK_AND_BOOK_CORE_PROMPTS[0].prompt;
    const steps = propagateSharedBookingContextAcrossSteps(
      decomposePaymentsCompoundPrompt(prompt),
    );
    expect(steps).toHaveLength(2);
    for (const step of steps) {
      expect(step.params.serviceName).toBe('permanent lashes');
      expect(step.params.timeOfDay).toBe('evening');
      expect(step.params.notBeforeTime).toBe('17:00');
      expect(step.params.allProviders).toBe(true);
    }
    expect(steps[1]?.params.bookingFirstAvailable).toBe(true);
  });

  it('propagates shared context into a bare book segment after check segment', () => {
    const steps = propagateSharedBookingContextAcrossSteps([
      {
        action: 'check_providers_for_service',
        params: buildSharedBookingContextFromPrompt(
          'check who is free tomorrow evening for massage',
        ),
      },
      {
        action: 'book_nearest_slot',
        params: { bookingFirstAvailable: true },
      },
    ]);
    expect(steps[1]?.params).toMatchObject({
      serviceName: 'massage',
      timeOfDay: 'evening',
      notBeforeTime: '17:00',
      allProviders: true,
      bookingFirstAvailable: true,
    });
  });

  it('keeps booking context on third step after check+book+apply gift card', () => {
    const prompt =
      'Check who is free tomorrow evening for massage and book the nearest slot and apply my gift card GCM-ABCD1234';
    const steps = decomposePaymentsCompoundPrompt(prompt);
    expect(steps).toHaveLength(3);
    expect(steps[2]?.params.serviceName).toBe('massage');
    expect(steps[2]?.params.timeOfDay).toBe('evening');
    expect(steps[2]?.params.allProviders).toBe(true);
    expect(steps[2]?.params.giftCardCode).toBe('GCM-ABCD1234');
  });

  it('picks and merges runtime step params from compound context', () => {
    const slice = pickSharedBookingContextSlice({
      serviceName: 'Massage',
      timeOfDay: 'evening',
      employeeName: 'Maria',
    });
    expect(slice).toEqual({
      serviceName: 'Massage',
      timeOfDay: 'evening',
    });
    expect(
      mergeSharedBookingStepParams(
        { serviceName: 'massage', allProviders: true },
        { bookingFirstAvailable: true },
      ),
    ).toMatchObject({
      serviceName: 'massage',
      allProviders: true,
      bookingFirstAvailable: true,
    });
  });
});
