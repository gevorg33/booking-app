import { BadRequestException, NotFoundException } from '@nestjs/common';
import { OnboardingService } from './onboarding.service.js';
import { getVerticalPlaybook } from './vertical-playbooks.constants.js';
import { TemplatePeriodType } from '../schedule/entities/scheduling-template-period.entity.js';

describe('OnboardingService vertical playbooks (integration)', () => {
  const businessRepo = { findOne: jest.fn(), save: jest.fn() };
  const employeeRepo = { findOne: jest.fn() };
  const slotRepo = { count: jest.fn() };
  const categoryService = { findAll: jest.fn(), create: jest.fn() };
  const serviceService = { findAll: jest.fn(), create: jest.fn() };
  const scheduleService = { createTemplate: jest.fn() };
  const templateApplyService = { applyTemplate: jest.fn() };
  const llm = { isAvailableForBusiness: jest.fn(), completeJson: jest.fn() };

  const service = new OnboardingService(
    businessRepo as any,
    employeeRepo as any,
    slotRepo as any,
    categoryService as any,
    serviceService as any,
    scheduleService as any,
    templateApplyService as any,
    llm as any,
  );

  const salonBusiness = {
    id: 'biz-1',
    name: 'Glow Salon',
    slug: 'glow-salon',
    settings: { businessType: 'hair_salon', onboarding: { step: 'catalog' } },
  };

  const clinicBusiness = {
    id: 'biz-2',
    name: 'Smile Dental',
    slug: 'smile-dental',
    settings: { businessType: 'dental', onboarding: { step: 'catalog' } },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    businessRepo.save.mockImplementation(async (b) => b);
    categoryService.findAll.mockResolvedValue([]);
    serviceService.findAll.mockResolvedValue([]);
    slotRepo.count.mockResolvedValue(0);
    employeeRepo.findOne.mockResolvedValue({
      id: 'emp-1',
      name: 'Owner',
      businessId: 'biz-1',
    });
    scheduleService.createTemplate.mockImplementation(async (_biz, dto) => ({
      id: `tpl-${dto.name}`,
      ...dto,
    }));
    templateApplyService.applyTemplate.mockResolvedValue({ slotsCreated: 12 });
    llm.isAvailableForBusiness.mockResolvedValue(false);
  });

  it('previews salon playbook with schedule templates and service count', async () => {
    businessRepo.findOne.mockResolvedValue(salonBusiness);
    const preview = await service.getVerticalPlaybookPreview('biz-1');

    expect(preview.playbookId).toBe('salon');
    expect(preview.businessType).toBe('hair_salon');
    expect(preview.serviceCount).toBe(
      getVerticalPlaybook('hair_salon').categories.reduce(
        (sum, cat) => sum + cat.services.length,
        0,
      ),
    );
    expect(preview.scheduleTemplates.length).toBeGreaterThanOrEqual(2);
    expect(preview.scheduleTemplates[0]?.timePeriods[0]).toMatchObject({
      type: TemplatePeriodType.SERVICE_BLOCK,
      daysActive: expect.arrayContaining(['Mon', 'Fri']),
    });
  });

  it('previews clinic playbook with lunch unavailable block', async () => {
    businessRepo.findOne.mockResolvedValue(clinicBusiness);
    const preview = await service.getVerticalPlaybookPreview('biz-2');

    expect(preview.playbookId).toBe('clinic');
    const periods = preview.scheduleTemplates.flatMap((t) => t.timePeriods);
    expect(
      periods.some((p) => p.type === TemplatePeriodType.UNAVAILABLE_BLOCK),
    ).toBe(true);
  });

  it('rejects playbook preview without business type', async () => {
    businessRepo.findOne.mockResolvedValue({ ...salonBusiness, settings: {} });
    await expect(
      service.getVerticalPlaybookPreview('biz-1'),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects playbook preview when business is missing', async () => {
    businessRepo.findOne.mockResolvedValue(null);
    await expect(
      service.getVerticalPlaybookPreview('missing'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('recommends playbook catalog when AI is unavailable', async () => {
    businessRepo.findOne.mockResolvedValue(salonBusiness);
    const result = await service.recommendCatalog('biz-1');

    expect(result.source).toBe('template');
    expect(result.categories.length).toBeGreaterThan(0);
    expect(result.summary).toContain('salon');
    expect(llm.completeJson).not.toHaveBeenCalled();
  });

  it('falls back to playbook catalog when AI generation fails', async () => {
    businessRepo.findOne.mockResolvedValue(clinicBusiness);
    llm.isAvailableForBusiness.mockResolvedValue(true);
    llm.completeJson.mockRejectedValue(new Error('openai down'));

    const result = await service.recommendCatalog('biz-2');
    expect(result.source).toBe('template');
    expect(result.categories.map((c) => c.name)).toEqual(
      getVerticalPlaybook('dental').categories.map((c) => c.name),
    );
  });

  it('uses AI catalog when generation succeeds', async () => {
    businessRepo.findOne.mockResolvedValue(salonBusiness);
    llm.isAvailableForBusiness.mockResolvedValue(true);
    llm.completeJson.mockResolvedValue({
      categories: [
        {
          name: 'AI Cat',
          sortOrder: 0,
          services: [{ name: 'AI Cut', durationMinutes: 45, price: 40 }],
        },
      ],
      summary: 'Tailored by AI',
    });

    const result = await service.recommendCatalog('biz-1');
    expect(result.source).toBe('ai');
    expect(result.summary).toBe('Tailored by AI');
    expect(result.categories[0]?.name).toBe('AI Cat');
  });

  it('applies vertical playbook catalog and schedule in one flow', async () => {
    businessRepo.findOne.mockResolvedValue(salonBusiness);
    categoryService.create.mockResolvedValue({
      id: 'cat-1',
      name: 'Haircuts & styling',
    });
    serviceService.create.mockResolvedValue({ id: 'svc-1' });

    const result = await service.applyVerticalPlaybook('biz-1', 'user-1');

    expect(result.playbookId).toBe('salon');
    expect(result.categoriesCreated).toBeGreaterThan(0);
    expect(result.servicesCreated).toBeGreaterThan(0);
    expect(result.slotsCreated).toBeGreaterThan(0);
    expect(result.templatesApplied).toEqual(
      getVerticalPlaybook('hair_salon').scheduleTemplates.map((t) => t.name),
    );
    expect(scheduleService.createTemplate).toHaveBeenCalledTimes(2);
    expect(templateApplyService.applyTemplate).toHaveBeenCalledTimes(2);
    expect(businessRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        settings: expect.objectContaining({
          onboarding: expect.objectContaining({
            verticalPlaybookId: 'salon',
            step: 'link',
          }),
        }),
      }),
    );
  });

  it('rejects apply playbook without business type', async () => {
    businessRepo.findOne.mockResolvedValue({ ...salonBusiness, settings: {} });
    await expect(
      service.applyVerticalPlaybook('biz-1', 'user-1'),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('applyDefaultSchedule uses vertical playbook templates for business type', async () => {
    businessRepo.findOne.mockResolvedValue(clinicBusiness);
    employeeRepo.findOne.mockResolvedValue({
      id: 'emp-2',
      name: 'Dr Kim',
      businessId: 'biz-2',
    });

    const result = await service.applyDefaultSchedule('biz-2', 'user-2');

    expect(result.playbookId).toBe('clinic');
    expect(result.templatesApplied).toHaveLength(1);
    expect(scheduleService.createTemplate).toHaveBeenCalledWith(
      'biz-2',
      expect.objectContaining({
        name: 'Clinic weekday hours',
        timePeriods: expect.arrayContaining([
          expect.objectContaining({
            type: TemplatePeriodType.UNAVAILABLE_BLOCK,
          }),
        ]),
      }),
      'user-2',
    );
  });

  it('applyDefaultSchedule skips slot creation when schedule already exists', async () => {
    businessRepo.findOne.mockResolvedValue(salonBusiness);
    slotRepo.count.mockResolvedValue(24);

    const result = await service.applyDefaultSchedule('biz-1', 'user-1');

    expect(result.alreadyConfigured).toBe(true);
    expect(result.slotsCreated).toBe(0);
    expect(scheduleService.createTemplate).not.toHaveBeenCalled();
  });

  it('applyDefaultSchedule requires an active employee', async () => {
    businessRepo.findOne.mockResolvedValue(salonBusiness);
    employeeRepo.findOne.mockResolvedValue(null);

    await expect(
      service.applyDefaultSchedule('biz-1', 'user-1'),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('exposes business type options', () => {
    const result = service.getBusinessTypes();
    expect(result.types.length).toBeGreaterThanOrEqual(8);
  });

  it('tracks onboarding status across catalog and schedule steps', async () => {
    businessRepo.findOne.mockResolvedValue({
      ...salonBusiness,
      settings: {
        businessType: 'hair_salon',
        onboarding: { step: 'catalog', completed: false },
      },
    });
    categoryService.findAll.mockResolvedValue([{ id: 'cat-1' }]);
    serviceService.findAll.mockResolvedValue([{ id: 'svc-1' }]);
    slotRepo.count.mockResolvedValue(0);

    const status = await service.getStatus('biz-1');
    expect(status.step).toBe('schedule');
    expect(status.hasCatalog).toBe(true);
    expect(status.hasSchedule).toBe(false);
  });

  it('marks onboarding complete when catalog and schedule exist (legacy)', async () => {
    businessRepo.findOne.mockResolvedValue({
      ...salonBusiness,
      settings: { businessType: 'hair_salon', onboarding: { step: 'type' } },
    });
    categoryService.findAll.mockResolvedValue([{ id: 'cat-1' }]);
    serviceService.findAll.mockResolvedValue([{ id: 'svc-1' }]);
    slotRepo.count.mockResolvedValue(10);

    const status = await service.getStatus('biz-1');
    expect(status.completed).toBe(true);
    expect(status.step).toBe('done');
  });

  it('sets business type and advances onboarding step', async () => {
    businessRepo.findOne.mockResolvedValue({ ...salonBusiness, settings: {} });

    const status = await service.setBusinessType('biz-1', {
      businessType: 'barbershop',
      notes: '  fades and beard  ',
    });

    expect(businessRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        settings: expect.objectContaining({
          businessType: 'barbershop',
          businessTypeNotes: 'fades and beard',
          onboarding: expect.objectContaining({ step: 'catalog' }),
        }),
      }),
    );
    expect(status.businessType).toBe('barbershop');
  });

  it('rejects unknown business type', async () => {
    businessRepo.findOne.mockResolvedValue(salonBusiness);
    await expect(
      service.setBusinessType('biz-1', { businessType: 'unknown_vertical' }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects catalog recommendation without business type', async () => {
    businessRepo.findOne.mockResolvedValue({ ...salonBusiness, settings: {} });
    await expect(service.recommendCatalog('biz-1')).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('skips schedule step and completes onboarding', async () => {
    businessRepo.findOne.mockResolvedValue(salonBusiness);

    const skipped = await service.skipScheduleStep('biz-1');
    expect(skipped.step).toBe('link');

    const completed = await service.completeOnboarding('biz-1');
    expect(completed.completed).toBe(true);
    expect(completed.step).toBe('done');
  });

  it('advances status to schedule when catalog exists but schedule does not', async () => {
    businessRepo.findOne.mockResolvedValue({
      ...salonBusiness,
      settings: {
        onboarding: { step: 'catalog', startedAt: '2026-01-01T00:00:00.000Z' },
      },
    });
    categoryService.findAll.mockResolvedValue([{ id: 'cat-1' }]);
    serviceService.findAll.mockResolvedValue([]);
    slotRepo.count.mockResolvedValue(0);

    const status = await service.getStatus('biz-1');
    expect(status.step).toBe('schedule');
    expect(status.completed).toBe(false);
  });

  it('advances status to link when schedule already exists during catalog step', async () => {
    businessRepo.findOne.mockResolvedValue({
      ...salonBusiness,
      settings: {
        onboarding: { step: 'catalog', startedAt: '2026-01-01T00:00:00.000Z' },
      },
    });
    categoryService.findAll.mockResolvedValue([{ id: 'cat-1' }]);
    serviceService.findAll.mockResolvedValue([]);
    slotRepo.count.mockResolvedValue(5);

    const status = await service.getStatus('biz-1');
    expect(status.step).toBe('link');
  });

  it('advances status to link when schedule step already has slots', async () => {
    businessRepo.findOne.mockResolvedValue({
      ...salonBusiness,
      settings: {
        onboarding: { step: 'schedule', startedAt: '2026-01-01T00:00:00.000Z' },
      },
    });
    slotRepo.count.mockResolvedValue(3);

    const status = await service.getStatus('biz-1');
    expect(status.step).toBe('link');
  });

  it('respects explicitly completed onboarding flag', async () => {
    businessRepo.findOne.mockResolvedValue({
      ...salonBusiness,
      settings: { onboarding: { completed: true, step: 'schedule' } },
    });

    const status = await service.getStatus('biz-1');
    expect(status.completed).toBe(true);
    expect(status.step).toBe('done');
  });

  it('throws when AI returns empty categories', async () => {
    businessRepo.findOne.mockResolvedValue(salonBusiness);
    llm.isAvailableForBusiness.mockResolvedValue(true);
    llm.completeJson.mockResolvedValue({ categories: [], summary: 'empty' });

    const result = await service.recommendCatalog('biz-1');
    expect(result.source).toBe('template');
  });

  it('applyCatalog ignores blank category and service names', async () => {
    businessRepo.findOne.mockResolvedValue(salonBusiness);

    const result = await service.applyCatalog('biz-1', {
      categories: [
        {
          name: '  ',
          sortOrder: 0,
          services: [{ name: 'Valid', durationMinutes: 30, price: 10 }],
        },
        {
          name: 'Real',
          sortOrder: 1,
          services: [
            { name: '  ', durationMinutes: 30, price: 10 },
            { name: 'Keep', durationMinutes: 45, price: 20 },
          ],
        },
      ],
    });

    expect(result.categoriesCreated).toBe(1);
    expect(result.servicesCreated).toBe(1);
  });

  it('reuses existing category when name matches case-insensitively', async () => {
    businessRepo.findOne.mockResolvedValue(salonBusiness);
    categoryService.findAll.mockResolvedValue([
      { id: 'cat-existing', name: 'haircuts & styling' },
    ]);
    serviceService.findAll.mockResolvedValue([]);

    const result = await service.applyCatalog('biz-1', {
      categories: [
        {
          name: 'Haircuts & styling',
          sortOrder: 0,
          services: [{ name: 'New Service', durationMinutes: 30, price: 25 }],
        },
      ],
    });

    expect(result.categoriesCreated).toBe(0);
    expect(result.servicesCreated).toBe(1);
    expect(categoryService.create).not.toHaveBeenCalled();
    expect(serviceService.create).toHaveBeenCalledWith(
      'biz-1',
      expect.objectContaining({ categoryId: 'cat-existing' }),
    );
  });

  it('applyCatalog deduplicates existing category and service names', async () => {
    businessRepo.findOne.mockResolvedValue(salonBusiness);
    categoryService.findAll.mockResolvedValue([
      { id: 'cat-existing', name: 'Haircuts & styling' },
    ]);
    serviceService.findAll.mockResolvedValue([
      { id: 'svc-existing', name: "Women's haircut" },
    ]);
    categoryService.create.mockResolvedValue({
      id: 'cat-new',
      name: 'Nails & beauty',
    });
    serviceService.create.mockResolvedValue({ id: 'svc-new' });

    const playbook = getVerticalPlaybook('hair_salon');
    const result = await service.applyCatalog('biz-1', {
      categories: playbook.categories,
    });

    expect(result.categoriesCreated).toBe(2);
    expect(result.servicesCreated).toBe(6);
    expect(categoryService.create).toHaveBeenCalledTimes(2);
    expect(serviceService.create).toHaveBeenCalledTimes(6);
  });
});
