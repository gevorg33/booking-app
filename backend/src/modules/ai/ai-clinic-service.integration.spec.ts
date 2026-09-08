import { AiIntentRescueService } from './ai-intent-rescue.service.js';
import { validateCommand } from './command-completion.validator.js';
import {
  handleApplyClinicPlaybookLogic,
  handleConfigureClinicServiceLogic,
  handleExplainClinicServicesLogic,
} from './ai-clinic-service.logic.js';
import {
  APPLY_CLINIC_PLAYBOOK_PROMPTS,
  CONFIGURE_CLINIC_SERVICE_PROMPTS,
  EXPLAIN_CLINIC_SERVICES_PROMPTS,
} from './ai-clinic-service.fixtures.js';
import { makeResolvedCommand } from './command-completion.test-fixture.js';

describe('ai clinic service integration (ai-cmd-clinic-1–4)', () => {
  const services = [
    {
      id: 'svc-cbc',
      name: 'CBC',
      metadata: { serviceType: 'lab_test', requiresFasting: true },
      category: { name: 'Laboratory' },
    },
    {
      id: 'svc-cbc-full',
      name: 'Complete Blood Count',
      metadata: {},
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
      id: 'svc-thyroid',
      name: 'thyroid panel',
      metadata: {},
      category: { name: 'Laboratory' },
    },
    {
      id: 'svc-derm',
      name: 'dermatology visit',
      metadata: {},
      category: { name: 'Dermatology' },
    },
    {
      id: 'svc-glucose',
      name: 'blood glucose test',
      metadata: {},
      category: { name: 'Laboratory' },
    },
  ];

  const serviceService = {
    findAll: jest.fn(async () => [...services]),
    update: jest.fn(async (id: string, dto: Record<string, unknown>) => {
      const base = services.find((item) => item.id === id)!;
      return {
        ...base,
        metadata: { ...(base.metadata ?? {}), ...dto },
      };
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

  let rescue: AiIntentRescueService;

  beforeEach(() => {
    jest.clearAllMocks();
    rescue = new AiIntentRescueService();
    serviceService.findAll.mockResolvedValue([...services]);
    businessRepo.findOne.mockResolvedValue({
      id: 'biz-clinic',
      settings: { businessType: 'polyclinic' },
    });
  });

  it.each(CONFIGURE_CLINIC_SERVICE_PROMPTS)(
    'rescues and executes configure clinic service $id',
    async ({
      prompt,
      serviceName,
      serviceType,
      requiresFasting,
      preparationNotes,
    }) => {
      const rescued = rescue.rescue({
        prompt,
        action: 'unknown',
        params: {},
      });
      expect(rescued?.action).toBe('configure_clinic_service');

      const validation = validateCommand(makeResolvedCommand({
        action: 'configure_clinic_service',
        params: {
          ...(serviceName ? { serviceName } : {}),
          ...(serviceType ? { serviceType } : {}),
          ...(requiresFasting !== undefined ? { requiresFasting } : {}),
          ...(preparationNotes ? { preparationNotes } : {}),
        },
        enrichedParams: {},
        entities: { employees: [], services: [] },
        reasoning: 'test',
        prompt,
      }));
      expect(validation.issues).toEqual([]);

      const result = await handleConfigureClinicServiceLogic(
        deps(),
        'biz-clinic',
        {},
        prompt,
      );
      expect(result.success).toBe(true);
      expect(result.action).toBe('configure_clinic_service');
      expect(serviceService.update).toHaveBeenCalled();
    },
  );

  it.each(APPLY_CLINIC_PLAYBOOK_PROMPTS)(
    'rescues and executes apply clinic playbook $id',
    async ({ prompt }) => {
      const rescued = rescue.rescue({
        prompt,
        action: 'unknown',
        params: {},
      });
      expect(rescued?.action).toBe('apply_clinic_playbook');

      const validation = validateCommand(makeResolvedCommand({
        action: 'apply_clinic_playbook',
        params: {},
        enrichedParams: {},
        entities: { employees: [], services: [] },
        reasoning: 'test',
        prompt,
      }));
      expect(validation.issues).toEqual([]);

      const result = await handleApplyClinicPlaybookLogic(
        playbookDeps(),
        'biz-clinic',
        'user-1',
        {},
        prompt,
      );
      expect(result.success).toBe(true);
      expect(result.action).toBe('apply_clinic_playbook');
      expect(onboardingService.applyVerticalPlaybook).toHaveBeenCalledWith(
        'biz-clinic',
        'user-1',
      );
    },
  );

  it.each(EXPLAIN_CLINIC_SERVICES_PROMPTS)(
    'rescues and executes explain clinic services $id',
    async ({ prompt, serviceName }) => {
      const rescued = rescue.rescue({
        prompt,
        action: 'unknown',
        params: {},
      });
      expect(rescued?.action).toBe('explain_clinic_services');

      const validation = validateCommand(makeResolvedCommand({
        action: 'explain_clinic_services',
        params: {
          ...(serviceName ? { serviceName } : {}),
        },
        enrichedParams: {},
        entities: { employees: [], services: [] },
        reasoning: 'test',
        prompt,
      }));
      expect(validation.issues).toEqual([]);

      const result = await handleExplainClinicServicesLogic(
        deps(),
        'biz-clinic',
        {},
        prompt,
      );
      expect(result.success).toBe(true);
      expect(result.action).toBe('explain_clinic_services');
    },
  );
});
