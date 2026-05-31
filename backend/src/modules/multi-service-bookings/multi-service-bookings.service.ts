import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Business } from '../business/entities/business.entity.js';
import { Service } from '../service/entities/service.entity.js';
import {
  MultiServiceBookingGroup,
  type MultiServiceSchedulingMode,
} from './entities/multi-service-booking-group.entity.js';
import { UpdateMultiServiceSettingsDto } from './dto/update-multi-service-settings.dto.js';
import {
  applyMultiServiceSettingsToBusinessSettings,
  mergeMultiServiceSettingsPatch,
  resolveMultiServiceSettings,
  type MultiServiceSettings,
} from '../../common/utils/multi-service-settings.util.js';
import {
  type MultiServiceLineInput,
  validateMultiServiceSelection,
} from '../../common/utils/multi-service-booking.util.js';

@Injectable()
export class MultiServiceBookingsService {
  constructor(
    @InjectRepository(MultiServiceBookingGroup)
    private groupRepo: Repository<MultiServiceBookingGroup>,
    @InjectRepository(Business) private businessRepo: Repository<Business>,
    @InjectRepository(Service) private serviceRepo: Repository<Service>,
  ) {}

  async getSettings(businessId: string): Promise<MultiServiceSettings> {
    return this.resolveSettingsForBusiness(businessId);
  }

  async updateSettings(
    businessId: string,
    dto: UpdateMultiServiceSettingsDto,
  ): Promise<MultiServiceSettings> {
    const business = await this.businessRepo.findOne({ where: { id: businessId } });
    if (!business) throw new NotFoundException('Business not found');

    const current = resolveMultiServiceSettings(business.settings);
    const next = mergeMultiServiceSettingsPatch(current, {
      ...dto,
      incompatiblePairMode: dto.incompatiblePairMode ?? current.incompatiblePairMode,
      incompatiblePairs: dto.incompatiblePairs ?? current.incompatiblePairs,
      incompatibleCategoryPairs:
        dto.incompatibleCategoryPairs ?? current.incompatibleCategoryPairs,
    });

    business.settings = applyMultiServiceSettingsToBusinessSettings(
      business.settings ?? {},
      next,
    );
    await this.businessRepo.save(business);
    return next;
  }

  async loadServicesForSelection(
    businessId: string,
    serviceIds: string[],
  ): Promise<MultiServiceLineInput[]> {
    if (!serviceIds.length) return [];
    const services = await this.serviceRepo.find({
      where: { businessId, id: In(serviceIds), isActive: true },
    });
    return services.map((svc) => ({
      serviceId: svc.id,
      durationMinutes: svc.durationMinutes,
      bufferMinutes: svc.bufferMinutes,
      price: Number(svc.price),
      currency: svc.currency || 'USD',
      name: svc.name,
      categoryId: svc.categoryId,
    }));
  }

  async validateSelection(businessId: string, serviceIds: string[]) {
    const settings = await this.resolveSettingsForBusiness(businessId);
    if (!settings.enabled) {
      throw new BadRequestException('Multi-service booking is not enabled for this business');
    }
    const services = await this.loadServicesForSelection(businessId, serviceIds);
    return validateMultiServiceSelection(serviceIds, services, settings);
  }

  async previewTotals(businessId: string, serviceIds: string[]) {
    const validation = await this.validateSelection(businessId, serviceIds);
    if (!validation.valid || !validation.totals) {
      throw new BadRequestException(validation.errors[0] ?? 'Invalid service selection');
    }
    const services = await this.loadServicesForSelection(businessId, serviceIds);
    const currency = services[0]?.currency ?? 'USD';
    return {
      ...validation,
      services: services.map((svc) => ({
        serviceId: svc.serviceId,
        name: svc.name,
        durationMinutes: svc.durationMinutes,
        bufferMinutes: svc.bufferMinutes,
        price: svc.price,
      })),
      totals: validation.totals ? { ...validation.totals, currency } : null,
    };
  }

  async createGroup(input: {
    businessId: string;
    customerId: string;
    schedulingMode: MultiServiceSchedulingMode;
    totals: { blockDurationMinutes: number; totalPrice: number; currency: string };
    blockStartTime?: Date | null;
    primaryEmployeeId?: string | null;
    metadata?: Record<string, unknown>;
  }) {
    return this.groupRepo.save(
      this.groupRepo.create({
        businessId: input.businessId,
        customerId: input.customerId,
        schedulingMode: input.schedulingMode,
        totalDurationMinutes: input.totals.blockDurationMinutes,
        totalPrice: input.totals.totalPrice,
        currency: input.totals.currency,
        blockStartTime: input.blockStartTime ?? null,
        primaryEmployeeId: input.primaryEmployeeId ?? null,
        metadata: input.metadata ?? {},
      }),
    );
  }

  resolveSettingsFromBusiness(business: Business): MultiServiceSettings {
    return resolveMultiServiceSettings(business.settings);
  }

  private async resolveSettingsForBusiness(businessId: string): Promise<MultiServiceSettings> {
    const business = await this.businessRepo.findOne({ where: { id: businessId } });
    if (!business) throw new NotFoundException('Business not found');
    return resolveMultiServiceSettings(business.settings);
  }
}
