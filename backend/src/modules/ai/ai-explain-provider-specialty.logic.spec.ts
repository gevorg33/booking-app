import {
  buildProviderSpecialtySummary,
  handleExplainProviderSpecialtyLogic,
} from './ai-explain-provider-specialty.logic.js';
import type { ProviderSpecialtyLogicDeps } from './ai-explain-provider-specialty.logic.js';

function buildDeps(
  overrides: Partial<ProviderSpecialtyLogicDeps> = {},
): ProviderSpecialtyLogicDeps {
  const employees = [
    {
      id: 'emp-anna',
      name: 'Anna Smith',
      businessId: 'biz-1',
      isActive: true,
      serviceIds: ['svc-cut', 'svc-color'],
      metadata: {
        role: 'Senior stylist',
        specialty: 'Curly hair, balayage, and color corrections',
        bio: 'Ten years focusing on textured hair.',
      },
    },
    {
      id: 'emp-maria',
      name: 'Maria Lopez',
      businessId: 'biz-1',
      isActive: true,
      serviceIds: ['svc-facial'],
      metadata: {
        role: 'Esthetician',
        specialty: 'Sensitive skin facials',
      },
    },
  ];
  const services = [
    {
      id: 'svc-cut',
      name: 'Haircut',
      businessId: 'biz-1',
      isActive: true,
    },
    {
      id: 'svc-color',
      name: 'Color',
      businessId: 'biz-1',
      isActive: true,
    },
    {
      id: 'svc-facial',
      name: 'Facial',
      businessId: 'biz-1',
      isActive: true,
    },
  ];

  return {
    employeeRepo: {
      find: jest.fn(async () => employees),
    } as unknown as ProviderSpecialtyLogicDeps['employeeRepo'],
    serviceRepo: {
      find: jest.fn(async () => services),
    } as unknown as ProviderSpecialtyLogicDeps['serviceRepo'],
    reviewsService: {
      getPublicReviewsByEmployees: jest.fn(async () =>
        new Map([
          [
            'emp-anna',
            { averageRating: 4.9, reviewCount: 42, recentReviews: [] },
          ],
          [
            'emp-maria',
            { averageRating: 4.7, reviewCount: 18, recentReviews: [] },
          ],
        ]),
      ),
    },
    ...overrides,
  };
}

describe('ai-explain-provider-specialty.logic (ai-cmd-customer-4.1.6)', () => {
  it('buildProviderSpecialtySummary covers named and topic matches', () => {
    expect(
      buildProviderSpecialtySummary({
        aspect: 'named_provider',
        namedProvider: {
          employeeId: 'emp-anna',
          name: 'Anna Smith',
          role: 'Senior stylist',
          specialty: 'Curly hair specialist',
          bio: null,
          serviceNames: ['Haircut', 'Color'],
          averageRating: 4.9,
          reviewCount: 42,
        },
      }),
    ).toContain('Anna Smith');
    expect(
      buildProviderSpecialtySummary({
        aspect: 'specialty_match',
        specialtyTopic: 'curly hair',
        matches: [
          {
            employeeId: 'emp-anna',
            name: 'Anna Smith',
            role: 'Senior stylist',
            specialty: 'Curly hair specialist',
            bio: null,
            serviceNames: ['Haircut'],
            averageRating: 4.9,
            reviewCount: 42,
          },
        ],
      }),
    ).toContain('curly hair');
  });

  it('explains a named provider profile', async () => {
    const result = await handleExplainProviderSpecialtyLogic(
      buildDeps(),
      'biz-1',
      {},
      'Tell me about Anna',
    );
    expect(result.success).toBe(true);
    expect(result.action).toBe('explain_provider_specialty');
    expect(result.summary).toContain('Anna Smith');
    expect(result.summary).toContain('Curly hair');
    expect((result.details as { navigate?: { path: string } }).navigate?.path).toBe(
      'professionals',
    );
  });

  it('matches providers for a specialty topic', async () => {
    const result = await handleExplainProviderSpecialtyLogic(
      buildDeps(),
      'biz-1',
      {},
      'Who is best for curly hair?',
    );
    expect(result.success).toBe(true);
    expect(result.summary).toContain('Anna Smith');
    expect(
      (result.details as { providers?: Array<{ employeeId: string }> })
        .providers?.[0]?.employeeId,
    ).toBe('emp-anna');
  });

  it('returns not found when provider name is missing from roster', async () => {
    const result = await handleExplainProviderSpecialtyLogic(
      buildDeps(),
      'biz-1',
      {},
      'Who is James?',
    );
    expect(result.success).toBe(false);
    expect(result.summary).toContain("couldn't find");
  });
});
