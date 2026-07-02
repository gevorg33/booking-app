import { validateCommand } from './command-completion.validator.js';
import { EXPLAIN_DATA_RIGHTS_PROMPTS } from './ai-data-rights.fixtures.js';
import { handleExplainDataRightsLogic } from './ai-business-compliance.logic.js';
import { rescueExplainDataRightsIntent } from './ai-data-rights.util.js';
import type { Business } from '../business/entities/business.entity.js';

describe('ai data rights integration (ai-cmd-compliance-7)', () => {
  const business: Business = {
    id: 'biz-1',
    name: 'Salon',
    slug: 'salon',
    timezone: 'UTC',
    settings: {
      privacy: {
        cookieBanner: {
          enabled: true,
          message: 'We use cookies to improve your experience.',
        },
        privacyPolicyVersion: '1.0',
      },
    },
  } as Business;

  const businessRepo = {
    findOne: jest.fn(async () => ({ ...business })),
    save: jest.fn(async (b: Business) => b),
  };

  const deps = () => ({
    businessRepo,
    customerRepo: { find: jest.fn() },
    customerPrivacyService: { deleteCustomerData: jest.fn() },
    complianceBreachService: {
      reportBreach: jest.fn(),
      listIncidents: jest.fn(async () => []),
    },
    phiAccessAuditService: {
      listForOwner: jest.fn(async () => ({ items: [], total: 0 })),
    },
    businessService: {
      ensureOwner: jest.fn(async () => undefined),
    },
  });

  beforeEach(() => {
    jest.clearAllMocks();
    businessRepo.findOne.mockResolvedValue({ ...business });
  });

  it.each(EXPLAIN_DATA_RIGHTS_PROMPTS)(
    'rescues and handles explain_data_rights for $id',
    async ({ prompt, aspect }) => {
      const rescued = rescueExplainDataRightsIntent(prompt, 'unknown');
      expect(rescued?.action).toBe('explain_data_rights');

      const validation = validateCommand({
        action: 'explain_data_rights',
        params: { aspect },
        enrichedParams: {},
        entities: {},
        reasoning: 'test',
        confidence: 0.9,
        prompt,
      });
      expect(validation.issues).toEqual([]);

      const result = await handleExplainDataRightsLogic(
        deps(),
        'biz-1',
        { aspect },
        prompt,
      );
      expect(result.success).toBe(true);
      expect(result.action).toBe('explain_data_rights');
      expect(result.summary.length).toBeGreaterThan(20);
      if (aspect === 'export' || aspect === 'delete' || aspect === 'all') {
        expect(result.details?.navigate).toMatchObject({
          path: 'account',
          query: expect.objectContaining({ section: 'privacy' }),
        });
      }
    },
  );
});
