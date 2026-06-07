import { AiIntentRescueService } from './ai-intent-rescue.service.js';
import { validateCommand } from './command-completion.validator.js';
import {
  ADMIN_DELETE_CUSTOMER_DATA_PROMPTS,
  CONFIGURE_GRANULAR_CONSENT_PROMPTS,
  CONFIGURE_PRIVACY_RETENTION_PROMPTS,
  ACCEPT_HIPAA_BAA_PROMPTS,
  CONFIGURE_HIPAA_SESSION_TIMEOUT_PROMPTS,
  ENABLE_HIPAA_MODE_PROMPTS,
  EXPLAIN_COMPLIANCE_STATUS_PROMPTS,
  EXPLAIN_GDPR_CHECKLIST_PROMPTS,
  EXPLAIN_HIPAA_SESSION_TIMEOUT_PROMPTS,
  LIST_SUB_PROCESSORS_PROMPTS,
  EXPLAIN_MINIMUM_NECESSARY_PHI_ACCESS_PROMPTS,
  EXPLAIN_PHI_ENCRYPTION_STATUS_PROMPTS,
  LIST_BREACH_INCIDENTS_PROMPTS,
  REPORT_DATA_BREACH_PROMPTS,
  SEND_BREACH_NOTIFICATION_PROMPTS,
  OPEN_COMPLIANCE_DASHBOARD_PROMPTS,
  VIEW_PHI_ACCESS_AUDIT_PROMPTS,
} from './ai-business-compliance.fixtures.js';
import {
  handleAdminDeleteCustomerDataLogic,
  handleConfigureGranularConsentLogic,
  handleConfigurePrivacyRetentionLogic,
  handleAcceptHipaaBaaLogic,
  handleConfigureHipaaSessionTimeoutLogic,
  handleEnableHipaaModeLogic,
  handleExplainComplianceStatusLogic,
  handleExplainGdprChecklistLogic,
  handleExplainHipaaSessionTimeoutLogic,
  handleListSubProcessorsLogic,
  handleExplainMinimumNecessaryPhiAccessLogic,
  handleExplainPhiEncryptionStatusLogic,
  handleListBreachIncidentsLogic,
  handleReportDataBreachLogic,
  handleSendBreachNotificationLogic,
  handleOpenComplianceDashboardLogic,
  handleViewPhiAccessAuditLogic,
} from './ai-business-compliance.logic.js';
import {
  AI_COMMAND_EVAL_ADMIN_DELETE_CUSTOMER_DATA_CASES,
  AI_COMMAND_EVAL_BUSINESS_COMPLIANCE_MULTILINGUAL_CASES,
  AI_COMMAND_EVAL_EXPLAIN_DATA_RIGHTS_CASES,
  AI_COMMAND_EVAL_ACCEPT_HIPAA_BAA_CASES,
  AI_COMMAND_EVAL_CONFIGURE_HIPAA_SESSION_TIMEOUT_CASES,
  AI_COMMAND_EVAL_EXPLAIN_HIPAA_SESSION_TIMEOUT_CASES,
  AI_COMMAND_EVAL_PHI_GUARD_CASES,
  AI_COMMAND_EVAL_EXPLAIN_MINIMUM_NECESSARY_PHI_ACCESS_CASES,
  AI_COMMAND_EVAL_EXPLAIN_PHI_ENCRYPTION_STATUS_CASES,
  AI_COMMAND_EVAL_LIST_BREACH_INCIDENTS_CASES,
  AI_COMMAND_EVAL_REPORT_DATA_BREACH_CASES,
  AI_COMMAND_EVAL_SEND_BREACH_NOTIFICATION_CASES,
  AI_COMMAND_EVAL_OPEN_COMPLIANCE_DASHBOARD_CASES,
  AI_COMMAND_EVAL_VIEW_PHI_ACCESS_AUDIT_CASES,
  AI_COMMAND_EVAL_CONFIGURE_GRANULAR_CONSENT_CASES,
  AI_COMMAND_EVAL_CONFIGURE_PRIVACY_RETENTION_CASES,
  AI_COMMAND_EVAL_ENABLE_HIPAA_MODE_CASES,
  AI_COMMAND_EVAL_EXPLAIN_COMPLIANCE_STATUS_CASES,
  AI_COMMAND_EVAL_EXPLAIN_GDPR_CHECKLIST_CASES,
  AI_COMMAND_EVAL_LIST_SUB_PROCESSORS_CASES,
} from './eval/ai-command-eval.cases.js';
import { evaluateDeterministicEvalCase } from './eval/ai-command-eval.runner.js';
import type { Business } from '../business/entities/business.entity.js';

describe('ai business compliance integration (ai-cmd-compliance-1..6)', () => {
  const business: Business = {
    id: 'biz-1',
    name: 'Salon',
    slug: 'salon',
    timezone: 'UTC',
    settings: {},
  } as Business;

  const customers = [
    {
      id: 'cust-anna',
      name: 'Anna',
      businessId: 'biz-1',
      isActive: true,
    },
    {
      id: 'cust-anna-smith',
      name: 'Anna Smith',
      businessId: 'biz-1',
      isActive: true,
    },
    {
      id: 'cust-bob',
      name: 'Bob',
      businessId: 'biz-1',
      isActive: true,
    },
    {
      id: 'cust-maria',
      name: 'Maria',
      businessId: 'biz-1',
      isActive: true,
    },
  ];

  const businessRepo = {
    findOne: jest.fn(async () => ({ ...business })),
    save: jest.fn(async (b: Business) => b),
  };

  const customerRepo = {
    find: jest.fn(async () => customers),
  };

  const customerPrivacyService = {
    deleteCustomerData: jest.fn(async () => ({ deleted: true })),
  };

  const complianceBreachService = {
    reportBreach: jest.fn(async () => ({
      id: 'inc-1',
      affectedCustomerCount: 0,
      gdprNotificationDeadlineAt: new Date('2026-06-09T12:00:00.000Z'),
      draftEmailSubject: 'Security notice',
      status: 'open',
    })),
    listIncidents: jest.fn(async () => []),
    sendBreachNotification: jest.fn(async () => ({
      ok: true as const,
      incident: {
        id: 'a1b2c3d4-0000-4000-8000-000000000001',
        status: 'notified',
        draftEmailSubject: 'Security notice',
      },
      emailsSent: 2,
      emailsFailed: 0,
      recipientsSkipped: 0,
      resent: false,
    })),
  };

  const phiAccessAuditService = {
    listForOwner: jest.fn(async () => ({ items: [], total: 0 })),
  };

  const businessService = {
    ensureOwner: jest.fn(async () => undefined),
  };

  const deps = () => ({
    businessRepo,
    customerRepo,
    customerPrivacyService,
    complianceBreachService,
    phiAccessAuditService,
    businessService,
  });

  let rescue: AiIntentRescueService;

  beforeEach(() => {
    jest.clearAllMocks();
    business.settings = {};
    businessRepo.findOne.mockResolvedValue({ ...business });
    rescue = new AiIntentRescueService();
  });

  it.each(CONFIGURE_PRIVACY_RETENTION_PROMPTS)(
    'rescues configure_privacy_retention for $id',
    async ({ prompt, customerPiiDays, cookieBannerEnabled }) => {
      const rescued = rescue.rescue({ prompt, action: 'unknown', params: {} });
      expect(rescued?.action).toBe('configure_privacy_retention');

      const params: Record<string, unknown> = {};
      if (customerPiiDays != null) params.customerPiiDays = customerPiiDays;
      if (cookieBannerEnabled != null) {
        params.cookieBannerEnabled = cookieBannerEnabled;
      }

      const validation = validateCommand({
        action: 'configure_privacy_retention',
        params,
        enrichedParams: {},
        entities: {},
        reasoning: 'test',
        confidence: 0.9,
        prompt,
      });
      expect(validation.issues).toEqual([]);

      const result = await handleConfigurePrivacyRetentionLogic(
        deps(),
        'biz-1',
        params,
        prompt,
      );
      expect(result.success).toBe(true);
    },
  );

  it.each(CONFIGURE_GRANULAR_CONSENT_PROMPTS)(
    'rescues configure_granular_consent for $id',
    async ({ prompt, requireAiProcessing, requireThirdPartyIntegrations }) => {
      const rescued = rescue.rescue({ prompt, action: 'unknown', params: {} });
      expect(rescued?.action).toBe('configure_granular_consent');

      const params: Record<string, unknown> = {};
      if (requireAiProcessing != null) {
        params.requireAiProcessing = requireAiProcessing;
      }
      if (requireThirdPartyIntegrations != null) {
        params.requireThirdPartyIntegrations = requireThirdPartyIntegrations;
      }

      const validation = validateCommand({
        action: 'configure_granular_consent',
        params,
        enrichedParams: {},
        entities: {},
        reasoning: 'test',
        confidence: 0.9,
        prompt,
      });
      expect(validation.issues).toEqual([]);

      const result = await handleConfigureGranularConsentLogic(
        deps(),
        'biz-1',
        params,
        prompt,
      );
      expect(result.success).toBe(true);
    },
  );

  it.each(ENABLE_HIPAA_MODE_PROMPTS)(
    'rescues enable_hipaa_mode for $id',
    async ({ prompt, enabled, sessionTimeoutMinutes }) => {
      business.settings = {
        businessType: 'clinic',
        ...(enabled
          ? { hipaa: { baaAcceptedAt: '2026-01-01T00:00:00.000Z' } }
          : {}),
      };
      businessRepo.findOne.mockResolvedValue({ ...business });

      const rescued = rescue.rescue({ prompt, action: 'unknown', params: {} });
      expect(rescued?.action).toBe('enable_hipaa_mode');

      const params: Record<string, unknown> = {};
      if (enabled != null) params.enabled = enabled;
      if (sessionTimeoutMinutes != null) {
        params.sessionTimeoutMinutes = sessionTimeoutMinutes;
      }

      const validation = validateCommand({
        action: 'enable_hipaa_mode',
        params,
        enrichedParams: {},
        entities: {},
        reasoning: 'test',
        confidence: 0.9,
        prompt,
      });
      expect(validation.issues).toEqual([]);

      const result = await handleEnableHipaaModeLogic(
        deps(),
        'biz-1',
        params,
        prompt,
      );
      if (enabled === true) {
        expect(result.success).toBe(true);
      } else {
        expect(result.success).toBe(true);
      }
    },
  );

  it.each(EXPLAIN_COMPLIANCE_STATUS_PROMPTS)(
    'rescues explain_compliance_status for $id',
    async ({ prompt, aspect }) => {
      const rescued = rescue.rescue({ prompt, action: 'unknown', params: {} });
      expect(rescued?.action).toBe('explain_compliance_status');

      const validation = validateCommand({
        action: 'explain_compliance_status',
        params: { aspect },
        enrichedParams: {},
        entities: {},
        reasoning: 'test',
        confidence: 0.9,
        prompt,
      });
      expect(validation.issues).toEqual([]);

      const result = await handleExplainComplianceStatusLogic(
        deps(),
        'biz-1',
        { aspect },
        prompt,
      );
      expect(result.success).toBe(true);
    },
  );

  it.each(LIST_SUB_PROCESSORS_PROMPTS)(
    'rescues list_sub_processors for $id',
    async ({ prompt, article28 }) => {
      businessService.ensureOwner.mockResolvedValue(undefined);

      const rescued = rescue.rescue({ prompt, action: 'unknown', params: {} });
      expect(rescued?.action).toBe('list_sub_processors');

      const params: Record<string, unknown> = {};
      if (article28 != null) params.article28 = article28;

      const validation = validateCommand({
        action: 'list_sub_processors',
        params,
        enrichedParams: {},
        entities: {},
        reasoning: 'test',
        confidence: 0.9,
        prompt,
      });
      expect(validation.issues).toEqual([]);

      const result = await handleListSubProcessorsLogic(
        deps(),
        'biz-1',
        'owner-1',
        params,
        prompt,
      );
      expect(result.success).toBe(true);
    },
  );

  it.each(EXPLAIN_GDPR_CHECKLIST_PROMPTS)(
    'rescues explain_gdpr_checklist for $id',
    async ({ prompt, aspect }) => {
      businessService.ensureOwner.mockResolvedValue(undefined);

      const rescued = rescue.rescue({ prompt, action: 'unknown', params: {} });
      expect(rescued?.action).toBe('explain_gdpr_checklist');

      const validation = validateCommand({
        action: 'explain_gdpr_checklist',
        params: { aspect },
        enrichedParams: {},
        entities: {},
        reasoning: 'test',
        confidence: 0.9,
        prompt,
      });
      expect(validation.issues).toEqual([]);

      const result = await handleExplainGdprChecklistLogic(
        deps(),
        'biz-1',
        'owner-1',
        { aspect },
        prompt,
      );
      expect(result.success).toBe(true);
    },
  );

  it.each(
    ADMIN_DELETE_CUSTOMER_DATA_PROMPTS.filter(
      (entry) => 'customerName' in entry && entry.customerName != null,
    ),
  )(
    'rescues admin_delete_customer_data for $id',
    async ({ prompt, customerName }) => {
      const rescued = rescue.rescue({ prompt, action: 'unknown', params: {} });
      expect(rescued?.action).toBe('admin_delete_customer_data');

      const params = { customerName };
      const validation = validateCommand({
        action: 'admin_delete_customer_data',
        params,
        enrichedParams: {},
        entities: {},
        reasoning: 'test',
        confidence: 0.9,
        prompt,
      });
      expect(validation.issues).toEqual([]);

      const result = await handleAdminDeleteCustomerDataLogic(
        deps(),
        'biz-1',
        params,
        prompt,
      );
      expect(result.success).toBe(true);
    },
  );

  it.each(EXPLAIN_PHI_ENCRYPTION_STATUS_PROMPTS)(
    'rescues explain_phi_encryption_status for $id',
    async ({ prompt, fieldName }) => {
      business.settings = {
        businessType: 'clinic',
        hipaa: {
          enabled: true,
          phiEncryptionKeyId: 'key-1',
          phiEncryptionKeyEnc: 'enc-1',
        },
      };
      businessRepo.findOne.mockResolvedValue({ ...business });

      const rescued = rescue.rescue({ prompt, action: 'unknown', params: {} });
      expect(rescued?.action).toBe('explain_phi_encryption_status');

      const validation = validateCommand({
        action: 'explain_phi_encryption_status',
        params: {},
        enrichedParams: {},
        entities: {},
        reasoning: 'test',
        confidence: 0.9,
        prompt,
      });
      expect(validation.issues).toEqual([]);

      const params: Record<string, unknown> = {};
      if (fieldName != null) params.fieldName = fieldName;

      const result = await handleExplainPhiEncryptionStatusLogic(
        deps(),
        'biz-1',
        params,
        prompt,
      );
      expect(result.success).toBe(true);
    },
  );

  it('rejects explain_phi_encryption_status for non-clinic businesses', async () => {
    business.settings = { businessType: 'salon' };
    businessRepo.findOne.mockResolvedValue({ ...business });

    const result = await handleExplainPhiEncryptionStatusLogic(
      deps(),
      'biz-1',
      {},
      'Is HIPAA encryption on?',
    );
    expect(result.success).toBe(false);
    expect(result.details?.clinicOnly).toBe(true);
  });

  it.each(EXPLAIN_MINIMUM_NECESSARY_PHI_ACCESS_PROMPTS)(
    'rescues explain_minimum_necessary_phi_access for $id',
    async ({ prompt, aspect }) => {
      const rescued = rescue.rescue({ prompt, action: 'unknown', params: {} });
      expect(rescued?.action).toBe('explain_minimum_necessary_phi_access');

      const validation = validateCommand({
        action: 'explain_minimum_necessary_phi_access',
        params: { aspect },
        enrichedParams: {},
        entities: {},
        reasoning: 'test',
        confidence: 0.9,
        prompt,
      });
      expect(validation.issues).toEqual([]);

      const result = await handleExplainMinimumNecessaryPhiAccessLogic(
        deps(),
        'biz-1',
        { aspect },
        prompt,
      );
      expect(result.success).toBe(true);
    },
  );

  it.each(EXPLAIN_HIPAA_SESSION_TIMEOUT_PROMPTS)(
    'rescues explain_hipaa_session_timeout for $id',
    async ({ prompt, personalLogout }) => {
      business.settings = {
        businessType: 'clinic',
        hipaa: { enabled: true, sessionTimeoutMinutes: 15 },
      };
      businessRepo.findOne.mockResolvedValue({ ...business });

      const rescued = rescue.rescue({ prompt, action: 'unknown', params: {} });
      expect(rescued?.action).toBe('explain_hipaa_session_timeout');

      const validation = validateCommand({
        action: 'explain_hipaa_session_timeout',
        params: { personalLogout },
        enrichedParams: {},
        entities: {},
        reasoning: 'test',
        confidence: 0.9,
        prompt,
      });
      expect(validation.issues).toEqual([]);

      const result = await handleExplainHipaaSessionTimeoutLogic(
        deps(),
        'biz-1',
        { personalLogout },
        prompt,
      );
      expect(result.success).toBe(true);
    },
  );

  it('rejects explain_hipaa_session_timeout for non-clinic businesses', async () => {
    business.settings = { businessType: 'salon' };
    businessRepo.findOne.mockResolvedValue({ ...business });

    const result = await handleExplainHipaaSessionTimeoutLogic(
      deps(),
      'biz-1',
      {},
      'What is our HIPAA session timeout?',
    );
    expect(result.success).toBe(false);
    expect(result.details?.clinicOnly).toBe(true);
  });

  it.each(ACCEPT_HIPAA_BAA_PROMPTS)(
    'rescues accept_hipaa_baa for $id',
    async ({ prompt, enableHipaa }) => {
      business.settings = { businessType: 'clinic' };
      businessRepo.findOne.mockResolvedValue({ ...business });
      businessService.ensureOwner.mockResolvedValue(undefined);

      const rescued = rescue.rescue({ prompt, action: 'unknown', params: {} });
      expect(rescued?.action).toBe('accept_hipaa_baa');

      const params: Record<string, unknown> = {};
      if (enableHipaa != null) params.enableHipaa = enableHipaa;

      const validation = validateCommand({
        action: 'accept_hipaa_baa',
        params,
        enrichedParams: {},
        entities: {},
        reasoning: 'test',
        confidence: 0.9,
        prompt,
      });
      expect(validation.issues).toEqual([]);

      const result = await handleAcceptHipaaBaaLogic(
        deps(),
        'biz-1',
        'owner-1',
        params,
        prompt,
      );
      expect(result.success).toBe(true);
      expect(businessRepo.save).toHaveBeenCalled();
    },
  );

  it.each(CONFIGURE_HIPAA_SESSION_TIMEOUT_PROMPTS)(
    'rescues configure_hipaa_session_timeout for $id',
    async ({ prompt, sessionTimeoutMinutes }) => {
      const previousTimeout =
        sessionTimeoutMinutes === 30 ? 15 : sessionTimeoutMinutes + 5;
      business.settings = {
        businessType: 'clinic',
        hipaa: { sessionTimeoutMinutes: previousTimeout },
      };
      businessRepo.findOne.mockResolvedValue({ ...business });

      const rescued = rescue.rescue({ prompt, action: 'unknown', params: {} });
      expect(rescued?.action).toBe('configure_hipaa_session_timeout');

      const validation = validateCommand({
        action: 'configure_hipaa_session_timeout',
        params: { sessionTimeoutMinutes },
        enrichedParams: {},
        entities: {},
        reasoning: 'test',
        confidence: 0.9,
        prompt,
      });
      expect(validation.issues).toEqual([]);

      const result = await handleConfigureHipaaSessionTimeoutLogic(
        deps(),
        'biz-1',
        { sessionTimeoutMinutes },
        prompt,
      );
      expect(result.success).toBe(true);
      expect(businessRepo.save).toHaveBeenCalled();
    },
  );

  it.each(OPEN_COMPLIANCE_DASHBOARD_PROMPTS)(
    'rescues open_compliance_dashboard for $id',
    async ({ prompt, panel }) => {
      const rescued = rescue.rescue({ prompt, action: 'unknown', params: {} });
      expect(rescued?.action).toBe('open_compliance_dashboard');

      const validation = validateCommand({
        action: 'open_compliance_dashboard',
        params: { panel },
        enrichedParams: {},
        entities: {},
        reasoning: 'test',
        confidence: 0.9,
        prompt,
      });
      expect(validation.issues).toEqual([]);

      const result = await handleOpenComplianceDashboardLogic(
        deps(),
        'biz-1',
        'owner-1',
        { panel },
        prompt,
      );
      expect(result.success).toBe(true);
      expect(result.details?.navigate).toEqual(
        expect.objectContaining({
          path: '/dashboard/settings',
          query: { panel: 'compliance', section: panel },
        }),
      );
      expect(businessService.ensureOwner).toHaveBeenCalledWith(
        'biz-1',
        'owner-1',
      );
    },
  );

  it.each(SEND_BREACH_NOTIFICATION_PROMPTS)(
    'rescues send_breach_notification for $id',
    async ({ prompt, incidentRef }) => {
      const rescued = rescue.rescue({ prompt, action: 'unknown', params: {} });
      expect(rescued?.action).toBe('send_breach_notification');

      const validation = validateCommand({
        action: 'send_breach_notification',
        params: { incidentRef },
        enrichedParams: {},
        entities: {},
        reasoning: 'test',
        confidence: 0.9,
        prompt,
      });
      expect(validation.issues).toEqual([]);

      const result = await handleSendBreachNotificationLogic(
        deps(),
        'biz-1',
        'owner-1',
        { incidentRef },
        prompt,
      );
      expect(result.success).toBe(true);
      expect(
        complianceBreachService.sendBreachNotification,
      ).toHaveBeenCalledWith('biz-1', 'owner-1', incidentRef);
    },
  );

  it.each(REPORT_DATA_BREACH_PROMPTS)(
    'rescues report_data_breach for $id',
    async ({ prompt, affectedCustomerCount }) => {
      const rescued = rescue.rescue({ prompt, action: 'unknown', params: {} });
      expect(rescued?.action).toBe('report_data_breach');

      const validation = validateCommand({
        action: 'report_data_breach',
        params: {},
        enrichedParams: {},
        entities: {},
        reasoning: 'test',
        confidence: 0.9,
        prompt,
      });
      expect(validation.issues).toEqual([]);

      const result = await handleReportDataBreachLogic(
        deps(),
        'biz-1',
        'owner-1',
        {},
        prompt,
      );
      expect(result.success).toBe(true);
      expect(complianceBreachService.reportBreach).toHaveBeenCalledWith(
        'biz-1',
        'owner-1',
        expect.objectContaining({
          description: expect.any(String),
          ...(affectedCustomerCount != null ? { affectedCustomerCount } : {}),
        }),
      );
    },
  );

  it('passes deterministic eval golden cases', () => {
    for (const evalCase of [
      ...AI_COMMAND_EVAL_CONFIGURE_PRIVACY_RETENTION_CASES,
      ...AI_COMMAND_EVAL_CONFIGURE_GRANULAR_CONSENT_CASES,
      ...AI_COMMAND_EVAL_ENABLE_HIPAA_MODE_CASES,
      ...AI_COMMAND_EVAL_EXPLAIN_COMPLIANCE_STATUS_CASES,
      ...AI_COMMAND_EVAL_LIST_SUB_PROCESSORS_CASES,
      ...AI_COMMAND_EVAL_EXPLAIN_GDPR_CHECKLIST_CASES,
      ...AI_COMMAND_EVAL_ADMIN_DELETE_CUSTOMER_DATA_CASES,
      ...AI_COMMAND_EVAL_EXPLAIN_DATA_RIGHTS_CASES,
      ...AI_COMMAND_EVAL_EXPLAIN_PHI_ENCRYPTION_STATUS_CASES,
      ...AI_COMMAND_EVAL_EXPLAIN_MINIMUM_NECESSARY_PHI_ACCESS_CASES,
      ...AI_COMMAND_EVAL_EXPLAIN_HIPAA_SESSION_TIMEOUT_CASES,
      ...AI_COMMAND_EVAL_CONFIGURE_HIPAA_SESSION_TIMEOUT_CASES,
      ...AI_COMMAND_EVAL_ACCEPT_HIPAA_BAA_CASES,
      ...AI_COMMAND_EVAL_PHI_GUARD_CASES,
      ...AI_COMMAND_EVAL_LIST_BREACH_INCIDENTS_CASES,
      ...AI_COMMAND_EVAL_REPORT_DATA_BREACH_CASES,
      ...AI_COMMAND_EVAL_SEND_BREACH_NOTIFICATION_CASES,
      ...AI_COMMAND_EVAL_OPEN_COMPLIANCE_DASHBOARD_CASES,
      ...AI_COMMAND_EVAL_VIEW_PHI_ACCESS_AUDIT_CASES,
      ...AI_COMMAND_EVAL_BUSINESS_COMPLIANCE_MULTILINGUAL_CASES,
    ]) {
      expect(evaluateDeterministicEvalCase(evalCase).passed).toBe(true);
    }
  });
});
