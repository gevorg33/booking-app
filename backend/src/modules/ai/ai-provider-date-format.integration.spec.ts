import { AiIntentRescueService } from './ai-intent-rescue.service.js';
import {
  handleConfigureProviderPushDateFormatLogic,
  handleExplainProviderDateDisplayLogic,
} from './ai-business-date-format.logic.js';
import {
  CONFIGURE_PROVIDER_PUSH_DATE_FORMAT_PROMPTS,
  EXPLAIN_PROVIDER_DATE_DISPLAY_PROMPTS,
} from './ai-provider-date-format.fixtures.js';
import {
  AI_COMMAND_EVAL_CONFIGURE_PROVIDER_PUSH_DATE_FORMAT_CASES,
  AI_COMMAND_EVAL_EXPLAIN_PROVIDER_DATE_DISPLAY_CASES,
} from './eval/ai-command-eval.cases.js';
import { evaluateDeterministicEvalCase } from './eval/ai-command-eval.runner.js';
import type { Business } from '../business/entities/business.entity.js';

describe('ai provider date format integration (ai-cmd-fmt-15..16)', () => {
  const business: Business = {
    id: 'biz-1',
    name: 'Salon',
    slug: 'salon',
    timezone: 'UTC',
    settings: { dateFormat: 'DD/MM/YYYY', timeFormat: '24h' },
  } as Business;

  const businessRepo = {
    findOne: jest.fn(async () => ({ ...business })),
    save: jest.fn(async (b: Business) => b),
  };

  const deps = () => ({ businessRepo });

  let rescue: AiIntentRescueService;

  beforeEach(() => {
    jest.clearAllMocks();
    business.settings = { dateFormat: 'DD/MM/YYYY', timeFormat: '24h' };
    businessRepo.findOne.mockResolvedValue({ ...business });
    rescue = new AiIntentRescueService();
  });

  it.each(EXPLAIN_PROVIDER_DATE_DISPLAY_PROMPTS)(
    'rescues and executes explain $id (ai-cmd-fmt-15)',
    async ({ prompt }) => {
      const rescued = rescue.rescue({ prompt, action: 'unknown', params: {} });
      expect(rescued?.action).toBe('explain_provider_date_display');

      const result = await handleExplainProviderDateDisplayLogic(
        deps(),
        'biz-1',
      );
      expect(result.success).toBe(true);
      expect(result.summary).toContain('fmt-1.8');
      expect(result.details?.usesAuthBusinessSettings).toBe(true);
    },
  );

  it.each(CONFIGURE_PROVIDER_PUSH_DATE_FORMAT_PROMPTS)(
    'rescues and executes configure $id preview (ai-cmd-fmt-16)',
    async ({ prompt, timeFormat }) => {
      const rescued = rescue.rescue({ prompt, action: 'unknown', params: {} });
      expect(rescued?.action).toBe('configure_provider_push_date_format');
      if (timeFormat) {
        expect(rescued?.params?.timeFormat).toBe(timeFormat);
      }

      const result = await handleConfigureProviderPushDateFormatLogic(
        deps(),
        'biz-1',
        timeFormat ? { timeFormat } : {},
        prompt,
        false,
      );
      expect(result.success).toBe(true);
      expect(result.details?.requiresExecutionConfirmation).toBe(true);
      expect(result.details?.fcmBodySample).toContain('Sam');
    },
  );

  it('passes deterministic eval golden cases', () => {
    for (const evalCase of [
      ...AI_COMMAND_EVAL_EXPLAIN_PROVIDER_DATE_DISPLAY_CASES,
      ...AI_COMMAND_EVAL_CONFIGURE_PROVIDER_PUSH_DATE_FORMAT_CASES,
    ]) {
      expect(evaluateDeterministicEvalCase(evalCase).passed).toBe(true);
    }
  });
});
