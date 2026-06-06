import { AiIntentRescueService } from './ai-intent-rescue.service.js';
import { validateCommand } from './command-completion.validator.js';
import {
  handleAuditDashboardDateSurfacesLogic,
  handleConfigureBusinessDateFormatLogic,
  handleExplainBusinessDateFormatLogic,
  handleExplainDateInputFormatLogic,
  handleExplainNotificationDateFormatLogic,
  handleMigrateDashboardDateDisplayLogic,
  handlePreviewBusinessDateFormatLogic,
  handlePreviewDateInputParseLogic,
  handleNotifyPatientResultReadyLogic,
  handlePreviewNotificationDatetimeLogic,
} from './ai-business-date-format.logic.js';
import {
  EXPLAIN_DATE_INPUT_FORMAT_PROMPTS,
  PREVIEW_DATE_INPUT_PARSE_PROMPTS,
} from './ai-date-input-format.fixtures.js';
import {
  CONFIGURE_BUSINESS_DATE_FORMAT_PROMPTS,
  EXPLAIN_BUSINESS_DATE_FORMAT_PROMPTS,
} from './ai-business-date-format.fixtures.js';
import {
  EXPLAIN_NOTIFICATION_DATE_FORMAT_PROMPTS,
  NOTIFY_PATIENT_RESULT_READY_PROMPTS,
  PREVIEW_NOTIFICATION_DATETIME_PROMPTS,
} from './ai-notification-date-format.fixtures.js';
import {
  AUDIT_DASHBOARD_DATE_SURFACES_PROMPTS,
  MIGRATE_DASHBOARD_DATE_DISPLAY_PROMPTS,
  PREVIEW_BUSINESS_DATE_FORMAT_PROMPTS,
} from './ai-dashboard-date-surface-audit.fixtures.js';
import {
  AI_COMMAND_EVAL_AUDIT_DASHBOARD_DATE_SURFACES_CASES,
  AI_COMMAND_EVAL_BUSINESS_DATE_FORMAT_CASES,
  AI_COMMAND_EVAL_EXPLAIN_DATE_INPUT_FORMAT_CASES,
  AI_COMMAND_EVAL_EXPLAIN_NOTIFICATION_DATE_FORMAT_CASES,
  AI_COMMAND_EVAL_MIGRATE_DASHBOARD_DATE_DISPLAY_CASES,
  AI_COMMAND_EVAL_PREVIEW_DATE_INPUT_PARSE_CASES,
  AI_COMMAND_EVAL_NOTIFICATION_DATE_FORMAT_MULTILINGUAL_CASES,
  AI_COMMAND_EVAL_NOTIFY_PATIENT_RESULT_READY_CASES,
  AI_COMMAND_EVAL_PREVIEW_AUDIT_BUSINESS_DATE_FORMAT_MULTILINGUAL_CASES,
  AI_COMMAND_EVAL_PREVIEW_BUSINESS_DATE_FORMAT_CASES,
  AI_COMMAND_EVAL_PREVIEW_NOTIFICATION_DATETIME_CASES,
} from './eval/ai-command-eval.cases.js';
import { evaluateDeterministicEvalCase } from './eval/ai-command-eval.runner.js';
import type { Business } from '../business/entities/business.entity.js';

describe('ai business date format integration (ai-cmd-fmt-1..2)', () => {
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

  it.each(CONFIGURE_BUSINESS_DATE_FORMAT_PROMPTS)(
    'rescues and validates configure $id',
    async ({ prompt, dateFormat, timeFormat }) => {
      const rescued = rescue.rescue({ prompt, action: 'unknown', params: {} });
      expect(rescued?.action).toBe('configure_business_date_format');

      const params: Record<string, unknown> = {};
      if (dateFormat) params.dateFormat = dateFormat;
      if (timeFormat) params.timeFormat = timeFormat;

      const validation = validateCommand({
        action: 'configure_business_date_format',
        params,
        enrichedParams: {},
        entities: {},
        reasoning: 'test',
        confidence: 0.9,
        prompt,
      });
      expect(validation.ok).toBe(true);

      const result = await handleConfigureBusinessDateFormatLogic(
        deps(),
        'biz-1',
        params,
        prompt,
      );
      expect(result.success).toBe(true);
    },
  );

  it.each(EXPLAIN_BUSINESS_DATE_FORMAT_PROMPTS)(
    'rescues and executes explain $id',
    async ({ prompt }) => {
      const rescued = rescue.rescue({ prompt, action: 'unknown', params: {} });
      expect(rescued?.action).toBe('explain_business_date_format');

      const result = await handleExplainBusinessDateFormatLogic(deps(), 'biz-1');
      expect(result.success).toBe(true);
      expect(result.summary).toContain('date format');
    },
  );

  it.each(PREVIEW_BUSINESS_DATE_FORMAT_PROMPTS)(
    'rescues and executes preview $id (ai-cmd-fmt-5)',
    async ({ prompt, dateFormat, timeFormat }) => {
      const rescued = rescue.rescue({ prompt, action: 'unknown', params: {} });
      expect(rescued?.action).toBe('preview_business_date_format');

      const params: Record<string, unknown> = {};
      if (dateFormat) params.dateFormat = dateFormat;
      if (timeFormat) params.timeFormat = timeFormat;

      const result = await handlePreviewBusinessDateFormatLogic(
        deps(),
        'biz-1',
        params,
        prompt,
      );
      expect(result.success).toBe(true);
      expect(result.summary).toContain('Current settings');
    },
  );

  it.each(AUDIT_DASHBOARD_DATE_SURFACES_PROMPTS)(
    'rescues and executes audit $id (ai-cmd-fmt-6)',
    async ({ prompt }) => {
      const rescued = rescue.rescue({ prompt, action: 'unknown', params: {} });
      expect(rescued?.action).toBe('audit_dashboard_date_surfaces');

      const result = await handleAuditDashboardDateSurfacesLogic(deps(), 'biz-1');
      expect(result.success).toBe(true);
      expect(result.summary).toContain('fmt-1.6');
    },
  );

  it.each(EXPLAIN_NOTIFICATION_DATE_FORMAT_PROMPTS)(
    'rescues and executes explain notification date format $id (ai-cmd-fmt-9)',
    async ({ prompt }) => {
      const rescued = rescue.rescue({ prompt, action: 'unknown', params: {} });
      expect(rescued?.action).toBe('explain_notification_date_format');

      const result = await handleExplainNotificationDateFormatLogic(
        deps(),
        'biz-1',
      );
      expect(result.success).toBe(true);
      expect(result.summary).toContain('notification');
    },
  );

  it.each(PREVIEW_NOTIFICATION_DATETIME_PROMPTS)(
    'rescues and executes preview notification datetime $id (ai-cmd-fmt-10)',
    async ({ prompt, messageKind }) => {
      const rescued = rescue.rescue({ prompt, action: 'unknown', params: {} });
      expect(rescued?.action).toBe('preview_notification_datetime');
      expect(rescued?.params?.messageKind).toBe(messageKind);

      const result = await handlePreviewNotificationDatetimeLogic(
        deps(),
        'biz-1',
        { messageKind },
        prompt,
      );
      expect(result.success).toBe(true);
      expect(result.details?.messageKind).toBe(messageKind);
    },
  );

  it.each(EXPLAIN_DATE_INPUT_FORMAT_PROMPTS)(
    'rescues and executes explain date input format $id (ai-cmd-fmt-13)',
    async ({ prompt }) => {
      const rescued = rescue.rescue({ prompt, action: 'unknown', params: {} });
      expect(rescued?.action).toBe('explain_date_input_format');

      const result = await handleExplainDateInputFormatLogic(deps(), 'biz-1');
      expect(result.success).toBe(true);
      expect(result.summary).toContain('parseBusinessDateInput');
    },
  );

  it.each(PREVIEW_DATE_INPUT_PARSE_PROMPTS)(
    'rescues and executes preview date input parse $id (ai-cmd-fmt-14)',
    async ({ prompt, dateStrings }) => {
      const rescued = rescue.rescue({ prompt, action: 'unknown', params: {} });
      expect(rescued?.action).toBe('preview_date_input_parse');
      expect(rescued?.params?.dateStrings).toEqual(dateStrings);

      const result = await handlePreviewDateInputParseLogic(
        deps(),
        'biz-1',
        { dateStrings },
        prompt,
      );
      expect(result.success).toBe(true);
      expect(result.details?.parseResults).toHaveLength(dateStrings.length);
    },
  );

  it.each(MIGRATE_DASHBOARD_DATE_DISPLAY_PROMPTS)(
    'rescues and executes migrate $id (ai-cmd-fmt-7)',
    async ({ prompt, surfaceId }) => {
      const rescued = rescue.rescue({ prompt, action: 'unknown', params: {} });
      expect(rescued?.action).toBe('migrate_dashboard_date_display');
      if (surfaceId) {
        expect(rescued?.params?.surfaceId).toBe(surfaceId);
      }

      const result = await handleMigrateDashboardDateDisplayLogic(
        deps(),
        'biz-1',
        surfaceId ? { surfaceId } : {},
        prompt,
        true,
      );
      expect(result.success).toBe(true);
      expect(result.summary).toContain('formatDateDisplay');
    },
  );

  it('passes deterministic eval golden cases', () => {
    for (const evalCase of [
      ...AI_COMMAND_EVAL_BUSINESS_DATE_FORMAT_CASES,
      ...AI_COMMAND_EVAL_PREVIEW_BUSINESS_DATE_FORMAT_CASES,
      ...AI_COMMAND_EVAL_AUDIT_DASHBOARD_DATE_SURFACES_CASES,
      ...AI_COMMAND_EVAL_PREVIEW_AUDIT_BUSINESS_DATE_FORMAT_MULTILINGUAL_CASES,
      ...AI_COMMAND_EVAL_MIGRATE_DASHBOARD_DATE_DISPLAY_CASES,
      ...AI_COMMAND_EVAL_EXPLAIN_NOTIFICATION_DATE_FORMAT_CASES,
      ...AI_COMMAND_EVAL_PREVIEW_NOTIFICATION_DATETIME_CASES,
      ...AI_COMMAND_EVAL_NOTIFY_PATIENT_RESULT_READY_CASES,
      ...AI_COMMAND_EVAL_NOTIFICATION_DATE_FORMAT_MULTILINGUAL_CASES,
      ...AI_COMMAND_EVAL_EXPLAIN_DATE_INPUT_FORMAT_CASES,
      ...AI_COMMAND_EVAL_PREVIEW_DATE_INPUT_PARSE_CASES,
    ]) {
      expect(evaluateDeterministicEvalCase(evalCase).passed).toBe(true);
    }
  });
});
