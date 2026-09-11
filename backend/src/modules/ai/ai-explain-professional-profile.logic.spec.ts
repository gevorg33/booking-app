import { buildExplainProfessionalProfileSummary } from './ai-explain-professional-profile.logic.js';
import { makeEmployee } from '../employee/entities/employee.test-fixture.js';
import { makeService } from '../service/entities/service.test-fixture.js';
import type { PublicProviderReviewSummary } from '../reviews/reviews.service.js';
import { handleExplainProfessionalProfileLogic } from './ai-explain-professional-profile.logic.js';

describe('ai-explain-professional-profile.logic (ai-cmd-customer-4.11.5)', () => {
  const employeeRepo = {
    find: jest.fn(async () => [
      makeEmployee({
        id: 'emp-anna',
        name: 'Anna',
        businessId: 'biz-1',
        serviceIds: ['svc-color'],
        metadata: { role: 'Colorist', specialty: 'Balayage' },
      }),
    ]),
  };
  const serviceRepo = {
    find: jest.fn(async () => [
      makeService({ id: 'svc-color', name: 'Color', businessId: 'biz-1' }),
    ]),
  };
  const reviewsService = {
    getPublicReviewsByEmployees: jest.fn(
      async (): Promise<Map<string, PublicProviderReviewSummary>> => new Map(),
    ),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('fails when prompt is not recognized', async () => {
    const result = await handleExplainProfessionalProfileLogic(
      { employeeRepo, serviceRepo, reviewsService },
      'biz-1',
      {},
      'Who is best for curly hair?',
    );
    expect(result.success).toBe(false);
    expect(result.details?.clarify).toBe(true);
  });

  it('fails when named provider is unknown', async () => {
    const result = await handleExplainProfessionalProfileLogic(
      { employeeRepo, serviceRepo, reviewsService },
      'biz-1',
      {},
      "Open Zoe's profile",
    );
    expect(result.summary).toContain("couldn't find");
  });

  it('fails when named provider is missing from params', async () => {
    const result = await handleExplainProfessionalProfileLogic(
      { employeeRepo, serviceRepo, reviewsService },
      'biz-1',
      {},
      'Book with Anna for color',
    );
    expect(result.details?.missing).toContain('aspect');
  });

  it('builds named provider summary with services', () => {
    expect(
      buildExplainProfessionalProfileSummary({
        aspect: 'named_provider_profile',
        provider: {
          employeeId: 'emp-anna',
          name: 'Anna',
          role: 'Colorist',
          specialty: 'Balayage',
          bio: null,
          serviceNames: ['Color'],
          averageRating: 4.9,
          reviewCount: 5,
        },
      }),
    ).toContain('Color');
  });
});
