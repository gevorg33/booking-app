import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  extractClinicMetadata,
  isClinicServiceType,
} from '../../../common/utils/clinic-service.util.js';
import {
  Booking,
  BookingStatus,
} from '../../booking/entities/booking.entity.js';
import { Business } from '../../business/entities/business.entity.js';
import { Service } from '../../service/entities/service.entity.js';
import { ClinicTestOrder } from '../entities/clinic-test-order.entity.js';
import { ClinicTestOrderItem } from '../entities/clinic-test-order-item.entity.js';
import { ClinicTestOrderStatusHistory } from '../entities/clinic-test-order-status-history.entity.js';
import { ClinicTestType } from '../entities/clinic-test-type.entity.js';
import {
  readClinicTestTypeIdFromServiceMetadata,
  resolveClinicalDepartmentLabel,
} from '../catalog/clinic-test-catalog.util.js';
import {
  assertClinicLabFeaturesEnabled,
  readBusinessTypeFromSettings,
} from '../shared/clinic-test-results-gate.util.js';
import { ClinicLabPhiService } from '../shared/clinic-lab-phi.service.js';
import { ClinicSpecimenService } from '../specimen/clinic-specimen.service.js';
import { isClinicLabBookingRequestPending } from '../../../common/utils/clinic-lab-booking-request.util.js';
import { ClinicTestResultService } from '../test-result/clinic-test-result.service.js';

export interface ClinicTestOrderView {
  id: string;
  businessId: string;
  bookingId: string | null;
  customerId: string;
  employeeId: string | null;
  status: string;
  displayNames: string | null;
  testTypeId: string | null;
  createdAt: Date;
}

export interface ClinicLabQueueFilters {
  status?: string;
  statuses?: string[];
  from?: string;
  to?: string;
  department?: string;
  employeeId?: string;
  customerId?: string;
  awaitingPatientBooking?: boolean;
  sort?: 'createdDesc' | 'bookingTimeAsc';
}

export interface ClinicLabQueueItem {
  id: string;
  status: string;
  displayNames: string | null;
  department: string | null;
  bookingId: string | null;
  visitBookingId: string | null;
  collectionBookingId: string | null;
  customerName: string | null;
  bookingStartTime: string | null;
  visitBookingStartTime: string | null;
  collectionBookingStartTime: string | null;
  bookingRequestPushedAt: string | null;
  awaitingPatientBooking: boolean;
  employeeName: string | null;
  createdAt: Date;
}

export interface ClinicPatientChartOrderView {
  id: string;
  bookingId: string | null;
  status: string;
  displayNames: string | null;
  createdAt: string;
}

export interface CreateClinicCatalogOrderItemInput {
  type: 'test_type' | 'test_panel';
  testTypeId?: string | null;
  testPanelId?: string | null;
  label: string;
}

@Injectable()
export class ClinicTestOrderService {
  constructor(
    @InjectRepository(Booking)
    private readonly bookingRepo: Repository<Booking>,
    @InjectRepository(Business)
    private readonly businessRepo: Repository<Business>,
    @InjectRepository(Service)
    private readonly serviceRepo: Repository<Service>,
    @InjectRepository(ClinicTestOrder)
    private readonly orderRepo: Repository<ClinicTestOrder>,
    @InjectRepository(ClinicTestOrderItem)
    private readonly orderItemRepo: Repository<ClinicTestOrderItem>,
    @InjectRepository(ClinicTestOrderStatusHistory)
    private readonly orderHistoryRepo: Repository<ClinicTestOrderStatusHistory>,
    @InjectRepository(ClinicTestType)
    private readonly testTypeRepo: Repository<ClinicTestType>,
    private readonly clinicLabPhiService: ClinicLabPhiService,
    private readonly clinicSpecimenService: ClinicSpecimenService,
    private readonly clinicTestResultService: ClinicTestResultService,
  ) {}

  private mapOrder(
    order: ClinicTestOrder,
    testTypeId?: string | null,
  ): ClinicTestOrderView {
    return {
      id: order.id,
      businessId: order.businessId,
      bookingId: order.bookingId ?? null,
      customerId: order.customerId,
      employeeId: order.employeeId ?? null,
      status: order.status,
      displayNames: order.displayNames ?? null,
      testTypeId: testTypeId ?? null,
      createdAt: order.createdAt,
    };
  }

  private async resolveTestTypeForService(
    businessId: string,
    service: Service,
  ): Promise<ClinicTestType | null> {
    const linkedId = readClinicTestTypeIdFromServiceMetadata(service.metadata);
    if (linkedId) {
      const byMetadata = await this.testTypeRepo.findOne({
        where: { id: linkedId, businessId, isActive: true },
      });
      if (byMetadata) return byMetadata;
    }

    return this.testTypeRepo.findOne({
      where: { businessId, serviceId: service.id, isActive: true },
    });
  }

  async maybeCreateOrderForBooking(
    bookingId: string,
  ): Promise<ClinicTestOrder | null> {
    const booking = await this.bookingRepo.findOne({
      where: { id: bookingId },
      relations: { service: true },
    });
    if (!booking?.customerId) return null;
    if (booking.status !== BookingStatus.CONFIRMED) return null;

    const business = await this.businessRepo.findOne({
      where: { id: booking.businessId },
    });
    if (!business) return null;

    const businessType = readBusinessTypeFromSettings(
      business.settings as Record<string, unknown> | undefined,
    );
    try {
      assertClinicLabFeaturesEnabled(businessType);
    } catch {
      return null;
    }

    const service =
      booking.service ??
      (await this.serviceRepo.findOne({
        where: { id: booking.serviceId, businessId: booking.businessId },
      }));
    if (!service) return null;

    const clinicMeta = extractClinicMetadata(service.metadata);
    if (!clinicMeta || clinicMeta.serviceType !== 'lab_test') return null;

    const existing = await this.orderRepo.findOne({
      where: { businessId: booking.businessId, bookingId: booking.id },
    });
    if (existing) {
      await this.clinicSpecimenService.ensureSpecimenForOrder(existing.id);
      await this.clinicTestResultService.ensureResultForOrder(existing.id);
      return existing;
    }

    const testType = await this.resolveTestTypeForService(
      booking.businessId,
      service,
    );

    const order = await this.orderRepo.save(
      this.orderRepo.create({
        businessId: booking.businessId,
        customerId: booking.customerId,
        bookingId: booking.id,
        employeeId: booking.employeeId,
        displayNames: testType?.title ?? service.name,
        status: 'NotCollected',
      }),
    );

    await this.orderItemRepo.save(
      this.orderItemRepo.create({
        orderId: order.id,
        type: 'test_type',
        testTypeId: testType?.id ?? null,
      }),
    );

    const historyNote =
      await this.clinicLabPhiService.encryptStatusHistoryNoteForStorage(
        business,
        'Auto-created from lab_test booking',
      );
    await this.orderHistoryRepo.save(
      this.orderHistoryRepo.create({
        orderId: order.id,
        status: 'NotCollected',
        previousStatus: null,
        employeeId: booking.employeeId ?? null,
        note: historyNote ?? null,
      }),
    );

    await this.clinicSpecimenService.ensureSpecimenForOrder(order.id);
    await this.clinicTestResultService.ensureResultForOrder(order.id);

    return order;
  }

  async createManualOrderForBooking(
    businessId: string,
    bookingId: string,
  ): Promise<ClinicTestOrderView> {
    const business = await this.businessRepo.findOne({
      where: { id: businessId },
    });
    if (!business) throw new NotFoundException('Business not found');
    assertClinicLabFeaturesEnabled(
      readBusinessTypeFromSettings(
        business.settings as Record<string, unknown> | undefined,
      ),
    );

    const booking = await this.bookingRepo.findOne({
      where: { id: bookingId, businessId },
      relations: { service: true },
    });
    if (!booking) throw new NotFoundException('Booking not found');
    if (!booking.customerId) {
      throw new BadRequestException(
        'Booking must have a customer to create a lab order',
      );
    }

    const service =
      booking.service ??
      (await this.serviceRepo.findOne({
        where: { id: booking.serviceId, businessId },
      }));
    if (!service) throw new NotFoundException('Service not found');

    const clinicMeta = extractClinicMetadata(service.metadata);
    if (!clinicMeta || !isClinicServiceType(clinicMeta.serviceType)) {
      throw new BadRequestException(
        'Lab orders can only be created for clinic consultation, lab_test, or procedure services',
      );
    }

    const existing = await this.orderRepo.findOne({
      where: { businessId, bookingId },
      relations: { items: true },
    });
    if (existing) {
      const testTypeId = existing.items?.[0]?.testTypeId ?? null;
      return this.mapOrder(existing, testTypeId);
    }

    if (booking.status !== BookingStatus.CONFIRMED) {
      throw new BadRequestException(
        'Booking must be confirmed before creating a lab order',
      );
    }

    const created = await this.maybeCreateOrderForBooking(bookingId);
    if (!created) {
      throw new BadRequestException(
        'Unable to create lab order for this booking',
      );
    }

    const withItems = await this.orderRepo.findOne({
      where: { id: created.id },
      relations: { items: true },
    });
    return this.mapOrder(withItems!, withItems?.items?.[0]?.testTypeId ?? null);
  }

  async createCatalogOrderForBooking(
    businessId: string,
    bookingId: string,
    items: CreateClinicCatalogOrderItemInput[],
  ): Promise<ClinicTestOrderView> {
    if (!items.length) {
      throw new BadRequestException(
        'At least one catalog test item is required',
      );
    }

    const business = await this.businessRepo.findOne({
      where: { id: businessId },
    });
    if (!business) throw new NotFoundException('Business not found');
    assertClinicLabFeaturesEnabled(
      readBusinessTypeFromSettings(
        business.settings as Record<string, unknown> | undefined,
      ),
    );

    const booking = await this.bookingRepo.findOne({
      where: { id: bookingId, businessId },
    });
    if (!booking) throw new NotFoundException('Booking not found');
    if (!booking.customerId) {
      throw new BadRequestException(
        'Booking must have a customer to create a lab order',
      );
    }
    if (booking.status !== BookingStatus.CONFIRMED) {
      throw new BadRequestException(
        'Booking must be confirmed before creating a lab order',
      );
    }

    const displayNames = items
      .map((item) => item.label)
      .join(', ')
      .slice(0, 512);
    const order = await this.orderRepo.save(
      this.orderRepo.create({
        businessId,
        customerId: booking.customerId,
        bookingId: booking.id,
        employeeId: booking.employeeId,
        displayNames,
        status: 'NotCollected',
      }),
    );

    await this.orderItemRepo.save(
      items.map((item) =>
        this.orderItemRepo.create({
          orderId: order.id,
          type: item.type,
          testTypeId:
            item.type === 'test_type' ? (item.testTypeId ?? null) : null,
          testPanelId:
            item.type === 'test_panel' ? (item.testPanelId ?? null) : null,
        }),
      ),
    );

    const historyNote =
      await this.clinicLabPhiService.encryptStatusHistoryNoteForStorage(
        business,
        'Manual catalog lab order',
      );
    await this.orderHistoryRepo.save(
      this.orderHistoryRepo.create({
        orderId: order.id,
        status: 'NotCollected',
        previousStatus: null,
        employeeId: booking.employeeId ?? null,
        note: historyNote ?? null,
      }),
    );

    await this.clinicSpecimenService.ensureSpecimenForOrder(order.id);
    await this.clinicTestResultService.ensureResultForOrder(order.id);

    const withItems = await this.orderRepo.findOne({
      where: { id: order.id },
      relations: { items: true },
    });
    return this.mapOrder(
      withItems ?? order,
      withItems?.items?.[0]?.testTypeId ?? null,
    );
  }

  async listOrdersForBooking(
    businessId: string,
    bookingId: string,
  ): Promise<ClinicTestOrderView[]> {
    const business = await this.businessRepo.findOne({
      where: { id: businessId },
    });
    if (!business) throw new NotFoundException('Business not found');
    assertClinicLabFeaturesEnabled(
      readBusinessTypeFromSettings(
        business.settings as Record<string, unknown> | undefined,
      ),
    );

    const orders = await this.orderRepo.find({
      where: { businessId, bookingId },
      relations: { items: true },
      order: { createdAt: 'ASC' },
    });

    return orders.map((order) =>
      this.mapOrder(order, order.items?.[0]?.testTypeId ?? null),
    );
  }

  async listLabQueue(
    businessId: string,
    filters: ClinicLabQueueFilters = {},
  ): Promise<ClinicLabQueueItem[]> {
    const business = await this.businessRepo.findOne({
      where: { id: businessId },
    });
    if (!business) throw new NotFoundException('Business not found');
    assertClinicLabFeaturesEnabled(
      readBusinessTypeFromSettings(
        business.settings as Record<string, unknown> | undefined,
      ),
    );

    const qb = this.orderRepo
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.booking', 'booking')
      .leftJoinAndSelect('order.collectionBooking', 'collectionBooking')
      .leftJoinAndSelect('booking.customer', 'customer')
      .leftJoinAndSelect('booking.employee', 'employee')
      .leftJoinAndSelect('collectionBooking.employee', 'collectionEmployee')
      .leftJoinAndSelect('order.items', 'item')
      .leftJoinAndSelect('item.testType', 'testType')
      .leftJoinAndSelect('testType.service', 'service')
      .leftJoinAndSelect('service.category', 'category')
      .where('order.businessId = :businessId', { businessId });

    if (filters.statuses?.length) {
      qb.andWhere('order.status IN (:...statuses)', {
        statuses: filters.statuses,
      });
    } else if (filters.status?.trim()) {
      qb.andWhere('order.status = :status', { status: filters.status.trim() });
    }

    if (filters.employeeId?.trim()) {
      qb.andWhere('booking.employeeId = :employeeId', {
        employeeId: filters.employeeId.trim(),
      });
    }

    if (filters.customerId?.trim()) {
      qb.andWhere('booking.customerId = :customerId', {
        customerId: filters.customerId.trim(),
      });
    }

    const sort = filters.sort ?? 'createdDesc';
    if (sort === 'bookingTimeAsc') {
      qb.orderBy(
        'COALESCE(collectionBooking.startTime, booking.startTime)',
        'ASC',
        'NULLS LAST',
      ).addOrderBy('order.createdAt', 'ASC');
    } else {
      qb.orderBy('order.createdAt', 'DESC');
    }

    if (filters.from?.trim()) {
      qb.andWhere(
        'COALESCE(collectionBooking.startTime, booking.startTime) >= :from',
        { from: filters.from.trim() },
      );
    }

    if (filters.to?.trim()) {
      qb.andWhere(
        'COALESCE(collectionBooking.startTime, booking.startTime) <= :to',
        { to: filters.to.trim() },
      );
    }

    if (filters.department?.trim()) {
      qb.andWhere('LOWER(category.name) = LOWER(:department)', {
        department: filters.department.trim(),
      });
    }

    if (filters.awaitingPatientBooking) {
      qb.andWhere('order.bookingRequestPushedAt IS NOT NULL');
      qb.andWhere('order.collectionBookingId IS NULL');
      qb.andWhere('order.status NOT IN (:...excludedStatuses)', {
        excludedStatuses: ['Cancelled', 'Completed'],
      });
    }

    const orders = await qb.getMany();

    return orders.map((order) => {
      const department = resolveClinicalDepartmentLabel(
        order.items?.[0]?.testType?.service?.category?.name ?? null,
      );
      const scheduleBooking = order.collectionBooking ?? order.booking;
      const awaitingPatientBooking = isClinicLabBookingRequestPending({
        status: order.status,
        bookingRequestPushedAt: order.bookingRequestPushedAt,
        collectionBookingId: order.collectionBookingId,
      });
      return {
        id: order.id,
        status: order.status,
        displayNames: order.displayNames ?? null,
        department,
        bookingId: order.collectionBookingId ?? order.bookingId ?? null,
        visitBookingId: order.bookingId ?? null,
        collectionBookingId: order.collectionBookingId ?? null,
        customerName: order.booking?.customer?.name ?? null,
        bookingStartTime: scheduleBooking?.startTime
          ? scheduleBooking.startTime.toISOString()
          : null,
        visitBookingStartTime: order.booking?.startTime
          ? order.booking.startTime.toISOString()
          : null,
        collectionBookingStartTime: order.collectionBooking?.startTime
          ? order.collectionBooking.startTime.toISOString()
          : null,
        bookingRequestPushedAt: order.bookingRequestPushedAt
          ? order.bookingRequestPushedAt.toISOString()
          : null,
        awaitingPatientBooking,
        employeeName:
          order.collectionBooking?.employee?.name ??
          order.booking?.employee?.name ??
          null,
        createdAt: order.createdAt,
      };
    });
  }

  async listOrdersForCustomer(
    businessId: string,
    customerId: string,
  ): Promise<ClinicPatientChartOrderView[]> {
    const business = await this.businessRepo.findOne({
      where: { id: businessId },
    });
    if (!business) throw new NotFoundException('Business not found');
    assertClinicLabFeaturesEnabled(
      readBusinessTypeFromSettings(
        business.settings as Record<string, unknown> | undefined,
      ),
    );

    const orders = await this.orderRepo.find({
      where: { businessId, customerId },
      order: { createdAt: 'DESC' },
      take: 100,
    });

    return orders.map((order) => ({
      id: order.id,
      bookingId: order.bookingId ?? null,
      status: order.status,
      displayNames: order.displayNames ?? null,
      createdAt: order.createdAt.toISOString(),
    }));
  }
}
