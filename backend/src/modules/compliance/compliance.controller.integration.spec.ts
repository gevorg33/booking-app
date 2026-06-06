import { ComplianceController } from './compliance.controller.js';
import { ComplianceBreachService } from './compliance-breach.service.js';
import { PhiAccessAuditService } from './phi-access-audit.service.js';
import { BusinessService } from '../business/business.service.js';

describe('ComplianceController integration', () => {
  const breachService = {
    reportBreach: jest.fn(),
    listIncidents: jest.fn(),
  } as unknown as ComplianceBreachService;
  const phiAccessAudit = {
    listForOwner: jest.fn(),
    purgeExpired: jest.fn(),
  } as unknown as PhiAccessAuditService;
  const businessService = {
    ensureOwner: jest.fn(),
    ensureMember: jest.fn(),
    findOne: jest.fn(),
  } as unknown as BusinessService;

  const controller = new ComplianceController(
    breachService,
    phiAccessAudit,
    businessService,
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns compliance status when business settings are empty', async () => {
    businessService.ensureMember = jest.fn();
    businessService.findOne = jest.fn().mockResolvedValue({ settings: {} });

    const result = await controller.getComplianceStatus('biz-1', {
      id: 'user-1',
    });

    expect(result.hipaa.enabled).toBe(false);
    expect(result.gdpr).toBeDefined();
  });

  it('returns compliance status when business has no settings object', async () => {
    businessService.ensureMember = jest.fn();
    businessService.findOne = jest.fn().mockResolvedValue({});

    const result = await controller.getComplianceStatus('biz-1', {
      id: 'user-1',
    });

    expect(result.hipaa.enabled).toBe(false);
    expect(result.hipaa.sessionTimeoutEnforced).toBe(false);
  });

  it('returns compliance status summary for business members', async () => {
    businessService.ensureMember = jest.fn();
    businessService.findOne = jest.fn().mockResolvedValue({
      settings: {
        businessType: 'clinic',
        hipaa: { enabled: true, baaAcceptedAt: '2026-01-01' },
        privacy: { cookieBanner: { enabled: true } },
      },
    });

    const result = await controller.getComplianceStatus('biz-1', {
      id: 'user-1',
    });

    expect(businessService.ensureMember).toHaveBeenCalledWith(
      'biz-1',
      'user-1',
    );
    expect(result.hipaa.enabled).toBe(true);
    expect(result.hipaa.minimumAccessEnforced).toBe(true);
  });

  it('delegates breach reporting to the breach service', async () => {
    breachService.reportBreach = jest.fn().mockResolvedValue({ id: 'inc-1' });

    const result = await controller.reportBreach(
      'biz-1',
      { description: 'Lost backup tape with customer emails' },
      { id: 'owner-1' },
    );

    expect(breachService.reportBreach).toHaveBeenCalledWith(
      'biz-1',
      'owner-1',
      { description: 'Lost backup tape with customer emails' },
    );
    expect(result).toEqual({ id: 'inc-1' });
  });

  it('lists breach incidents for owner', async () => {
    breachService.listIncidents = jest
      .fn()
      .mockResolvedValue([{ id: 'inc-1', gdprDeadlineOverdue: false }]);

    const result = await controller.listBreaches('biz-1', { id: 'owner-1' });

    expect(breachService.listIncidents).toHaveBeenCalledWith(
      'biz-1',
      'owner-1',
    );
    expect(result).toHaveLength(1);
  });

  it('lists PHI audit log without pagination when query params omitted', async () => {
    phiAccessAudit.listForOwner = jest
      .fn()
      .mockResolvedValue({ items: [], total: 0 });

    await controller.listPhiAccessAudit('biz-1', { id: 'owner-1' });

    expect(phiAccessAudit.listForOwner).toHaveBeenCalledWith('biz-1', {
      limit: undefined,
      offset: undefined,
    });
  });

  it('lists PHI audit log for owner with pagination params', async () => {
    phiAccessAudit.listForOwner = jest
      .fn()
      .mockResolvedValue({ items: [{ id: 'log-1' }], total: 1 });

    const result = await controller.listPhiAccessAudit(
      'biz-1',
      { id: 'owner-1' },
      '25',
      '5',
    );

    expect(businessService.ensureOwner).toHaveBeenCalledWith(
      'biz-1',
      'owner-1',
    );
    expect(phiAccessAudit.listForOwner).toHaveBeenCalledWith('biz-1', {
      limit: 25,
      offset: 5,
    });
    expect(result.total).toBe(1);
  });

  it('purges expired PHI audit rows for owner', async () => {
    phiAccessAudit.purgeExpired = jest.fn().mockResolvedValue(4);

    const result = await controller.purgeExpiredPhiAudit('biz-1', {
      id: 'owner-1',
    });

    expect(businessService.ensureOwner).toHaveBeenCalledWith(
      'biz-1',
      'owner-1',
    );
    expect(phiAccessAudit.purgeExpired).toHaveBeenCalledWith('biz-1');
    expect(result).toEqual({ purged: 4 });
  });
});
