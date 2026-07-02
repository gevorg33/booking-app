import { EXPLAIN_PROFESSIONAL_PROFILE_MULTILINGUAL_SCENARIOS } from './ai-explain-professional-profile-multilingual.fixtures.js';
import {
  EXPLAIN_PROFESSIONAL_PROFILE_PROMPTS,
  EXPLAIN_PROFESSIONAL_PROFILE_RESCUE_SCENARIOS,
} from './ai-explain-professional-profile.fixtures.js';
import {
  detectExplainProfessionalProfileAction,
  enrichExplainProfessionalProfileParamsFromPrompt,
  extractProviderNameForProfilePrompt,
  hasBrowseProfessionalsCue,
  hasCurrentProviderProfileCue,
  isExplainProfessionalProfileIntent,
  isExplainProfessionalProfilePrompt,
  parseExplainProfessionalProfileFromPrompt,
  rescueExplainProfessionalProfileIntent,
} from './ai-explain-professional-profile.util.js';
import { handleExplainProfessionalProfileLogic } from './ai-explain-professional-profile.logic.js';
import { buildExplainProfessionalProfileSummary } from './ai-explain-professional-profile.logic.js';
import { isExplainProviderSpecialtyPrompt } from './ai-explain-provider-specialty.util.js';

describe('ai-explain-professional-profile.util (ai-cmd-customer-4.11.5)', () => {
  it.each(EXPLAIN_PROFESSIONAL_PROFILE_PROMPTS)(
    'detects professional profile prompt $id',
    (row) => {
      expect(isExplainProfessionalProfilePrompt(row.prompt)).toBe(true);
      expect(
        parseExplainProfessionalProfileFromPrompt(row.prompt)?.aspect,
      ).toBe(row.aspect);
    },
  );

  it.each(EXPLAIN_PROFESSIONAL_PROFILE_MULTILINGUAL_SCENARIOS)(
    'detects multilingual professional profile prompt $id',
    (row) => {
      expect(isExplainProfessionalProfilePrompt(row.prompt)).toBe(true);
    },
  );

  it.each(EXPLAIN_PROFESSIONAL_PROFILE_RESCUE_SCENARIOS)(
    'rescues misclassified $misclassifiedAction for $id',
    ({ prompt, misclassifiedAction }) => {
      expect(
        rescueExplainProfessionalProfileIntent(prompt, misclassifiedAction)
          ?.action,
      ).toBe('explain_professional_profile');
    },
  );

  it('extracts named provider for profile prompts', () => {
    expect(extractProviderNameForProfilePrompt("Show me Anna's services")).toBe(
      'Anna',
    );
    expect(
      parseExplainProfessionalProfileFromPrompt("Open Maria's profile"),
    ).toEqual({
      aspect: 'named_provider_profile',
      providerName: 'Maria',
    });
  });

  it('detects current provider and browse team cues', () => {
    expect(
      hasCurrentProviderProfileCue('What does this stylist specialize in?'),
    ).toBe(true);
    expect(hasBrowseProfessionalsCue('Browse stylists')).toBe(true);
  });

  it('does not steal specialty-match prompts', () => {
    expect(
      isExplainProfessionalProfilePrompt('Who is best for curly hair?'),
    ).toBe(false);
    expect(
      isExplainProviderSpecialtyPrompt('Who is best for curly hair?'),
    ).toBe(true);
    expect(isExplainProfessionalProfilePrompt('Tell me about Anna')).toBe(
      false,
    );
  });

  it('enriches params and intent helpers', () => {
    expect(
      enrichExplainProfessionalProfileParamsFromPrompt(
        {},
        "Show me Anna's services",
      ),
    ).toMatchObject({
      aspect: 'named_provider_profile',
      providerName: 'Anna',
    });
    expect(
      detectExplainProfessionalProfileAction("Show me Anna's services"),
    ).toBe('explain_professional_profile');
    expect(
      isExplainProfessionalProfileIntent('explain_professional_profile'),
    ).toBe(true);
    expect(
      rescueExplainProfessionalProfileIntent(
        "Show me Anna's services",
        'explain_professional_profile',
      ),
    ).toBeNull();
  });
});

describe('ai-explain-professional-profile.logic (ai-cmd-customer-4.11.5)', () => {
  const employeeRepo = {
    find: jest.fn(async () => [
      {
        id: 'emp-anna',
        name: 'Anna',
        businessId: 'biz-1',
        isActive: true,
        serviceIds: ['svc-color', 'svc-cut'],
        metadata: { role: 'Colorist', specialty: 'Balayage' },
      },
      {
        id: 'emp-maria',
        name: 'Maria',
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
    getPublicReviewsByEmployees: jest.fn(
      async () =>
        new Map([['emp-anna', { averageRating: 4.8, reviewCount: 12 }]]),
    ),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('opens named provider profile with services summary', async () => {
    const result = await handleExplainProfessionalProfileLogic(
      { employeeRepo, serviceRepo, reviewsService },
      'biz-1',
      {},
      "Show me Anna's services",
    );

    expect(result.success).toBe(true);
    expect(result.action).toBe('explain_professional_profile');
    expect(result.summary).toContain('Anna');
    expect(result.summary).toContain('Color');
    expect(result.details?.navigate).toEqual({
      path: 'provider_profile',
      query: { employeeId: 'emp-anna', employeeName: 'Anna' },
    });
  });

  it('opens current provider profile from session employeeId', async () => {
    const result = await handleExplainProfessionalProfileLogic(
      { employeeRepo, serviceRepo, reviewsService },
      'biz-1',
      { employeeId: 'emp-maria' },
      'What does this stylist specialize in?',
    );

    expect(result.success).toBe(true);
    expect(result.details?.navigate?.query.employeeId).toBe('emp-maria');
  });

  it('navigates to professionals list for browse prompts', async () => {
    const result = await handleExplainProfessionalProfileLogic(
      { employeeRepo, serviceRepo, reviewsService },
      'biz-1',
      {},
      'Browse stylists',
    );

    expect(result.success).toBe(true);
    expect(result.details?.navigate).toEqual({
      path: 'professionals',
      query: {},
    });
  });

  it('clarifies when current provider is missing', async () => {
    const result = await handleExplainProfessionalProfileLogic(
      { employeeRepo, serviceRepo, reviewsService },
      'biz-1',
      {},
      'What does this stylist specialize in?',
    );

    expect(result.success).toBe(false);
    expect(result.details?.missing).toContain('employeeId');
  });

  it('builds browse summary', () => {
    expect(
      buildExplainProfessionalProfileSummary({
        aspect: 'browse_professionals',
      }),
    ).toContain('team page');
  });
});
