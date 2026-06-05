import { OnboardingController } from './onboarding.controller.js';
import { OnboardingService } from './onboarding.service.js';
import { BusinessService } from '../business/business.service.js';

describe('OnboardingController vertical playbook endpoints', () => {
  const onboardingService = {
    getStatus: jest.fn(),
    getBusinessTypes: jest.fn(),
    setBusinessType: jest.fn(),
    recommendCatalog: jest.fn(),
    applyCatalog: jest.fn(),
    applyDefaultSchedule: jest.fn(),
    getVerticalPlaybookPreview: jest.fn(),
    applyVerticalPlaybook: jest.fn(),
    skipScheduleStep: jest.fn(),
    completeOnboarding: jest.fn(),
  };
  const businessService = { ensureMember: jest.fn() };

  const controller = new OnboardingController(
    onboardingService as unknown as OnboardingService,
    businessService as unknown as BusinessService,
  );

  const user = { id: 'user-1' };

  beforeEach(() => {
    jest.clearAllMocks();
    businessService.ensureMember.mockResolvedValue({ role: 'owner' });
  });

  it('returns vertical playbook preview after membership guard', async () => {
    onboardingService.getVerticalPlaybookPreview.mockResolvedValue({
      playbookId: 'salon',
      serviceCount: 7,
      scheduleTemplates: [],
    });

    const result = await controller.getVerticalPlaybook('biz-1', user);

    expect(businessService.ensureMember).toHaveBeenCalledWith(
      'biz-1',
      'user-1',
    );
    expect(onboardingService.getVerticalPlaybookPreview).toHaveBeenCalledWith(
      'biz-1',
    );
    expect(result.playbookId).toBe('salon');
  });

  it('applies full vertical playbook after membership guard', async () => {
    onboardingService.applyVerticalPlaybook.mockResolvedValue({
      playbookId: 'clinic',
      categoriesCreated: 3,
      servicesCreated: 7,
      slotsCreated: 40,
    });

    const result = await controller.applyPlaybook('biz-1', user);

    expect(onboardingService.applyVerticalPlaybook).toHaveBeenCalledWith(
      'biz-1',
      'user-1',
    );
    expect(result.playbookId).toBe('clinic');
    expect(result.slotsCreated).toBe(40);
  });

  it('delegates apply-schedule to default vertical playbook schedule', async () => {
    onboardingService.applyDefaultSchedule.mockResolvedValue({
      playbookId: 'salon',
      slotsCreated: 24,
    });
    const result = await controller.applySchedule('biz-1', user);
    expect(onboardingService.applyDefaultSchedule).toHaveBeenCalledWith(
      'biz-1',
      'user-1',
    );
    expect(result.playbookId).toBe('salon');
  });

  it('delegates recommend-catalog for playbook-backed suggestions', async () => {
    onboardingService.recommendCatalog.mockResolvedValue({
      source: 'template',
      categories: [{ name: 'Consultations', services: [] }],
    });
    const result = await controller.recommendCatalog('biz-1', user);
    expect(onboardingService.recommendCatalog).toHaveBeenCalledWith('biz-1');
    expect(result.source).toBe('template');
  });
});
