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

  const tourBusiness = {
    id: 'biz-3',
    name: 'Alpine Tours',
    slug: 'alpine-tours',
    settings: {
      businessType: 'tour_operator',
      onboarding: { step: 'catalog' },
    },
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

  it('previews clinic playbook with departments and Saturday hours', async () => {
    businessRepo.findOne.mockResolvedValue(clinicBusiness);
    const preview = await service.getVerticalPlaybookPreview('biz-2');

    expect(preview.playbookId).toBe('clinic');
    expect(preview.categories?.some((c) => c.name === 'Laboratory')).toBe(true);
    const services = preview.categories?.flatMap((c) => c.services) ?? [];
    expect(services.some((s) => s.serviceType === 'lab_test')).toBe(true);
    expect(preview.scheduleTemplates.length).toBeGreaterThanOrEqual(2);
    expect(preview.scheduleTemplates[1]?.name).toBe('Saturday clinic hours');
  });

  const polyclinicBusiness = {
    id: 'biz-4',
    name: 'Metro Polyclinic',
    slug: 'metro-poly',
    settings: { businessType: 'polyclinic', onboarding: { step: 'catalog' } },
  };

  it('previews polyclinic playbook with lab and cardiology services', async () => {
    businessRepo.findOne.mockResolvedValue(polyclinicBusiness);
    const preview = await service.getVerticalPlaybookPreview('biz-4');

    expect(preview.businessType).toBe('polyclinic');
    expect(preview.playbookId).toBe('clinic');
    const services = preview.categories?.flatMap((c) => c.services) ?? [];
    expect(
      services.some((s) => s.name === 'ECG' && s.serviceType === 'procedure'),
    ).toBe(true);
  });

  it('previews tour playbook with sample tour services and full-day hours', async () => {
    businessRepo.findOne.mockResolvedValue(tourBusiness);
    const preview = await service.getVerticalPlaybookPreview('biz-3');

    expect(preview.playbookId).toBe('tour');
    expect(preview.businessType).toBe('tour_operator');
    expect(preview.categories?.some((c) => c.name === 'Day Tours')).toBe(true);
    const tourServices = preview.categories?.flatMap((c) => c.services) ?? [];
    expect(
      tourServices.some(
        (s) => s.name === 'Full Day City Tour' && s.serviceType === 'tour',
      ),
    ).toBe(true);
    expect(preview.scheduleTemplates[0]?.timePeriods[0]).toMatchObject({
      startTime: '08:00',
      endTime: '18:00',
      daysActive: expect.arrayContaining(['Sun', 'Mon']),
    });
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
    expect(result.templatesApplied).toHaveLength(2);
    expect(scheduleService.createTemplate).toHaveBeenCalledWith(
      'biz-2',
      expect.objectContaining({
        name: 'Clinic weekday hours',
        timePeriods: expect.arrayContaining([
          expect.objectContaining({
            type: TemplatePeriodType.SERVICE_BLOCK,
            startTime: '09:00',
            endTime: '17:00',
          }),
        ]),
      }),
      'user-2',
    );
    expect(scheduleService.createTemplate).toHaveBeenCalledWith(
      'biz-2',
      expect.objectContaining({
        name: 'Saturday clinic hours',
        timePeriods: expect.arrayContaining([
          expect.objectContaining({
            type: TemplatePeriodType.SERVICE_BLOCK,
            startTime: '09:00',
            endTime: '13:00',
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

  it('applies tour vertical playbook catalog and schedule', async () => {
    businessRepo.findOne.mockResolvedValue(tourBusiness);
    employeeRepo.findOne.mockResolvedValue({
      id: 'emp-tour',
      name: 'Guide',
      businessId: 'biz-3',
    });
    categoryService.create.mockImplementation(async (_biz, dto) => ({
      id: `cat-${dto.name}`,
      ...dto,
    }));
    serviceService.create.mockResolvedValue({ id: 'svc-tour' });

    const result = await service.applyVerticalPlaybook('biz-3', 'user-1');

    expect(result.playbookId).toBe('tour');
    expect(result.servicesCreated).toBeGreaterThan(0);
    expect(result.templatesApplied).toEqual(
      getVerticalPlaybook('tour_operator').scheduleTemplates.map((t) => t.name),
    );
    expect(scheduleService.createTemplate).toHaveBeenCalledWith(
      'biz-3',
      expect.objectContaining({ name: 'Tour operating hours' }),
      'user-1',
    );
  });

  it('recommends tour playbook catalog when AI is unavailable', async () => {
    businessRepo.findOne.mockResolvedValue(tourBusiness);
    const result = await service.recommendCatalog('biz-3');

    expect(result.source).toBe('template');
    expect(result.businessType).toBe('tour_operator');
    expect(result.summary).toContain('tour');
    expect(
      result.categories.some((c) =>
        c.services.some((s) => s.serviceType === 'tour'),
      ),
    ).toBe(true);
    const trek = result.categories
      .flatMap((c) => c.services)
      .find((s) => s.name === '3-Day Mountain Trek');
    expect(trek).toMatchObject({
      serviceType: 'tour',
      durationDays: 3,
      maxGroupSize: 8,
    });
  });

  it('applies clinic vertical playbook catalog and schedule for polyclinic', async () => {
    businessRepo.findOne.mockResolvedValue(polyclinicBusiness);
    employeeRepo.findOne.mockResolvedValue({
      id: 'emp-poly',
      name: 'Dr Park',
      businessId: 'biz-4',
    });
    categoryService.create.mockImplementation(async (_biz, dto) => ({
      id: `cat-${dto.name}`,
      ...dto,
    }));
    serviceService.create.mockResolvedValue({ id: 'svc-clinic' });

    const result = await service.applyVerticalPlaybook('biz-4', 'user-1');

    expect(result.playbookId).toBe('clinic');
    expect(result.servicesCreated).toBeGreaterThan(0);
    expect(result.templatesApplied).toEqual(
      getVerticalPlaybook('polyclinic').scheduleTemplates.map((t) => t.name),
    );
    expect(scheduleService.createTemplate).toHaveBeenCalledWith(
      'biz-4',
      expect.objectContaining({ name: 'Clinic weekday hours' }),
      'user-1',
    );
  });

  it('recommends clinic playbook catalog when AI is unavailable for polyclinic', async () => {
    businessRepo.findOne.mockResolvedValue(polyclinicBusiness);
    const result = await service.recommendCatalog('biz-4');

    expect(result.source).toBe('template');
    expect(result.businessType).toBe('polyclinic');
    expect(result.summary).toContain('clinic');
    expect(result.categories.some((c) => c.name === 'Laboratory')).toBe(true);
    const lipid = result.categories
      .flatMap((c) => c.services)
      .find((s) => s.name === 'Lipid panel');
    expect(lipid).toMatchObject({
      serviceType: 'lab_test',
      requiresFasting: true,
    });
  });

  it('applyCatalog passes clinic metadata when seeding lab services', async () => {
    businessRepo.findOne.mockResolvedValue(polyclinicBusiness);
    categoryService.create.mockResolvedValue({
      id: 'cat-lab',
      name: 'Laboratory',
    });
    serviceService.create.mockResolvedValue({ id: 'svc-lab' });

    await service.applyCatalog('biz-4', {
      categories: [
        {
          name: 'Laboratory',
          sortOrder: 1,
          services: [
            {
              name: 'Lipid panel',
              durationMinutes: 15,
              price: 35,
              serviceType: 'lab_test',
              requiresFasting: true,
              preparationNotes: 'Fast 12 hours',
            },
          ],
        },
      ],
    });

    expect(serviceService.create).toHaveBeenCalledWith(
      'biz-4',
      expect.objectContaining({
        serviceType: 'lab_test',
        requiresFasting: true,
        preparationNotes: 'Fast 12 hours',
      }),
    );
  });

  it('applyCatalog passes tour metadata when seeding tour services', async () => {
    businessRepo.findOne.mockResolvedValue(tourBusiness);
    categoryService.create.mockResolvedValue({
      id: 'cat-tour',
      name: 'Day Tours',
    });
    serviceService.create.mockResolvedValue({ id: 'svc-tour' });

    await service.applyCatalog('biz-3', {
      categories: [
        {
          name: 'Day Tours',
          sortOrder: 0,
          services: [
            {
              name: 'Full Day City Tour',
              durationMinutes: 480,
              price: 85,
              serviceType: 'tour',
              coverImage: '/placeholders/tours/city-day.jpg',
              maxGroupSize: 12,
              difficulty: 'easy',
              durationDays: 1,
            },
          ],
        },
      ],
    });

    expect(serviceService.create).toHaveBeenCalledWith(
      'biz-3',
      expect.objectContaining({
        name: 'Full Day City Tour',
        serviceType: 'tour',
        coverImage: '/placeholders/tours/city-day.jpg',
        maxGroupSize: 12,
        difficulty: 'easy',
        durationDays: 1,
      }),
    );
  });
});
