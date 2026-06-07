import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  CLINIC_SPECIMEN_COLLECTION_QUEUE_STATUSES,
  CLINIC_SPECIMEN_TRACKING_QUEUE_STATUSES,
} from '../../../common/utils/clinic-lab-state.util.js';
import { resolveClinicalDepartmentLabel } from '../catalog/clinic-test-catalog.util.js';
import {
  mapClinicSpecimenLabelView,
  ensureClinicSpecimenIdentifier,
} from '../../../common/utils/clinic-specimen-label.util.js';
import type { ClinicSpecimenLabelView } from '../../../common/utils/clinic-specimen-label.util.js';
import { ClinicSpecimen } from '../entities/clinic-specimen.entity.js';
import { ClinicTestOrder } from '../entities/clinic-test-order.entity.js';
import { Business } from '../../business/entities/business.entity.js';
import {
  assertClinicLabFeaturesEnabled,
  readBusinessTypeFromSettings,
} from '../shared/clinic-test-results-gate.util.js';

export type ClinicSpecimenOpsView = 'collection' | 'tracking';

export interface ClinicSpecimenListFilters {
  view?: ClinicSpecimenOpsView;
  status?: string;
  statuses?: string[];
  from?: string;
  to?: string;
  department?: string;
  employeeId?: string;
}

export interface ClinicSpecimenQueueItem {
  id: string;
  status: string;
  specimenIdentifier: string | null;
  orderId: string;
  orderDisplayNames: string | null;
  bookingId: string | null;
  customerName: string | null;
  bookingStartTime: string | null;
  employeeName: string | null;
  department: string | null;
  collectedAt: string | null;
  storageLocationName: string | null;
  transportFolderCode: string | null;
  createdAt: Date;
}

@Injectable()
export class ClinicSpecimenService {
  constructor(
    @InjectRepository(ClinicSpecimen)
    private readonly specimenRepo: Repository<ClinicSpecimen>,
    @InjectRepository(ClinicTestOrder)
    private readonly orderRepo: Repository<ClinicTestOrder>,
    @InjectRepository(Business)
    private readonly businessRepo: Repository<Business>,
  ) {}

  private async assertEnabled(businessId: string): Promise<void> {
    const business = await this.businessRepo.findOne({
      where: { id: businessId },
    });
    if (!business) throw new NotFoundException('Business not found');
    assertClinicLabFeaturesEnabled(
      readBusinessTypeFromSettings(
        business.settings as Record<string, unknown> | undefined,
      ),
    );
  }

  async ensureSpecimenForOrder(
    orderId: string,
  ): Promise<ClinicSpecimen | null> {
    const order = await this.orderRepo.findOne({ where: { id: orderId } });
    if (!order) return null;

    const existing = await this.specimenRepo.findOne({
      where: { businessId: order.businessId, orderId: order.id },
    });
    if (existing) return existing;

    return this.specimenRepo.save(
      this.specimenRepo.create({
        businessId: order.businessId,
        customerId: order.customerId,
        orderId: order.id,
        bookingId: order.bookingId ?? null,
        status: 'NotCollected',
      }),
    );
  }

  private async backfillMissingSpecimens(businessId: string): Promise<void> {
    const orders = await this.orderRepo
      .createQueryBuilder('order')
      .leftJoin('order.specimens', 'specimen')
      .where('order.businessId = :businessId', { businessId })
      .andWhere('specimen.id IS NULL')
      .andWhere('order.status IN (:...statuses)', {
        statuses: ['NotCollected', 'Collecting', 'AwaitingResults'],
      })
      .getMany();

    for (const order of orders) {
      await this.ensureSpecimenForOrder(order.id);
    }
  }

  private resolveStatusesForView(
    filters: ClinicSpecimenListFilters,
  ): string[] | undefined {
    if (filters.statuses?.length) return filters.statuses;
    if (filters.status?.trim()) return [filters.status.trim()];
    if (filters.view === 'collection') {
      return [...CLINIC_SPECIMEN_COLLECTION_QUEUE_STATUSES];
    }
    if (filters.view === 'tracking') {
      return [...CLINIC_SPECIMEN_TRACKING_QUEUE_STATUSES];
    }
    return undefined;
  }

  async listSpecimens(
    businessId: string,
    filters: ClinicSpecimenListFilters = {},
  ): Promise<ClinicSpecimenQueueItem[]> {
    await this.assertEnabled(businessId);
    await this.backfillMissingSpecimens(businessId);

    const statuses = this.resolveStatusesForView(filters);

    const qb = this.specimenRepo
      .createQueryBuilder('specimen')
      .leftJoinAndSelect('specimen.order', 'order')
      .leftJoinAndSelect('order.booking', 'booking')
      .leftJoinAndSelect('booking.customer', 'customer')
      .leftJoinAndSelect('booking.employee', 'employee')
      .leftJoinAndSelect('order.items', 'item')
      .leftJoinAndSelect('item.testType', 'testType')
      .leftJoinAndSelect('testType.service', 'service')
      .leftJoinAndSelect('service.category', 'category')
      .leftJoinAndSelect('specimen.storageLocation', 'storageLocation')
      .leftJoinAndSelect('specimen.transportFolder', 'transportFolder')
      .where('specimen.businessId = :businessId', { businessId });

    if (statuses?.length) {
      qb.andWhere('specimen.status IN (:...statuses)', { statuses });
    }

    if (filters.employeeId?.trim()) {
      qb.andWhere('booking.employeeId = :employeeId', {
        employeeId: filters.employeeId.trim(),
      });
    }

    if (filters.from?.trim()) {
      qb.andWhere('booking.startTime >= :from', { from: filters.from.trim() });
    }

    if (filters.to?.trim()) {
      qb.andWhere('booking.startTime <= :to', { to: filters.to.trim() });
    }

    if (filters.department?.trim()) {
      qb.andWhere('LOWER(category.name) = LOWER(:department)', {
        department: filters.department.trim(),
      });
    }

    qb.orderBy('booking.startTime', 'ASC', 'NULLS LAST').addOrderBy(
      'specimen.createdAt',
      'ASC',
    );

    const specimens = await qb.getMany();

    return specimens.map((specimen) => {
      const department = resolveClinicalDepartmentLabel(
        specimen.order?.items?.[0]?.testType?.service?.category?.name ?? null,
      );
      return {
        id: specimen.id,
        status: specimen.status,
        specimenIdentifier: specimen.specimenIdentifier ?? null,
        orderId: specimen.orderId,
        orderDisplayNames: specimen.order?.displayNames ?? null,
        bookingId: specimen.bookingId ?? null,
        customerName: specimen.order?.booking?.customer?.name ?? null,
        bookingStartTime: specimen.order?.booking?.startTime
          ? specimen.order.booking.startTime.toISOString()
          : null,
        employeeName: specimen.order?.booking?.employee?.name ?? null,
        department,
        collectedAt: specimen.collectedAt?.toISOString() ?? null,
        storageLocationName: specimen.storageLocation?.name ?? null,
        transportFolderCode: specimen.transportFolder?.folderCode ?? null,
        createdAt: specimen.createdAt,
      };
    });
  }

  async getSpecimenForBusiness(
    businessId: string,
    specimenId: string,
  ): Promise<ClinicSpecimen> {
    await this.assertEnabled(businessId);
    const specimen = await this.specimenRepo.findOne({
      where: { id: specimenId, businessId },
    });
    if (!specimen) {
      throw new NotFoundException('Clinic specimen not found');
    }
    return specimen;
  }

  async getSpecimenLabel(
    businessId: string,
    specimenId: string,
  ): Promise<ClinicSpecimenLabelView> {
    await this.assertEnabled(businessId);
    const specimen = await this.specimenRepo.findOne({
      where: { id: specimenId, businessId },
      relations: {
        order: {
          booking: { customer: true },
          items: { testType: { service: { category: true } } },
        },
      },
    });
    if (!specimen) {
      throw new NotFoundException('Clinic specimen not found');
    }

    const nextIdentifier = ensureClinicSpecimenIdentifier(
      specimen.id,
      specimen.specimenIdentifier,
    );
    if (specimen.specimenIdentifier !== nextIdentifier) {
      specimen.specimenIdentifier = nextIdentifier;
      await this.specimenRepo.save(specimen);
    }

    const department = resolveClinicalDepartmentLabel(
      specimen.order?.items?.[0]?.testType?.service?.category?.name ?? null,
    );

    return mapClinicSpecimenLabelView({
      specimenId: specimen.id,
      specimenIdentifier: specimen.specimenIdentifier ?? nextIdentifier,
      status: specimen.status,
      customerName: specimen.order?.booking?.customer?.name ?? null,
      orderDisplayNames: specimen.order?.displayNames ?? null,
      bookingStartTime: specimen.order?.booking?.startTime ?? null,
      department,
      collectedAt: specimen.collectedAt ?? null,
    });
  }
}
