import { AiIntentRescueService } from './ai-intent-rescue.service.js';
import { validateCommand } from './command-completion.validator.js';
import {
  EXPLAIN_PROVIDER_AVAILABILITY_PROMPTS,
  EXPLAIN_PROVIDER_AVAILABILITY_RESCUE_SCENARIOS,
} from './ai-explain-provider-availability.fixtures.js';
import { EXPLAIN_PROVIDER_AVAILABILITY_MULTILINGUAL_SCENARIOS } from './ai-explain-provider-availability-multilingual.fixtures.js';
import { wrapCheckAvailabilityAsExplainProviderAvailability } from './ai-explain-provider-availability.logic.js';
import { rescueExplainProviderAvailabilityIntent } from './ai-explain-provider-availability.util.js';
import { makeResolvedCommand } from './command-completion.test-fixture.js';

describe('ai explain provider availability integration (ai-cmd-customer-4.11.3)', () => {
  let rescue: AiIntentRescueService;

  beforeEach(() => {
    rescue = new AiIntentRescueService();
  });

  it.each([
    ...EXPLAIN_PROVIDER_AVAILABILITY_PROMPTS,
    ...EXPLAIN_PROVIDER_AVAILABILITY_MULTILINGUAL_SCENARIOS,
  ])(
    'rescues explain provider availability $id',
    ({ prompt, aspect, employeeName }) => {
      const rescued = rescue.rescue({
        prompt,
        action: 'unknown',
        params: {},
      });
      expect(rescued?.action).toBe('explain_provider_availability');

      const directRescue = rescueExplainProviderAvailabilityIntent(
        prompt,
        'unknown',
      );
      expect(directRescue?.action).toBe('explain_provider_availability');

      const validation = validateCommand(makeResolvedCommand({
        action: 'explain_provider_availability',
        params: { aspect },
        enrichedParams: {},
        entities: { employees: [], services: [] },
        reasoning: 'test',
        prompt,
      }));
      expect(validation.issues).toEqual([]);

      const wrapped = wrapCheckAvailabilityAsExplainProviderAvailability(
        {
          success: true,
          action: 'check_availability',
          summary: 'ok',
          details: {},
        },
        aspect,
      );
      expect(wrapped.action).toBe('explain_provider_availability');
    },
  );

  it.each(EXPLAIN_PROVIDER_AVAILABILITY_RESCUE_SCENARIOS)(
    'rescues misclassified $misclassifiedAction for $id via direct rescue',
    ({ prompt, misclassifiedAction }) => {
      expect(
        rescueExplainProviderAvailabilityIntent(prompt, misclassifiedAction)
          ?.action,
      ).toBe('explain_provider_availability');
    },
  );
});
