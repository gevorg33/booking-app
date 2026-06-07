import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Service, PrepaymentMode } from './entities/service.entity.js';
import { ServiceCategory } from './entities/service-category.entity.js';
import { Business } from '../business/entities/business.entity.js';
import {
  CreateServiceDto,
  UpdateServiceDto,
} from './dto/create-service.dto.js';
import {
  applyLocalizedNamesToMetadata,
  extractLocalizedNamesFromMetadata,
} from '../../common/i18n/service-localized-names.util.js';
import { EventStoreService } from '../../events/store/event-store.service.js';
import { EventType } from '../../events/event-types.js';
import { StripeIntegrationService } from '../billing/stripe-integration.service.js';
import {
  assertSupportedBusinessCurrency,
  getBusinessDefaultCurrency,
} from '../../common/utils/business-currency.util.js';
import { getBusinessEnabledLocales } from '../../common/utils/business-locale.util.js';
import {
  applyClinicMetadataToServiceMetadata,
  extractClinicMetadata,
  isClinicServiceType,
} from '../../common/utils/clinic-service.util.js';
import {
  applyClinicDiagnosticCodeLinkToServiceMetadata,
  mapClinicDiagnosticCodeLinkView,
  readClinicDiagnosticCodeIdFromServiceMetadata,
  validateClinicDiagnosticCodeKindMatch,
  type ClinicDiagnosticCodeLinkView,
} from '../../common/utils/clinic-diagnostic-code-link.util.js';
import { ClinicDiagnosticCodesService } from '../clinic-diagnostic-codes/clinic-diagnostic-codes.service.js';
import {
  applyServiceTaxRateToMetadata,
  readServiceTaxRatePercent,
} from '../../common/utils/business-tax.util.js';
import {
  applyTourMetadataToServiceMetadata,
  extractTourMetadata,
  TOUR_SERVICE_TYPE,
} from '../../common/utils/tour-service.util.js';

@Injectable()
export class ServiceService {
  constructor(
    @InjectRepository(Service) private serviceRepo: Repository<Service>,
    @InjectRepository(ServiceCategory)
    private categoryRepo: Repository<ServiceCategory>,
    @InjectRepository(Business) private businessRepo: Repository<Business>,
    private eventStore: EventStoreService,
    private stripeIntegrationService: StripeIntegrationService,
    private clinicDiagnosticCodesService: ClinicDiagnosticCodesService,
  ) {}

  private resolveServiceCurrency(
    code: string | undefined,
    defaultCurrency: string,
  ): string {
    if (!code) return defaultCurrency;
    try {
      return assertSupportedBusinessCurrency(code);
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error ? error.message : 'Invalid currency code',
      );
    }
  }

  private async assertOnlinePaymentAllowed(
    businessId: string,
    prepaymentMode?: PrepaymentMode,
  ): Promise<void> {
    if (!prepaymentMode || prepaymentMode === PrepaymentMode.NONE) return;

    const business = await this.businessRepo.findOne({
      where: { id: businessId },
    });
    if (!business) throw new NotFoundException('Business not found');

    if (!this.stripeIntegrationService.isConnectReady(business.settings)) {
      throw new BadRequestException(
        'Connect your Stripe account in Dashboard → Billing before enabling online payment for a service',
      );
    }
  }

  private applyVerticalServiceMetadata(
    metadata: Record<string, unknown>,
    dto: CreateServiceDto | UpdateServiceDto,
  ): Record<string, unknown> {
    const hasVerticalField =
      dto.serviceType !== undefined ||
      dto.coverImage !== undefined ||
      dto.maxGroupSize !== undefined ||
      dto.difficulty !== undefined ||
      dto.meetingPoint !== undefined ||
      dto.includedItems !== undefined ||
      dto.durationDays !== undefined ||
      dto.requiresFasting !== undefined ||
      dto.preparationNotes !== undefined;
    if (!hasVerticalField) return metadata;

    if (dto.serviceType === '') {
      return applyClinicDiagnosticCodeLinkToServiceMetadata(
        applyClinicMetadataToServiceMetadata(
          applyTourMetadataToServiceMetadata(metadata, { serviceType: null }),
          { serviceType: null },
        ),
        null,
      );
    }

    if (dto.serviceType === TOUR_SERVICE_TYPE) {
      let next = applyClinicMetadataToServiceMetadata(metadata, {
        serviceType: null,
      });
      next = applyTourMetadataToServiceMetadata(next, {
        serviceType: TOUR_SERVICE_TYPE,
        coverImage: dto.coverImage,
        maxGroupSize: dto.maxGroupSize,
        difficulty:
          dto.difficulty === '' ? undefined : dto.difficulty || undefined,
        meetingPoint: dto.meetingPoint,
        includedItems: dto.includedItems,
        durationDays: dto.durationDays,
      });
      return next;
    }

    if (dto.serviceType && isClinicServiceType(dto.serviceType)) {
      let next = applyTourMetadataToServiceMetadata(metadata, {
        serviceType: null,
      });
      next = applyClinicMetadataToServiceMetadata(next, {
        serviceType: dto.serviceType,
        requiresFasting: dto.requiresFasting,
        preparationNotes: dto.preparationNotes,
      });
      return next;
    }

    const tour = extractTourMetadata(metadata);
    if (tour) {
      return applyTourMetadataToServiceMetadata(metadata, {
        coverImage: dto.coverImage,
        maxGroupSize: dto.maxGroupSize,
        difficulty:
          dto.difficulty === '' ? undefined : dto.difficulty || undefined,
        meetingPoint: dto.meetingPoint,
        includedItems: dto.includedItems,
        durationDays: dto.durationDays,
      });
    }

    const clinic = extractClinicMetadata(metadata);
    if (clinic) {
      return applyClinicMetadataToServiceMetadata(metadata, {
        requiresFasting: dto.requiresFasting,
        preparationNotes: dto.preparationNotes,
      });
    }

    return metadata;
  }

  private async applyDiagnosticCodeMetadataLink(
    businessId: string,
    metadata: Record<string, unknown>,
    dto: CreateServiceDto | UpdateServiceDto,
  ): Promise<Record<string, unknown>> {
    if (dto.clinicDiagnosticCodeId === undefined) return metadata;

    const clinic = extractClinicMetadata(metadata);
    const serviceType =
      clinic?.serviceType ??
      (dto.serviceType && isClinicServiceType(dto.serviceType)
        ? dto.serviceType
        : null);

    if (!dto.clinicDiagnosticCodeId) {
      return applyClinicDiagnosticCodeLinkToServiceMetadata(metadata, null);
    }

    const summary =
      await this.clinicDiagnosticCodesService.resolveActiveClinicDiagnosticCode(
        businessId,
        dto.clinicDiagnosticCodeId,
      );
    const kindError = validateClinicDiagnosticCodeKindMatch(
      serviceType,
      summary!.codeKind,
    );
    if (kindError) {
      throw new BadRequestException(kindError);
    }

    return applyClinicDiagnosticCodeLinkToServiceMetadata(
      metadata,
      summary!.id,
    );
  }

  private async enrichService(service: Service): Promise<
    Service & {
      localizedNames?: ReturnType<typeof extractLocalizedNamesFromMetadata>;
      tour?: ReturnType<typeof extractTourMetadata>;
      clinic?: ReturnType<typeof extractClinicMetadata>;
      taxRatePercent?: number | null;
      diagnosticCode?: ClinicDiagnosticCodeLinkView | null;
    }
  > {
    const localizedNames = extractLocalizedNamesFromMetadata(service.metadata);
    const tour = extractTourMetadata(service.metadata);
    const clinic = extractClinicMetadata(service.metadata);
    const taxRatePercent = readServiceTaxRatePercent(service.metadata);
    const diagnosticCodeId = readClinicDiagnosticCodeIdFromServiceMetadata(
      service.metadata,
    );
    const diagnosticCodeSummary = diagnosticCodeId
      ? await this.clinicDiagnosticCodesService.resolveActiveClinicDiagnosticCode(
          service.businessId,
          diagnosticCodeId,
        )
      : null;
    const enriched = Object.assign(service, {
      localizedNames,
      tour,
      clinic,
      taxRatePercent,
      diagnosticCode: diagnosticCodeSummary
        ? mapClinicDiagnosticCodeLinkView(diagnosticCodeSummary)
        : null,
    });
    if (enriched.category) {
      Object.assign(enriched.category, {
        localizedNames: extractLocalizedNamesFromMetadata(
          enriched.category.metadata,
        ),
      });
    }
    return enriched;
  }

  private async resolveCategoryId(
    businessId: string,
    categoryId?: string | null,
  ): Promise<string | null | undefined> {
    if (categoryId === undefined) return undefined;
    if (categoryId === null) return null;
    const category = await this.categoryRepo.findOne({
      where: { id: categoryId, businessId, isActive: true },
    });
    if (!category) throw new BadRequestException('Service category not found');
    return categoryId;
  }

  async create(
    businessId: string,
    dto: CreateServiceDto,
    userId?: string,
  ): Promise<Service> {
    await this.assertOnlinePaymentAllowed(businessId, dto.prepaymentMode);
    const business = await this.businessRepo.findOne({
      where: { id: businessId },
    });
    if (!business) throw new NotFoundException('Business not found');
    const businessSettings = business.settings as
      | Record<string, unknown>
      | undefined;
    const defaultCurrency = getBusinessDefaultCurrency(businessSettings);
    const enabledLocales = getBusinessEnabledLocales(businessSettings);
    const categoryId = await this.resolveCategoryId(businessId, dto.categoryId);
    const {
      categoryId: _inputCategoryId,
      localizedNames,
      serviceType: _serviceType,
      coverImage: _coverImage,
      maxGroupSize: _maxGroupSize,
      difficulty: _difficulty,
      meetingPoint: _meetingPoint,
      includedItems: _includedItems,
      durationDays: _durationDays,
      requiresFasting: _requiresFasting,
      preparationNotes: _preparationNotes,
      taxRatePercent: _taxRatePercent,
      clinicDiagnosticCodeId: _clinicDiagnosticCodeId,
      currency: _currencyInput,
      ...serviceData
    } = dto;
    let metadata = applyLocalizedNamesToMetadata({}, localizedNames, {
      enabledLocales,
    });
    metadata = this.applyVerticalServiceMetadata(metadata, dto);
    metadata = await this.applyDiagnosticCodeMetadataLink(
      businessId,
      metadata,
      dto,
    );
    if (dto.taxRatePercent !== undefined) {
      metadata = applyServiceTaxRateToMetadata(metadata, dto.taxRatePercent);
    }

    const service = await this.serviceRepo.save(
      this.serviceRepo.create({
        ...serviceData,
        businessId,
        categoryId: categoryId ?? null,
        bufferMinutes: dto.bufferMinutes || 0,
        currency: this.resolveServiceCurrency(dto.currency, defaultCurrency),
        metadata,
      }),
    );
    await this.eventStore.publish({
      eventType: EventType.SERVICE_CREATED,
      aggregateType: 'service',
      aggregateId: service.id,
      businessId,
      payload: { name: service.name, duration: service.durationMinutes },
      userId,
    });
    return this.enrichService(service);
  }

  async findAll(businessId: string) {
    const services = await this.serviceRepo.find({
      where: { businessId, isActive: true },
      relations: { category: true },
      order: { name: 'ASC' },
    });
    return Promise.all(services.map((item) => this.enrichService(item)));
  }

  async findOne(id: string) {
    const service = await this.serviceRepo.findOne({
      where: { id },
      relations: { category: true },
    });
    if (!service) throw new NotFoundException('Service not found');
    return this.enrichService(service);
  }

  async update(
    id: string,
    dto: UpdateServiceDto,
    userId?: string,
  ): Promise<Service> {
    const service = await this.findOne(id);
    const business = await this.businessRepo.findOne({
      where: { id: service.businessId },
    });
    const enabledLocales = getBusinessEnabledLocales(
      business?.settings as Record<string, unknown> | undefined,
    );
    const nextMode = dto.prepaymentMode ?? service.prepaymentMode;
    await this.assertOnlinePaymentAllowed(service.businessId, nextMode);

    const categoryId = await this.resolveCategoryId(
      service.businessId,
      dto.categoryId,
    );
    if (categoryId !== undefined) service.categoryId = categoryId;

    const {
      categoryId: _omit,
      localizedNames,
      serviceType: _serviceType,
      coverImage: _coverImage,
      maxGroupSize: _maxGroupSize,
      difficulty: _difficulty,
      meetingPoint: _meetingPoint,
      includedItems: _includedItems,
      durationDays: _durationDays,
      requiresFasting: _requiresFasting,
      preparationNotes: _preparationNotes,
      taxRatePercent: _taxRatePercent,
      clinicDiagnosticCodeId: _clinicDiagnosticCodeId,
      currency: _currency,
      ...rest
    } = dto;
    if (localizedNames !== undefined) {
      service.metadata = applyLocalizedNamesToMetadata(
        (service.metadata ?? {}) as Record<string, unknown>,
        localizedNames,
        { enabledLocales },
      );
    }
    service.metadata = this.applyVerticalServiceMetadata(
      (service.metadata ?? {}) as Record<string, unknown>,
      dto,
    );
    service.metadata = await this.applyDiagnosticCodeMetadataLink(
      service.businessId,
      (service.metadata ?? {}) as Record<string, unknown>,
      dto,
    );
    if (dto.taxRatePercent !== undefined) {
      service.metadata = applyServiceTaxRateToMetadata(
        (service.metadata ?? {}) as Record<string, unknown>,
        dto.taxRatePercent,
      );
    }
    if (dto.currency !== undefined) {
      service.currency = this.resolveServiceCurrency(
        dto.currency,
        service.currency,
      );
    }
    Object.assign(service, rest);
    const updated = await this.serviceRepo.save(service);
    await this.eventStore.publish({
      eventType: EventType.SERVICE_UPDATED,
      aggregateType: 'service',
      aggregateId: id,
      businessId: service.businessId,
      payload: dto,
      userId,
    });
    return this.enrichService(updated);
  }

  async remove(id: string): Promise<void> {
    await this.serviceRepo.update(id, { isActive: false });
  }
}
