import { AiIntentRescueService } from './ai-intent-rescue.service.js';
import { handleExplainProviderSessionTimeoutLogic } from './ai-business-compliance.logic.js';
import { EXPLAIN_PROVIDER_SESSION_TIMEOUT_PROMPTS } from './ai-provider-session-timeout.fixtures.js';
import { AI_COMMAND_EVAL_EXPLAIN_PROVIDER_SESSION_TIMEOUT_CASES } from './eval/ai-command-eval.cases.js';
import { evaluateDeterministicEvalCase } from './eval/ai-command-eval.runner.js';
import type { Business } from '../business/entities/business.entity.js';

describe('ai provider session timeout integration (ai-cmd-compliance-20)', () => {
  const business: Business = {
    id: 'biz-1',
    name: 'Clinic',
    slug: 'clinic',
    timezone: 'UTC',
    settings: {
      businessType: 'clinic',
      hipaa: { enabled: true, sessionTimeoutMinutes: 15 },
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
      listIncidents: jest.fn(),
      sendBreachNotification: jest.fn(),
    },
    phiAccessAuditService: { listForOwner: jest.fn() },
    businessService: { ensureOwner: jest.fn() },
  });

  let rescue: AiIntentRescueService;

  beforeEach(() => {
    jest.clearAllMocks();
    businessRepo.findOne.mockResolvedValue({ ...business });
    rescue = new AiIntentRescueService();
  });

  it.each(EXPLAIN_PROVIDER_SESSION_TIMEOUT_PROMPTS)(
    'rescues and executes explain $id',
    async ({ prompt }) => {
      const rescued = rescue.rescue({ prompt, action: 'unknown', params: {} });
      expect(rescued?.action).toBe('explain_provider_session_timeout');

      const result = await handleExplainProviderSessionTimeoutLogic(
        deps(),
        'biz-1',
      );
      expect(result.success).toBe(true);
      expect(result.summary).toContain('provider mobile app');
      expect(result.details?.providerApp).toBe(true);
    },
  );

  it('passes deterministic eval golden cases', () => {
    for (const evalCase of AI_COMMAND_EVAL_EXPLAIN_PROVIDER_SESSION_TIMEOUT_CASES) {
      expect(evaluateDeterministicEvalCase(evalCase).passed).toBe(true);
    }
  });
});
