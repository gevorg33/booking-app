import { AiIntentRescueService } from './ai-intent-rescue.service.js';
import { validateCommand } from './command-completion.validator.js';
import {
  EXPLAIN_PROFESSIONAL_PROFILE_PROMPTS,
  EXPLAIN_PROFESSIONAL_PROFILE_RESCUE_SCENARIOS,
} from './ai-explain-professional-profile.fixtures.js';
import { EXPLAIN_PROFESSIONAL_PROFILE_MULTILINGUAL_SCENARIOS } from './ai-explain-professional-profile-multilingual.fixtures.js';
import { handleExplainProfessionalProfileLogic } from './ai-explain-professional-profile.logic.js';
import { rescueExplainProfessionalProfileIntent } from './ai-explain-professional-profile.util.js';

describe('ai explain professional profile integration (ai-cmd-customer-4.11.5)', () => {
  const employeeRepo = {
    find: jest.fn(async () => [
      {
        id: 'emp-anna',
        name: 'Anna',
        businessId: 'biz-1',
        isActive: true,
        serviceIds: ['svc-color'],
        metadata: { specialty: 'Color' },
      },
      {
        id: 'emp-maria',
        name: 'Maria',
        businessId: 'biz-1',
        isActive: true,
        serviceIds: ['svc-cut'],
        metadata: {},
      },
      {
        id: 'emp-james',
        name: 'James',
        businessId: 'biz-1',
        isActive: true,
        serviceIds: ['svc-cut'],
        metadata: {},
      },
      {
        id: 'emp-sophie',
        name: 'Sophie',
        businessId: 'biz-1',
        isActive: true,
        serviceIds: ['svc-color'],
        metadata: {},
      },
      {
        id: 'emp-emma',
        name: 'Emma',
        businessId: 'biz-1',
        isActive: true,
        serviceIds: ['svc-cut'],
        metadata: {},
      },
      {
        id: 'emp-alex',
        name: 'Alex',
        businessId: 'biz-1',
        isActive: true,
        serviceIds: ['svc-cut'],
        metadata: {},
      },
    ]),
  };
  const serviceRepo = {
    find: jest.fn(async () => [
      { id: 'svc-color', name: 'Color', businessId: 'biz-1', isActive: true },
      { id: 'svc-cut', name: 'Haircut', businessId: 'biz-1', isActive: true },
    ]),
  };
  const reviewsService = {
    getPublicReviewsByEmployees: jest.fn(async () => new Map()),
  };

  let rescue: AiIntentRescueService;

  beforeEach(() => {
    jest.clearAllMocks();
    rescue = new AiIntentRescueService();
  });

  it.each([
    ...EXPLAIN_PROFESSIONAL_PROFILE_PROMPTS,
    ...EXPLAIN_PROFESSIONAL_PROFILE_MULTILINGUAL_SCENARIOS,
  ])('rescues and executes explain professional profile $id', async (row) => {
    const rescued = rescue.rescue({
      prompt: row.prompt,
      action: 'unknown',
      params: {},
    });
    expect(rescued?.action).toBe('explain_professional_profile');

    const directRescue = rescueExplainProfessionalProfileIntent(
      row.prompt,
      'unknown',
    );
    expect(directRescue?.action).toBe('explain_professional_profile');

    const validation = validateCommand({
      action: 'explain_professional_profile',
      params: {
        aspect: row.aspect,
        ...(row.providerName ? { providerName: row.providerName } : {}),
      },
      enrichedParams: {},
      entities: {},
      reasoning: 'test',
      confidence: 0.9,
      prompt: row.prompt,
    });
    expect(validation.issues).toEqual([]);

    const result = await handleExplainProfessionalProfileLogic(
      { employeeRepo, serviceRepo, reviewsService },
      'biz-1',
      row.aspect === 'current_provider_profile'
        ? { employeeId: 'emp-maria' }
        : {},
      row.prompt,
    );
    expect(result.action).toBe('explain_professional_profile');
    if (row.aspect === 'browse_professionals') {
      expect(result.details?.navigate).toEqual({
        path: 'professionals',
        query: {},
      });
    } else if (row.aspect === 'named_provider_profile') {
      expect(result.success).toBe(true);
      expect(result.details?.navigate?.path).toBe('provider_profile');
    }
  });

  it.each(EXPLAIN_PROFESSIONAL_PROFILE_RESCUE_SCENARIOS)(
    'rescues misclassified $misclassifiedAction for $id via direct rescue',
    ({ prompt, misclassifiedAction }) => {
      expect(
        rescueExplainProfessionalProfileIntent(prompt, misclassifiedAction)
          ?.action,
      ).toBe('explain_professional_profile');
    },
  );
});
