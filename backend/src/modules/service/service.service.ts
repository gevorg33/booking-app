import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Service, PrepaymentMode } from './entities/service.entity.js';
import { Business } from '../business/entities/business.entity.js';
import { CreateServiceDto, UpdateServiceDto } from './dto/create-service.dto.js';
import { EventStoreService } from '../../events/store/event-store.service.js';
import { EventType } from '../../events/event-types.js';
import { StripeIntegrationService } from '../billing/stripe-integration.service.js';

@Injectable()
export class ServiceService {
  constructor(
    @InjectRepository(Service) private serviceRepo: Repository<Service>,
    @InjectRepository(Business) private businessRepo: Repository<Business>,
    private eventStore: EventStoreService,
    private stripeIntegrationService: StripeIntegrationService,
  ) {}

  private async assertOnlinePaymentAllowed(
    businessId: string,
    prepaymentMode?: PrepaymentMode,
  ): Promise<void> {
    if (!prepaymentMode || prepaymentMode === PrepaymentMode.NONE) return;

    const business = await this.businessRepo.findOne({ where: { id: businessId } });
    if (!business) throw new NotFoundException('Business not found');

    if (!this.stripeIntegrationService.isConnectReady(business.settings)) {
      throw new BadRequestException(
        'Connect your Stripe account in Dashboard → Billing before enabling online payment for a service',
      );
    }
  }

  async create(businessId: string, dto: CreateServiceDto, userId?: string): Promise<Service> {
    await this.assertOnlinePaymentAllowed(businessId, dto.prepaymentMode);

    const service = await this.serviceRepo.save(
      this.serviceRepo.create({
        ...dto,
        businessId,
        bufferMinutes: dto.bufferMinutes || 0,
        currency: dto.currency || 'USD',
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
    return service;
  }

  async findAll(businessId: string): Promise<Service[]> {
    return this.serviceRepo.find({ where: { businessId, isActive: true }, order: { name: 'ASC' } });
  }

  async findOne(id: string): Promise<Service> {
    const service = await this.serviceRepo.findOne({ where: { id } });
    if (!service) throw new NotFoundException('Service not found');
    return service;
  }

  async update(id: string, dto: UpdateServiceDto, userId?: string): Promise<Service> {
    const service = await this.findOne(id);
    const nextMode = dto.prepaymentMode ?? service.prepaymentMode;
    await this.assertOnlinePaymentAllowed(service.businessId, nextMode);

    Object.assign(service, dto);
    const updated = await this.serviceRepo.save(service);
    await this.eventStore.publish({
      eventType: EventType.SERVICE_UPDATED,
      aggregateType: 'service',
      aggregateId: id,
      businessId: service.businessId,
      payload: dto,
      userId,
    });
    return updated;
  }

  async remove(id: string): Promise<void> {
    await this.serviceRepo.update(id, { isActive: false });
  }
}
