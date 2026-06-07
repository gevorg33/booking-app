import {
  handleAdminDeleteCustomerDataLogic,
  handleConfigureGranularConsentLogic,
  handleConfigurePrivacyRetentionLogic,
  handleEnableHipaaModeLogic,
  handleExplainComplianceStatusLogic,
  handleExplainGdprChecklistLogic,
  handleListSubProcessorsLogic,
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

  const deps = () => ({
    businessRepo,
    customerRepo,
    customerPrivacyService,
    complianceBreachService: {
      reportBreach: jest.fn(),
      listIncidents: jest.fn(),
    },
    phiAccessAuditService: { listForOwner: jest.fn() },
    businessService,
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
});
