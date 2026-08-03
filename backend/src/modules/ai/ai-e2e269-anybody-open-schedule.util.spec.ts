import {
  E2E269_ANYBODY_OPEN_NEGATIVES,
  E2E269_ANYBODY_OPEN_POSITIVES,
} from './ai-e2e269-anybody-open-schedule.fixtures.js';
import {
  decomposePaymentsCompoundPrompt,
  isBookNearestSlotPrompt,
  isCheckProvidersForServicePrompt,
  isPaymentsCompoundPrompt,
} from './ai-payments.util.js';
import { isFindSoonestAppointmentPrompt } from './ai-find-soonest-appointment.util.js';

describe('e2e-bug.269 anybody-open-schedule check+book detection', () => {
  it.each(E2E269_ANYBODY_OPEN_POSITIVES.map((row) => [row.id, row] as const))(
    'positive %s',
    (_id, row) => {
      expect(isCheckProvidersForServicePrompt(row.prompt)).toBe(
        row.expectCheckProviders,
      );
      expect(isBookNearestSlotPrompt(row.prompt)).toBe(row.expectBookNearest);
      expect(isPaymentsCompoundPrompt(row.prompt)).toBe(row.expectCompound);
      expect(isFindSoonestAppointmentPrompt(row.prompt)).toBe(false);

      if (row.expectCompound) {
        const steps = decomposePaymentsCompoundPrompt(row.prompt);
        expect(steps.map((s) => s.action)).toEqual([
          'check_providers_for_service',
          'book_nearest_slot',
        ]);
        if (row.serviceName) {
          expect(steps[0]?.params.serviceName).toBe(row.serviceName);
          expect(steps[1]?.params.serviceName).toBe(row.serviceName);
        }
        expect(steps[1]?.params.bookingFirstAvailable).toBe(true);
        if (row.timeOfDay) {
          expect(steps[0]?.params.timeOfDay).toBe(row.timeOfDay);
          expect(steps[1]?.params.timeOfDay).toBe(row.timeOfDay);
        }
      }
    },
  );

  it.each(E2E269_ANYBODY_OPEN_NEGATIVES.map((row) => [row.id, row] as const))(
    'negative %s',
    (_id, row) => {
      expect(isCheckProvidersForServicePrompt(row.prompt)).toBe(
        row.expectCheckProviders,
      );
      expect(isBookNearestSlotPrompt(row.prompt)).toBe(row.expectBookNearest);
      expect(isPaymentsCompoundPrompt(row.prompt)).toBe(row.expectCompound);
    },
  );

  it('named-provider exclusion does not catch indefinites (e2e-bug.92/269)', () => {
    const named =
      /\b(?:is|are)\s+(?!anybody\b|anyone\b|someone\b|everybody\b|everyone\b)[A-Za-z][\w\s.'-]{1,40}\s+(?:available|free|open)\b/i;
    expect(
      named.test('is anybody open tomorrow morning for massage'),
    ).toBe(false);
    expect(named.test('is Gevorg open tomorrow morning for massage')).toBe(
      true,
    );
  });
});
