import { Injectable, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Business } from '../business/entities/business.entity.js';
import { Employee } from '../employee/entities/employee.entity.js';
import { SchedulingSlot } from '../schedule/entities/scheduling-slot.entity.js';
import { ServiceCategoryService } from '../service/service-category.service.js';
import { ServiceService } from '../service/service.service.js';
import { ScheduleService } from '../schedule/schedule.service.js';
import { TemplateApplyService } from '../schedule/services/template-apply.service.js';
import { TemplatePeriodType } from '../schedule/entities/scheduling-template-period.entity.js';
import { LlmService } from '../../engine/agent/llm.service.js';
import {
  BUSINESS_TYPE_OPTIONS,
  getFallbackCatalog,
  isKnownBusinessType,
  type CatalogCategoryDraft,
} from './business-types.constants.js';
import { ApplyCatalogDto, SetBusinessTypeDto } from './dto/onboarding.dto.js';

const CATALOG_SCHEMA = `{
  "categories": [
    {
      "name": "Category name",
      "sortOrder": 0,
      "services": [
        {
          "name": "Service name",
          "description": "Optional short description",
          "durationMinutes": 60,
          "price": 50,
          "bufferMinutes": 0
        }
      ]
    }
  ],
  "summary": "One sentence explaining the recommended catalog"
}`;

@Injectable()
export class OnboardingService {
  private readonly logger = new Logger(OnboardingService.name);

  constructor(
    @InjectRepository(Business) private businessRepo: Repository<Business>,
    @InjectRepository(Employee) private employeeRepo: Repository<Employee>,
    @InjectRepository(SchedulingSlot) private slotRepo: Repository<SchedulingSlot>,
    private categoryService: ServiceCategoryService,
    private serviceService: ServiceService,
    private scheduleService: ScheduleService,
    private templateApplyService: TemplateApplyService,
    private llm: LlmService,
  ) {}

  getBusinessTypes() {
    return { types: BUSINESS_TYPE_OPTIONS };
  }

  async getStatus(businessId: string) {
    const business = await this.findBusiness(businessId);
    const settings = business.settings ?? {};
    const categories = await this.categoryService.findAll(businessId);
    const services = await this.serviceService.findAll(businessId);
    const onboarding = settings.onboarding ?? {};
    const hasCatalog = categories.length > 0 || services.length > 0;
    const hasSchedule = await this.businessHasSchedule(businessId);
    const explicitlyCompleted = Boolean(onboarding.completed);
    const legacyComplete = hasCatalog && hasSchedule && !onboarding.startedAt;

    let step = onboarding.step ?? 'type';
    if (explicitlyCompleted || legacyComplete) {
      step = 'done';
    } else if (step === 'catalog' && hasCatalog) {
      step = hasSchedule ? 'link' : 'schedule';
    } else if (step === 'schedule' && hasSchedule) {
      step = 'link';
    }

    return {
      completed: explicitlyCompleted || legacyComplete,
      step,
      businessType: settings.businessType ?? null,
      businessTypeNotes: settings.businessTypeNotes ?? null,
      hasCatalog,
      hasSchedule,
      categoryCount: categories.length,
      serviceCount: services.length,
      bookingSlug: business.slug,
      bookingPath: `/book/${business.slug}`,
    };
  }

  async setBusinessType(businessId: string, dto: SetBusinessTypeDto) {
    if (!isKnownBusinessType(dto.businessType)) {
      throw new BadRequestException('Unknown business type');
    }
    const business = await this.findBusiness(businessId);
    business.settings = {
      ...(business.settings ?? {}),
      businessType: dto.businessType,
      businessTypeNotes: dto.notes?.trim() || null,
      onboarding: {
        ...(business.settings?.onboarding ?? {}),
        completed: business.settings?.onboarding?.completed ?? false,
        startedAt: business.settings?.onboarding?.startedAt ?? new Date().toISOString(),
        step: 'catalog',
      },
    };
    await this.businessRepo.save(business);
    return this.getStatus(businessId);
  }

  async recommendCatalog(businessId: string) {
    const business = await this.findBusiness(businessId);
    const businessType = business.settings?.businessType;
    if (!businessType) {
      throw new BadRequestException('Select a business type first');
    }

    const typeLabel =
      BUSINESS_TYPE_OPTIONS.find((t) => t.id === businessType)?.id ?? businessType;
    const notes = business.settings?.businessTypeNotes ?? '';

    let categories: CatalogCategoryDraft[];
    let summary: string;
    let source: 'ai' | 'template' = 'template';

    if (this.llm.isAvailable) {
      try {
        const generated = await this.generateWithAi(business.name, typeLabel, notes);
        categories = generated.categories;
        summary = generated.summary;
        source = 'ai';
      } catch (err: any) {
        this.logger.warn(`AI catalog generation failed, using template: ${err.message}`);
        categories = getFallbackCatalog(businessType);
        summary = `Starter catalog for ${businessType.replace(/_/g, ' ')} businesses.`;
      }
    } else {
      categories = getFallbackCatalog(businessType);
      summary = `Starter catalog for ${businessType.replace(/_/g, ' ')} businesses.`;
    }

    categories = this.normalizeCatalog(categories);

    return { categories, summary, source, businessType };
  }

  async applyCatalog(businessId: string, dto: ApplyCatalogDto) {
    const business = await this.findBusiness(businessId);
    const existingCategories = await this.categoryService.findAll(businessId);
    const existingServices = await this.serviceService.findAll(businessId);
    const categoryNameSet = new Set(existingCategories.map((c) => c.name.toLowerCase()));
    const serviceNameSet = new Set(existingServices.map((s) => s.name.toLowerCase()));

    let categoriesCreated = 0;
    let servicesCreated = 0;

    for (const [index, catDraft] of dto.categories.entries()) {
      const catName = catDraft.name.trim();
      if (!catName) continue;

      let categoryId: string | null = null;
      const existingCat = existingCategories.find((c) => c.name.toLowerCase() === catName.toLowerCase());
      if (existingCat) {
        categoryId = existingCat.id;
      } else if (!categoryNameSet.has(catName.toLowerCase())) {
        const created = await this.categoryService.create(businessId, {
          name: catName,
          sortOrder: catDraft.sortOrder ?? index,
        });
        categoryId = created.id;
        categoryNameSet.add(catName.toLowerCase());
        categoriesCreated += 1;
      }

      for (const svcDraft of catDraft.services ?? []) {
        const svcName = svcDraft.name.trim();
        if (!svcName || serviceNameSet.has(svcName.toLowerCase())) continue;
        await this.serviceService.create(businessId, {
          name: svcName,
          description: svcDraft.description,
          durationMinutes: Math.max(10, Math.round(svcDraft.durationMinutes)),
          bufferMinutes: svcDraft.bufferMinutes ?? 0,
          price: svcDraft.price,
          categoryId: categoryId ?? undefined,
        });
        serviceNameSet.add(svcName.toLowerCase());
        servicesCreated += 1;
      }
    }

    business.settings = {
      ...(business.settings ?? {}),
      onboarding: {
        ...(business.settings?.onboarding ?? {}),
        catalogSeeded: true,
        catalogSeededAt: new Date().toISOString(),
        step: 'schedule',
      },
    };
    await this.businessRepo.save(business);

    return {
      categoriesCreated,
      servicesCreated,
      status: await this.getStatus(businessId),
    };
  }

  async applyDefaultSchedule(businessId: string, userId: string) {
    const business = await this.findBusiness(businessId);
    if (await this.businessHasSchedule(businessId)) {
      await this.setOnboardingStep(business, 'link');
      return { slotsCreated: 0, alreadyConfigured: true, status: await this.getStatus(businessId) };
    }

    const employee =
      (await this.employeeRepo.findOne({ where: { businessId, userId, isActive: true } })) ??
      (await this.employeeRepo.findOne({ where: { businessId, isActive: true }, order: { createdAt: 'ASC' } }));

    if (!employee) {
      throw new BadRequestException('Add at least one employee before setting up a schedule');
    }

    const template = await this.scheduleService.createTemplate(
      businessId,
      {
        name: 'Weekday hours',
        timePeriods: [
          {
            startTime: '09:00',
            endTime: '17:00',
            type: TemplatePeriodType.SERVICE_BLOCK,
            isActiveOnMonday: true,
            isActiveOnTuesday: true,
            isActiveOnWednesday: true,
            isActiveOnThursday: true,
            isActiveOnFriday: true,
            maxAppointmentCount: 1,
          },
        ],
      },
      userId,
    );

    const startDate = new Date();
    startDate.setUTCHours(0, 0, 0, 0);
    const endDate = new Date(startDate);
    endDate.setUTCDate(endDate.getUTCDate() + 27);

    const result = await this.templateApplyService.applyTemplate(
      {
        templateId: template.id,
        employeeId: employee.id,
        startDate: startDate.toISOString().slice(0, 10),
        endDate: endDate.toISOString().slice(0, 10),
        applyDays: [1, 2, 3, 4, 5],
        repeatWeeksCount: 4,
      },
      businessId,
      userId,
    );

    business.settings = {
      ...(business.settings ?? {}),
      onboarding: {
        ...(business.settings?.onboarding ?? {}),
        scheduleSeeded: true,
        scheduleSeededAt: new Date().toISOString(),
        step: 'link',
      },
    };
    await this.businessRepo.save(business);

    return {
      slotsCreated: result.slotsCreated,
      employeeName: employee.name,
      status: await this.getStatus(businessId),
    };
  }

  async skipScheduleStep(businessId: string) {
    const business = await this.findBusiness(businessId);
    await this.setOnboardingStep(business, 'link');
    return this.getStatus(businessId);
  }

  async completeOnboarding(businessId: string) {
    const business = await this.findBusiness(businessId);
    business.settings = {
      ...(business.settings ?? {}),
      onboarding: {
        ...(business.settings?.onboarding ?? {}),
        completed: true,
        completedAt: new Date().toISOString(),
        step: 'done',
      },
    };
    await this.businessRepo.save(business);
    return this.getStatus(businessId);
  }

  private async businessHasSchedule(businessId: string): Promise<boolean> {
    const count = await this.slotRepo.count({ where: { businessId } });
    return count > 0;
  }

  private async setOnboardingStep(business: Business, step: string) {
    business.settings = {
      ...(business.settings ?? {}),
      onboarding: {
        ...(business.settings?.onboarding ?? {}),
        step,
      },
    };
    await this.businessRepo.save(business);
  }

  private async findBusiness(businessId: string): Promise<Business> {
    const business = await this.businessRepo.findOne({ where: { id: businessId } });
    if (!business) throw new NotFoundException('Business not found');
    return business;
  }

  private normalizeCatalog(categories: CatalogCategoryDraft[]): CatalogCategoryDraft[] {
    return categories
      .slice(0, 8)
      .map((cat, index) => ({
        name: cat.name.trim(),
        sortOrder: cat.sortOrder ?? index,
        services: (cat.services ?? [])
          .slice(0, 12)
          .map((svc) => ({
            name: svc.name.trim(),
            description: svc.description?.trim(),
            durationMinutes: Math.max(10, Math.round(svc.durationMinutes || 30)),
            price: Math.max(0, Number(svc.price) || 0),
            bufferMinutes: Math.max(0, Math.round(svc.bufferMinutes ?? 0)),
          }))
          .filter((svc) => svc.name),
      }))
      .filter((cat) => cat.name && cat.services.length > 0);
  }

  private async generateWithAi(
    businessName: string,
    businessType: string,
    notes: string,
  ): Promise<{ categories: CatalogCategoryDraft[]; summary: string }> {
    const prompt = `You help new service businesses set up their booking catalog.

Business name: ${businessName}
Business type: ${businessType.replace(/_/g, ' ')}
Owner notes: ${notes || 'None'}

Return JSON matching this schema:
${CATALOG_SCHEMA}

Rules:
- Suggest 2-4 realistic service categories for this business type
- Each category should have 3-6 common bookable services
- Use realistic durations (10-180 minutes) and local-market prices in USD
- Names should be customer-friendly (what clients would book online)
- Do not include duplicate service names
- Keep descriptions under 120 characters when provided`;

    const parsed = await this.llm.completeJson<{ categories?: CatalogCategoryDraft[]; summary?: string }>(
      'You output only valid JSON for service business onboarding catalogs.',
      prompt,
      0.3,
    );
    if (!parsed?.categories?.length) throw new Error('No categories in AI response');
    return {
      categories: parsed.categories,
      summary: parsed.summary?.trim() || 'AI-recommended starter catalog for your business.',
    };
  }
}
