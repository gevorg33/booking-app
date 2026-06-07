import {
  handleApplyClinicPlaybookLogic,
  handleConfigureClinicServiceLogic,
  handleExplainClinicServicesLogic,
} from './ai-clinic-service.logic.js';

describe('ai-clinic-service.logic (ai-cmd-clinic-1–3)', () => {
  const services = [
    {
      id: 'svc-cbc',
      name: 'CBC',
      metadata: { serviceType: 'lab_test', requiresFasting: true },
      category: { name: 'Laboratory' },
    },
    {
      id: 'svc-lipid',
      name: 'Lipid Panel',
      metadata: { serviceType: 'lab_test' },
      category: { name: 'Laboratory' },
    },
    {
      id: 'svc-gp',
      name: 'GP Consultation',
      metadata: { serviceType: 'consultation' },
      category: { name: 'General Practice' },
    },
    {
      id: 'svc-ecg',
      name: 'ECG',
      metadata: { serviceType: 'procedure' },
      category: { name: 'Cardiology' },
    },
    {
      id: 'svc-massage',
      name: 'Relaxation Massage',
      metadata: {},
      category: { name: 'Spa' },
    },
  ];

  const serviceService = {
    findAll: jest.fn(async () => [...services]),
    update: jest.fn(async (id: string, dto: Record<string, unknown>) => {
      const base = services.find((item) => item.id === id)!;
      const metadata = { ...(base.metadata ?? {}), ...dto };
      if (dto.requiresFasting === false) delete metadata.requiresFasting;
      return { ...base, metadata };
    }),
  };

  const businessRepo = {
    findOne: jest.fn(async () => ({
      id: 'biz-clinic',
      settings: { businessType: 'polyclinic' },
    })),
  };

  const onboardingService = {
    applyVerticalPlaybook: jest.fn(async () => ({
      playbookId: 'clinic',
      categoriesCreated: 4,
      servicesCreated: 12,
      slotsCreated: 50,
      templatesApplied: ['Clinic operating hours'],
      employeeName: 'Dr. Smith',
      status: 'configured',
    })),
  };

  const deps = () => ({ serviceService });
  const playbookDeps = () => ({ businessRepo, onboardingService });

  beforeEach(() => {
    jest.clearAllMocks();
    serviceService.findAll.mockResolvedValue([...services]);
  });

  it('configures clinic service metadata', async () => {
    const result = await handleConfigureClinicServiceLogic(
      deps(),
      'biz-clinic',
      {},
      'Mark Lipid Panel as a lab test requiring fasting',
    );
    expect(result.success).toBe(true);
    expect(result.action).toBe('configure_clinic_service');
    expect(serviceService.update).toHaveBeenCalledWith(
      'svc-lipid',
      expect.objectContaining({
        serviceType: 'lab_test',
        requiresFasting: true,
      }),
    );
  });

  it('returns clarify when configure prompt is incomplete', async () => {
    const result = await handleConfigureClinicServiceLogic(
      deps(),
      'biz-clinic',
      {},
      'hello',
    );
    expect(result.success).toBe(false);
    expect(result.details?.clarify).toBe(true);
  });

  it('explains clinic catalog stats', async () => {
    const result = await handleExplainClinicServicesLogic(
      deps(),
      'biz-clinic',
      {},
      'Explain our clinic services and department counts',
    );
    expect(result.success).toBe(true);
    expect(result.action).toBe('explain_clinic_services');
    expect(result.summary).toContain('consultation');
    expect(result.summary).toContain('lab test');
    expect(result.details?.stats).toMatchObject({
      consultation: 1,
      labTest: 2,
      procedure: 1,
    });
  });

  it('filters explain to one service', async () => {
    const result = await handleExplainClinicServicesLogic(
      deps(),
      'biz-clinic',
      {},
      'Explain clinic settings for CBC',
    );
    expect(result.success).toBe(true);
    expect(result.summary).toContain('CBC');
    expect(result.summary).toContain('fasting');
  });

  it('applies clinic playbook for polyclinic tenant', async () => {
    const result = await handleApplyClinicPlaybookLogic(
      playbookDeps(),
      'biz-clinic',
      'user-1',
      {},
      'Apply clinic playbook',
    );
    expect(result.success).toBe(true);
    expect(result.action).toBe('apply_clinic_playbook');
    expect(onboardingService.applyVerticalPlaybook).toHaveBeenCalledWith(
      'biz-clinic',
      'user-1',
    );
  });

  it('rejects clinic playbook for non-clinic business type', async () => {
    businessRepo.findOne.mockResolvedValueOnce({
      id: 'biz-salon',
      settings: { businessType: 'hair_salon' },
    });
    const result = await handleApplyClinicPlaybookLogic(
      playbookDeps(),
      'biz-salon',
      'user-1',
      {},
      'Apply clinic playbook',
    );
    expect(result.success).toBe(false);
    expect(result.summary).toContain('hair_salon');
  });
});
