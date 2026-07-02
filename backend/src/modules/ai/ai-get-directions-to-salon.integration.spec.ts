import { validateCommand } from './command-completion.validator.js';
import { handleGetDirectionsToSalonLogic } from './ai-get-directions-to-salon.logic.js';
import {
  GET_DIRECTIONS_TO_SALON_PROMPTS,
  GET_DIRECTIONS_TO_SALON_RESCUE_SCENARIOS,
} from './ai-get-directions-to-salon.fixtures.js';
import { rescueGetDirectionsToSalonIntent } from './ai-get-directions-to-salon.util.js';

describe('ai get directions to salon integration (ai-cmd-customer-4.3.3)', () => {
  const businessRepo = {
    findOne: jest.fn(async () => ({
      id: 'biz-1',
      name: 'Glow Salon',
      address: '12 Main St, Yerevan',
      settings: {
        location: {
          mapEmbedHtml:
            '<iframe src="https://www.google.com/maps/embed?pb=abc"></iframe>',
          parkingCopy: 'Street parking on Main St.',
        },
      },
    })),
  };
  const deps = { businessRepo } as any;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it.each(GET_DIRECTIONS_TO_SALON_PROMPTS)(
    'validates and executes $id',
    async ({ prompt, aspect }) => {
      const validation = validateCommand({
        action: 'get_directions_to_salon',
        params: { aspect },
        enrichedParams: {},
        entities: {},
        reasoning: 'test',
        confidence: 0.9,
        prompt,
      });
      expect(validation.issues).toEqual([]);

      const result = await handleGetDirectionsToSalonLogic(
        deps,
        'biz-1',
        { aspect },
        prompt,
      );
      expect(result.success).toBe(true);
      expect(result.action).toBe('get_directions_to_salon');
      expect(result.details.directionsUrl).toContain('google.com/maps/dir');
    },
  );

  it.each(GET_DIRECTIONS_TO_SALON_RESCUE_SCENARIOS)(
    'rescues $id',
    ({ prompt, misclassifiedAction, expectedAction }) => {
      expect(
        rescueGetDirectionsToSalonIntent(prompt, misclassifiedAction),
      ).toEqual({
        action: expectedAction,
        rescueReason: 'salon_directions',
      });
    },
  );
});
