import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, EntityManager, In } from 'typeorm';
import {
  SchedulingResource,
  ServiceResourceRequirement,
  BookingResource,
} from './entities/scheduling-resource.entity.js';
import { Booking, BookingStatus } from '../booking/entities/booking.entity.js';
import { Service } from '../service/entities/service.entity.js';
import {
  findResourceConflicts,
  type ResourceBookingWindow,
} from '../../common/utils/resource-scheduling.util.js';

@Injectable()
export class SchedulingResourcesService {
  constructor(
    @InjectRepository(SchedulingResource)
    private resourceRepo: Repository<SchedulingResource>,
    @InjectRepository(ServiceResourceRequirement)
    private requirementRepo: Repository<ServiceResourceRequirement>,
    @InjectRepository(BookingResource)
    private bookingResourceRepo: Repository<BookingResource>,
    @InjectRepository(Booking)
    private bookingRepo: Repository<Booking>,
    @InjectRepository(Service)
    private serviceRepo: Repository<Service>,
  ) {}

  async listResources(businessId: string) {
    return this.resourceRepo.find({
      where: { businessId, isActive: true },
      order: { name: 'ASC' },
    });
  }

  async createResource(
    businessId: string,
    dto: {
      name: string;
      resourceType?: string;
      locationId?: string | null;
    },
  ) {
    const resource = this.resourceRepo.create({
      businessId,
      name: dto.name.trim(),
      resourceType: dto.resourceType ?? 'room',
      locationId: dto.locationId ?? null,
      isActive: true,
    });
    return this.resourceRepo.save(resource);
  }

  async updateResource(
    businessId: string,
    resourceId: string,
    dto: Partial<{
      name: string;
      resourceType: string;
      locationId: string | null;
      isActive: boolean;
    }>,
  ) {
    const resource = await this.resourceRepo.findOne({
      where: { id: resourceId, businessId },
    });
    if (!resource) throw new NotFoundException('Resource not found');
    Object.assign(resource, dto);
    return this.resourceRepo.save(resource);
  }

  async deactivateResource(businessId: string, resourceId: string) {
    return this.updateResource(businessId, resourceId, { isActive: false });
  }

  async getServiceRequirements(businessId: string, serviceId: string) {
    await this.assertService(businessId, serviceId);
    return this.requirementRepo.find({
      where: { businessId, serviceId },
      relations: { resource: true },
    });
  }

  async setServiceRequirements(
    businessId: string,
    serviceId: string,
    resourceIds: string[],
  ) {
    await this.assertService(businessId, serviceId);
    const uniqueIds = [...new Set(resourceIds)];
    if (uniqueIds.length > 0) {
      const resources = await this.resourceRepo.find({
        where: { id: In(uniqueIds), businessId, isActive: true },
      });
      if (resources.length !== uniqueIds.length) {
        throw new BadRequestException('One or more resources are invalid');
      }
    }

    await this.requirementRepo.delete({ businessId, serviceId });
    if (uniqueIds.length === 0) return [];

    const rows = uniqueIds.map((resourceId) =>
      this.requirementRepo.create({
        businessId,
        serviceId,
        resourceId,
        quantity: 1,
      }),
    );
    return this.requirementRepo.save(rows);
  }

  async getRequiredResourceIds(
    businessId: string,
    serviceId: string,
  ): Promise<string[]> {
    const reqs = await this.requirementRepo.find({
      where: { businessId, serviceId },
    });
    return reqs.map((r) => r.resourceId);
  }

  async assertResourcesAvailable(
    businessId: string,
    resourceIds: string[],
    startTime: Date,
    endTime: Date,
    excludeBookingId?: string,
  ) {
    if (resourceIds.length === 0) return;

    const resources = await this.resourceRepo.find({
      where: { id: In(resourceIds), businessId, isActive: true },
    });
    if (resources.length !== resourceIds.length) {
      throw new BadRequestException(
        'One or more resources are invalid or inactive',
      );
    }

    const conflicts = await this.findConflictingResourceIds(
      businessId,
      resourceIds,
      startTime,
      endTime,
      excludeBookingId,
    );
    if (conflicts.length > 0) {
      const names = resources
        .filter((r) => conflicts.includes(r.id))
        .map((r) => r.name);
      throw new ConflictException(
        `Resource${names.length > 1 ? 's' : ''} unavailable: ${names.join(', ')}`,
      );
    }
  }

  async findConflictingResourceIds(
    businessId: string,
    resourceIds: string[],
    startTime: Date,
    endTime: Date,
    excludeBookingId?: string,
  ): Promise<string[]> {
    const qb = this.bookingResourceRepo
      .createQueryBuilder('br')
      .innerJoin('bookings', 'booking', 'booking.id = br.booking_id')
      .where('br.resource_id IN (:...resourceIds)', { resourceIds })
      .andWhere('booking.business_id = :businessId', { businessId })
      .andWhere('booking.status != :cancelled', {
        cancelled: BookingStatus.CANCELLED,
      })
      .andWhere('booking.startTime < :endTime', { endTime })
      .andWhere('booking.endTime > :startTime', { startTime });

    if (excludeBookingId) {
      qb.andWhere('booking.id != :excludeBookingId', { excludeBookingId });
    }

    const rows = await qb
      .select('br.resource_id', 'resourceId')
      .addSelect('booking.id', 'bookingId')
      .addSelect('booking.startTime', 'startTime')
      .addSelect('booking.endTime', 'endTime')
      .getRawMany<{
        resourceId: string;
        bookingId: string;
        startTime: Date;
        endTime: Date;
      }>();

    const existing: ResourceBookingWindow[] = rows.map((row) => ({
      resourceIds: [row.resourceId],
      bookingId: row.bookingId,
      startTime: row.startTime,
      endTime: row.endTime,
    }));

    return findResourceConflicts(existing, {
      resourceIds,
      startTime,
      endTime,
      bookingId: excludeBookingId,
    });
  }

  async assignToBooking(
    manager: EntityManager,
    bookingId: string,
    resourceIds: string[],
  ) {
    const uniqueIds = [...new Set(resourceIds)];
    for (const resourceId of uniqueIds) {
      const row = manager.create(BookingResource, { bookingId, resourceId });
      await manager.save(BookingResource, row);
    }
  }

  async getBookingResources(bookingId: string) {
    return this.bookingResourceRepo.find({
      where: { bookingId },
      relations: { resource: true },
    });
  }

  async releaseBookingResources(bookingId: string) {
    await this.bookingResourceRepo.delete({ bookingId });
  }

  private async assertService(businessId: string, serviceId: string) {
    const service = await this.serviceRepo.findOne({
      where: { id: serviceId, businessId },
    });
    if (!service) throw new NotFoundException('Service not found');
    return service;
  }
}
