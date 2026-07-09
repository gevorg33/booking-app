import {
  handleAdminDeleteCustomerDataLogic,
  handleConfigureGranularConsentLogic,
  handleConfigurePrivacyRetentionLogic,
  handleEnableHipaaModeLogic,
  handleExplainComplianceStatusLogic,
  handleExplainEnterpriseTrustLogic,
  handleExplainGdprChecklistLogic,
  handleExplainStrategyEvalLogic,
  handleListSubProcessorsLogic,
  handleUpdateStrategyEvalLogic,
  handleViewPhiAccessAuditLogic,
} from './ai-business-compliance.logic.js';
import type { Business } from '../business/entities/business.entity.js';

describe('ai-business-compliance.logic', () => {
  const business: Business = {
    id: 'biz-1',
    name: 'Salon',
    slug: 'salon',
    timezone: 'UTC',
    settings: {},
  } as Business;

  const anna = {
    id: 'cust-anna',
    name: 'Anna',
    businessId: 'biz-1',
    isActive: true,
  };

  const businessRepo = {
    findOne: jest.fn(async () => ({ ...business })),
    save: jest.fn(async (b: Business) => b),
  };

  const customerRepo = {
    find: jest.fn(async () => [anna]),
  };

  const customerPrivacyService = {
    deleteCustomerData: jest.fn(async () => ({ deleted: true })),
  };

  const businessService = {
    ensureOwner: jest.fn(async () => undefined),
  };

  const enterpriseTrustService = {
    getSettings: jest.fn(async () => ({
      legalBusinessName: 'Salon LLC',
      registeredAddress: null,
      country: 'US',
      dpoEmail: null,
      euRepresentative: null,
      privacyPolicyEffectiveDate: null,
      dpaEffectiveDate: null,
      customDataProcessingNotes: null,
    })),
    updateSettings: jest.fn(),
    renderDocuments: jest.fn(async () => [
      { id: 'dpa', title: 'Data Processing Agreement (DPA)', markdown: '...', placeholdersFilled: [] },
      { id: 'privacy_policy', title: 'Privacy Policy (EU template)', markdown: '...', placeholdersFilled: [] },
    ]),
    getSecurityOnePager: jest.fn(() => ({
      title: 'Security One-Pager',
      lastUpdated: '2026-01-01',
      summary: 'We take security seriously.',
      sections: [],
      contactEmail: 'security@example.com',
    })),
  };

  const strategyEvalService = {
    getSummary: jest.fn(async () => ({
      hipaa: {
        answers: {},
        handlesPhi: true,
        readinessPercent: 40,
        blockers: ['diagnosis_documentation'],
        recommendation: 'defer',
        recommendationKey: 'strategyEval.hipaa.defer',
        notes: null,
        decidedAt: null,
        updatedAt: '2026-01-01T00:00:00.000Z',
      },
      marketplace: null,
      medicalVerticalBlocked: true,
      marketplaceDecisionLocked: false,
    })),
    getHipaaFramework: jest.fn(),
    getMarketplaceFramework: jest.fn(),
    submitHipaaEval: jest.fn(async () => ({
      answers: { handles_phi: 'yes' },
      handlesPhi: true,
      readinessPercent: 40,
      blockers: [],
      recommendation: 'pursue_baa',
      recommendationKey: 'strategyEval.hipaa.pursue_baa',
      notes: null,
      decidedAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    })),
    submitMarketplaceEval: jest.fn(async () => ({
      criterionWeights: { tenant_autonomy: 4 },
      optionScores: {
        software_only: 10,
        partner_directory: 8,
        full_marketplace: 6,
      },
      recommendation: 'software_only',
      recommendationKey: 'strategyEval.marketplace.software_only',
      directoryOptIn: false,
      notes: null,
      decidedAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    })),
  };

  const deps = () => ({
    businessRepo,
    customerRepo,
    customerPrivacyService,
    complianceBreachService: {
      reportBreach: jest.fn(),
      listIncidents: jest.fn(),
      sendBreachNotification: jest.fn(),
    },
    phiAccessAuditService: { listForOwner: jest.fn() },
    businessService,
    enterpriseTrustService,
    strategyEvalService,
  });

  beforeEach(() => {
    jest.clearAllMocks();
    business.settings = {};
    businessRepo.findOne.mockResolvedValue({ ...business });
  });

  it('updates customer PII retention from years prompt', async () => {
    business.settings = {
      privacy: { retention: { customerPiiDays: 730 } },
    };
    businessRepo.findOne.mockResolvedValue({ ...business });

    const result = await handleConfigurePrivacyRetentionLogic(
      deps(),
      'biz-1',
      {},
      'Keep customer data for 3 years',
    );
    expect(result.success).toBe(true);
    expect(result.action).toBe('configure_privacy_retention');
    expect(result.summary).toContain('1095');
    expect(businessRepo.save).toHaveBeenCalled();
  });

  it('enables cookie banner on booking page', async () => {
    const result = await handleConfigurePrivacyRetentionLogic(
      deps(),
      'biz-1',
      {},
      'Enable cookie banner on our booking page',
    );
    expect(result.success).toBe(true);
    expect(result.details?.privacy).toEqual(
      expect.objectContaining({
        cookieBanner: expect.objectContaining({ enabled: true }),
      }),
    );
  });

  it('requires AI processing consent at checkout', async () => {
    const result = await handleConfigureGranularConsentLogic(
      deps(),
      'biz-1',
      {},
      'Require AI processing consent at checkout',
    );
    expect(result.success).toBe(true);
    expect(result.action).toBe('configure_granular_consent');
    expect(result.details?.granularConsent).toEqual(
      expect.objectContaining({ requireAiProcessing: true }),
    );
  });

  it('requires third-party integration consent', async () => {
    const result = await handleConfigureGranularConsentLogic(
      deps(),
      'biz-1',
      {},
      'Ask for third-party integration consent',
    );
    expect(result.success).toBe(true);
    expect(result.details?.granularConsent).toEqual(
      expect.objectContaining({ requireThirdPartyIntegrations: true }),
    );
  });

  it('returns clarify when privacy retention prompt is too vague', async () => {
    const result = await handleConfigurePrivacyRetentionLogic(
      deps(),
      'biz-1',
      {},
      'Update privacy settings',
    );
    expect(result.success).toBe(false);
    expect(result.details?.clarify).toBe(true);
  });

  it('enables HIPAA for clinic with BAA on file', async () => {
    business.settings = {
      businessType: 'clinic',
      hipaa: { baaAcceptedAt: '2026-01-01T00:00:00.000Z' },
    };
    businessRepo.findOne.mockResolvedValue({ ...business });

    const result = await handleEnableHipaaModeLogic(
      deps(),
      'biz-1',
      {},
      'Enable HIPAA safeguards',
    );
    expect(result.success).toBe(true);
    expect(result.action).toBe('enable_hipaa_mode');
    expect(result.details?.hipaa).toEqual(
      expect.objectContaining({ enabled: true }),
    );
    expect(businessRepo.save).toHaveBeenCalled();
  });

  it('sets HIPAA session timeout without enabling', async () => {
    business.settings = { businessType: 'clinic' };
    businessRepo.findOne.mockResolvedValue({ ...business });

    const result = await handleEnableHipaaModeLogic(
      deps(),
      'biz-1',
      {},
      'Set 15-minute session timeout for HIPAA',
    );
    expect(result.success).toBe(true);
    expect(result.details?.hipaa).toEqual(
      expect.objectContaining({ sessionTimeoutMinutes: 15, enabled: false }),
    );
  });

  it('clarifies when enabling HIPAA without BAA', async () => {
    business.settings = { businessType: 'clinic' };
    businessRepo.findOne.mockResolvedValue({ ...business });

    const result = await handleEnableHipaaModeLogic(
      deps(),
      'biz-1',
      {},
      'Enable HIPAA safeguards',
    );
    expect(result.success).toBe(false);
    expect(result.details?.clarify).toBe(true);
    expect(result.summary).toContain('Business Associate Agreement');
  });

  it('rejects HIPAA enablement for non-clinic businesses', async () => {
    business.settings = {
      businessType: 'hair_salon',
      hipaa: { baaAcceptedAt: '2026-01-01T00:00:00.000Z' },
    };
    businessRepo.findOne.mockResolvedValue({ ...business });

    const result = await handleEnableHipaaModeLogic(
      deps(),
      'biz-1',
      {},
      'Enable HIPAA safeguards',
    );
    expect(result.success).toBe(false);
    expect(result.summary).toContain('clinic');
  });

  it('explains GDPR compliance checklist', async () => {
    const result = await handleExplainGdprChecklistLogic(
      deps(),
      'biz-1',
      'owner-1',
      { aspect: 'checklist' },
      'Show our GDPR compliance checklist',
    );
    expect(result.success).toBe(true);
    expect(result.action).toBe('explain_gdpr_checklist');
    expect(result.summary).toContain('GDPR checklist');
    expect(result.details?.aspect).toBe('checklist');
  });

  it('explains sub-processors list', async () => {
    const result = await handleListSubProcessorsLogic(
      deps(),
      'biz-1',
      'owner-1',
      {},
      'List sub-processors we use',
    );
    expect(result.success).toBe(true);
    expect(result.action).toBe('list_sub_processors');
    expect(result.summary).toContain('sub-processors');
    expect(result.details?.processorCount).toBeGreaterThan(0);
  });

  it('anonymizes a named customer for GDPR erasure', async () => {
    const result = await handleAdminDeleteCustomerDataLogic(
      deps(),
      'biz-1',
      {},
      'Forget this customer Anna',
    );
    expect(result.success).toBe(true);
    expect(result.action).toBe('admin_delete_customer_data');
    expect(customerPrivacyService.deleteCustomerData).toHaveBeenCalledWith(
      'biz-1',
      'cust-anna',
    );
  });

  it('clarifies admin delete when customer name is missing', async () => {
    const result = await handleAdminDeleteCustomerDataLogic(
      deps(),
      'biz-1',
      {},
      'Forget this customer',
    );
    expect(result.success).toBe(false);
    expect(result.details?.clarify).toBe(true);
    expect(result.details?.missing).toContain('customerName');
  });

  it('filters PHI audit log entries for lab result comments', async () => {
    const createdAt = new Date('2026-06-01T12:00:00.000Z');
    const phiAccessAuditService = {
      listForOwner: jest.fn(async () => ({
        total: 2,
        items: [
          {
            id: 'log-1',
            businessId: 'biz-1',
            userId: 'user-manager',
            role: 'manager',
            action: 'read',
            resourceType: 'clinic_test_result',
            resourceId: 'result-1',
            fieldName: 'comment',
            createdAt,
          },
          {
            id: 'log-2',
            businessId: 'biz-1',
            userId: 'user-manager',
            role: 'manager',
            action: 'read',
            resourceType: 'booking',
            resourceId: 'booking-1',
            fieldName: 'notes',
            createdAt,
          },
        ],
      })),
    };

    const result = await handleViewPhiAccessAuditLogic(
      { ...deps(), phiAccessAuditService },
      'biz-1',
      'owner-1',
      {},
      'Who viewed lab result comments?',
    );

    expect(result.success).toBe(true);
    expect(result.summary).toContain('lab result comments');
    expect(result.summary).toContain('lab result/result-1');
    expect(result.details?.itemCount).toBe(1);
  });

  it('explains enterprise trust settings, documents, and security one-pager', async () => {
    const settingsResult = await handleExplainEnterpriseTrustLogic(
      deps(),
      'biz-1',
      'owner-1',
      {},
      'What is our enterprise trust status?',
    );
    expect(settingsResult.success).toBe(true);
    expect(settingsResult.details?.aspect).toBe('settings');

    const docsResult = await handleExplainEnterpriseTrustLogic(
      deps(),
      'biz-1',
      'owner-1',
      {},
      'Show our DPA',
    );
    expect(docsResult.success).toBe(true);
    expect(docsResult.details?.aspect).toBe('documents');
    expect((docsResult.details as any).documents).toHaveLength(2);

    const securityResult = await handleExplainEnterpriseTrustLogic(
      deps(),
      'biz-1',
      'owner-1',
      {},
      'Show our security one-pager',
    );
    expect(securityResult.success).toBe(true);
    expect(securityResult.details?.aspect).toBe('security');

    expect(
      (await handleExplainEnterpriseTrustLogic(deps(), 'biz-1', undefined, {}))
        .success,
    ).toBe(false);
    expect(
      (
        await handleExplainEnterpriseTrustLogic(
          deps(),
          'biz-1',
          'owner-1',
          {},
          'unrelated prompt',
        )
      ).success,
    ).toBe(false);
  });

  it('explains strategy eval status for hipaa, marketplace, and all', async () => {
    const hipaaResult = await handleExplainStrategyEvalLogic(
      deps(),
      'biz-1',
      'owner-1',
      {},
      'What is our HIPAA decision?',
    );
    expect(hipaaResult.success).toBe(true);
    expect(hipaaResult.summary).toContain('defer');

    const marketplaceResult = await handleExplainStrategyEvalLogic(
      deps(),
      'biz-1',
      'owner-1',
      {},
      'Show our marketplace positioning eval',
    );
    expect(marketplaceResult.success).toBe(true);
    expect(marketplaceResult.summary).toContain(
      'No marketplace positioning evaluation has been submitted',
    );

    const allResult = await handleExplainStrategyEvalLogic(
      deps(),
      'biz-1',
      'owner-1',
      {},
      'strategy eval summary',
    );
    expect(allResult.success).toBe(true);
    expect(allResult.details?.aspect).toBe('all');

    expect(
      (await handleExplainStrategyEvalLogic(deps(), 'biz-1', undefined, {}))
        .success,
    ).toBe(false);
  });

  it('submits hipaa and marketplace strategy evaluations', async () => {
    const hipaaResult = await handleUpdateStrategyEvalLogic(
      deps(),
      'biz-1',
      'owner-1',
      {
        evalType: 'hipaa',
        answers: { handles_phi: 'yes' },
        decision: 'pursue_baa',
      },
    );
    expect(hipaaResult.success).toBe(true);
    expect(strategyEvalService.submitHipaaEval).toHaveBeenCalledWith('biz-1', {
      answers: { handles_phi: 'yes' },
      notes: undefined,
      decision: 'pursue_baa',
    });

    const marketplaceResult = await handleUpdateStrategyEvalLogic(
      deps(),
      'biz-1',
      'owner-1',
      {
        evalType: 'marketplace',
        criterionWeights: { tenant_autonomy: 4 },
        decision: 'software_only',
      },
    );
    expect(marketplaceResult.success).toBe(true);
    expect(strategyEvalService.submitMarketplaceEval).toHaveBeenCalled();

    expect(
      (await handleUpdateStrategyEvalLogic(deps(), 'biz-1', undefined, {}))
        .success,
    ).toBe(false);
    expect(
      (await handleUpdateStrategyEvalLogic(deps(), 'biz-1', 'owner-1', {}))
        .success,
    ).toBe(false);
    expect(
      (
        await handleUpdateStrategyEvalLogic(deps(), 'biz-1', 'owner-1', {
          evalType: 'hipaa',
        })
      ).success,
    ).toBe(false);
    expect(
      (
        await handleUpdateStrategyEvalLogic(deps(), 'biz-1', 'owner-1', {
          evalType: 'marketplace',
        })
      ).success,
    ).toBe(false);
  });
});
