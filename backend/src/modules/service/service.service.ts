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

@Injectable()
export class ServiceService {
  constructor(
    @InjectRepository(Service) private serviceRepo: Repository<Service>,
    @InjectRepository(ServiceCategory)
    private categoryRepo: Repository<ServiceCategory>,
    @InjectRepository(Business) private businessRepo: Repository<Business>,
    private eventStore: EventStoreService,
    private stripeIntegrationService: StripeIntegrationService,
  ) {}

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

  private enrichService(service: Service): Service & {
    localizedNames?: ReturnType<typeof extractLocalizedNamesFromMetadata>;
  } {
    const localizedNames = extractLocalizedNamesFromMetadata(service.metadata);
    const enriched = Object.assign(service, { localizedNames });
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
    const categoryId = await this.resolveCategoryId(businessId, dto.categoryId);
    const {
      categoryId: _inputCategoryId,
      localizedNames,
      ...serviceData
    } = dto;

    const service = await this.serviceRepo.save(
      this.serviceRepo.create({
        ...serviceData,
        businessId,
        categoryId: categoryId ?? null,
        bufferMinutes: dto.bufferMinutes || 0,
        currency: dto.currency || 'USD',
        metadata: applyLocalizedNamesToMetadata({}, localizedNames),
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
    return services.map((service) => this.enrichService(service));
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
    const nextMode = dto.prepaymentMode ?? service.prepaymentMode;
    await this.assertOnlinePaymentAllowed(service.businessId, nextMode);

    const categoryId = await this.resolveCategoryId(
      service.businessId,
      dto.categoryId,
    );
    if (categoryId !== undefined) service.categoryId = categoryId;

    const { categoryId: _omit, localizedNames, ...rest } = dto;
    if (localizedNames !== undefined) {
      service.metadata = applyLocalizedNamesToMetadata(
        (service.metadata ?? {}) as Record<string, unknown>,
        localizedNames,
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
