import {
  MULTI_SERVICE_DAY_COMPOUND_PROMPTS,
  MULTI_SERVICE_DAY_CUSTOMER_PROMPTS,
  MULTI_SERVICE_DAY_NEGATIVE_PROMPTS,
  MULTI_SERVICE_DAY_RESCUE_SCENARIOS,
} from './ai-multi-service-day-compound.fixtures.js';
import { MULTI_SERVICE_DAY_MULTILINGUAL_SCENARIOS } from './ai-multi-service-day-compound-multilingual.fixtures.js';
import {
  buildMultiServiceDayCompoundParams,
  decomposeMultiServiceDayCompoundPrompt,
  hasMultiServiceDayPlanningCue,
  hasMultiServiceDayServicesCue,
  isMultiServiceDayCompoundPrompt,
  rescueMultiServiceDayCompoundIntent,
} from './ai-multi-service-day-compound.util.js';
import { isMultiServiceAvailabilityDiscoveryPrompt } from './ai-self-service-booking.util.js';

describe('ai-multi-service-day-compound.util (ai-cmd-customer-4.8.5)', () => {
  it.each(MULTI_SERVICE_DAY_CUSTOMER_PROMPTS)(
    'isMultiServiceDayCompoundPrompt customer $id',
    ({ prompt }) => {
      expect(isMultiServiceDayCompoundPrompt(prompt)).toBe(true);
    },
  );

  it.each(MULTI_SERVICE_DAY_COMPOUND_PROMPTS)(
    'decomposeMultiServiceDayCompoundPrompt $id',
    ({ prompt, orderedActions, expectedParams }) => {
      const steps = decomposeMultiServiceDayCompoundPrompt(prompt);
      expect(steps.map((step) => step.action)).toEqual([...orderedActions]);
      expect(steps).toHaveLength(3);
      if (expectedParams?.serviceNames) {
        expect(steps[0].params.serviceNames).toEqual(
          expect.arrayContaining(expectedParams.serviceNames as string[]),
        );
      }
      if (expectedParams?.timeOfDay) {
        expect(steps[1].params.timeOfDay).toBe(expectedParams.timeOfDay);
      }
    },
  );

  it.each(MULTI_SERVICE_DAY_MULTILINGUAL_SCENARIOS)(
    'decomposeMultiServiceDayCompoundPrompt multilingual $id',
    ({ prompt, orderedActions }) => {
      const steps = decomposeMultiServiceDayCompoundPrompt(prompt);
      expect(steps.map((step) => step.action)).toEqual([...orderedActions]);
    },
  );

  it.each(MULTI_SERVICE_DAY_RESCUE_SCENARIOS)(
    'rescueMultiServiceDayCompoundIntent $id',
    ({ prompt, misclassifiedAction }) => {
      expect(
        rescueMultiServiceDayCompoundIntent(prompt, misclassifiedAction!),
      ).toEqual({
        action: 'compound_intent',
        rescueReason: 'multi_service_day_compound',
      });
    },
  );

  it.each(MULTI_SERVICE_DAY_NEGATIVE_PROMPTS)(
    'does not match negative prompt $id',
    ({ prompt }) => {
      expect(isMultiServiceDayCompoundPrompt(prompt)).toBe(false);
      expect(decomposeMultiServiceDayCompoundPrompt(prompt)).toEqual([]);
    },
  );

  it('compound prompt also matches availability discovery (compound rescue runs first in pipeline)', () => {
    const prompt = 'Massage and facial same afternoon — find a time';
    expect(isMultiServiceDayCompoundPrompt(prompt)).toBe(true);
    expect(isMultiServiceAvailabilityDiscoveryPrompt(prompt)).toBe(true);
  });

  it('buildMultiServiceDayCompoundParams extracts service names', () => {
    const params = buildMultiServiceDayCompoundParams(
      'Massage and facial same afternoon — find a time',
    );
    expect(params.serviceNames).toEqual(
      expect.arrayContaining(['massage', 'facial']),
    );
  });

  it('rescueMultiServiceDayCompoundIntent returns null for non-compound', () => {
    expect(
      rescueMultiServiceDayCompoundIntent(
        'Book massage and facial together',
        'book_multi_service',
      ),
    ).toBeNull();
  });

  it('hasMultiServiceDayPlanningCue matches find-a-time phrasing', () => {
    expect(
      hasMultiServiceDayPlanningCue(
        'Massage and facial same afternoon — find a time',
      ),
    ).toBe(true);
  });

  it('hasMultiServiceDayServicesCue requires two services', () => {
    expect(
      hasMultiServiceDayServicesCue(
        'Massage and facial same afternoon — find a time',
      ),
    ).toBe(true);
    expect(hasMultiServiceDayServicesCue('Book massage')).toBe(false);
  });
});
