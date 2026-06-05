import { Injectable, NotFoundException, ConflictException, BadRequestException, Logger } from '@nestjs/common';
import {
  formatBookingOverlapConflict,
  formatBookingWindowFullyBooked,
} from '../../common/utils/booking-conflict-messages.util.js';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, Not, In, DataSource, EntityManager } from 'typeorm';
import { Booking, BookingStatus, PaymentStatus } from './entities/booking.entity.js';
import { SchedulingSlot, SlotStatus } from '../schedule/entities/scheduling-slot.entity.js';
import { SchedulingPeriod } from '../schedule/entities/scheduling-period.entity.js';
import { TemplatePeriodType } from '../schedule/entities/scheduling-template-period.entity.js';
import { SchedulingEngineService } from '../../engine/scheduling/scheduling-engine.service.js';
import { CreateBookingDto, UpdateBookingDto, GetAvailabilityDto } from './dto/create-booking.dto.js';
import {
  GetBookingsQueryDto,
  parseBookingStatusFilter,
} from './dto/get-bookings-query.dto.js';
import { Service, PrepaymentMode } from '../service/entities/service.entity.js';
import { Employee } from '../employee/entities/employee.entity.js';
import { Customer } from '../customer/entities/customer.entity.js';
import { Business } from '../business/entities/business.entity.js';
import { EventStoreService } from '../../events/store/event-store.service.js';
import { EventType } from '../../events/event-types.js';
import { pickTimezone, isWallClockStartInPast } from '../../common/utils/timezone.util.js';
import { LoyaltyAwardService } from '../loyalty/loyalty-award.service.js';
import { SchedulingResourcesService } from '../resources/scheduling-resources.service.js';
import { ServiceSubscriptionsService } from '../service-subscriptions/service-subscriptions.service.js';
import { MultiServiceBookingGroup } from '../multi-service-bookings/entities/multi-service-booking-group.entity.js';
import { buildSequentialAppointments } from '../../common/utils/multi-service-booking.util.js';
import { resolveMultiServiceSettings } from '../../common/utils/multi-service-settings.util.js';

export interface AppointmentListItem {
  id: string;
  startTime: string;
  endTime: string;
  status: BookingStatus;
  paymentStatus: PaymentStatus;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  customer: { id: string; name: string; email: string | null; phone: string | null } | null;
  employee: { id: string; name: string } | null;
  service: { id: string; name: string; price?: number; currency?: string } | null;
}

export interface AppointmentsSearchResult {
  totalItems: number;
  page: number;
  pageSize: number;
  appointments: AppointmentListItem[];
}

export interface SameVisitBlockRescheduleSegment {
  bookingId: string;
  startTime: string;
  employeeId: string;
  metadata?: Record<string, unknown>;
  expectedUpdatedAt?: string;
}

@Injectable()
export class BookingService {
  private readonly logger = new Logger(BookingService.name);

  constructor(
    @InjectRepository(Booking) private bookingRepo: Repository<Booking>,
    @InjectRepository(SchedulingSlot) private slotRepo: Repository<SchedulingSlot>,
    @InjectRepository(SchedulingPeriod) private schedulingPeriodRepo: Repository<SchedulingPeriod>,
    @InjectRepository(Service) private serviceRepo: Repository<Service>,
    @InjectRepository(Customer) private customerRepo: Repository<Customer>,
    @InjectRepository(Business) private businessRepo: Repository<Business>,
    @InjectRepository(Employee) private employeeRepo: Repository<Employee>,
    @InjectRepository(MultiServiceBookingGroup)
    private multiServiceGroupRepo: Repository<MultiServiceBookingGroup>,
    private schedulingEngine: SchedulingEngineService,
    private eventStore: EventStoreService,
    private dataSource: DataSource,
    private loyaltyAwardService: LoyaltyAwardService,
    private resourcesService: SchedulingResourcesService,
    private subscriptionsService: ServiceSubscriptionsService,
  ) {}

  async getAvailability(businessId: string, dto: GetAvailabilityDto) {
    const date = new Date(dto.date);
    const dayStart = new Date(date);
    dayStart.setUTCHours(0, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setUTCHours(23, 59, 59, 999);

    const qb = this.slotRepo
      .createQueryBuilder('slot')
      .leftJoinAndSelect('slot.employee', 'employee')
      .leftJoinAndSelect('slot.service', 'service')
      .where('slot.business_id = :businessId', { businessId })
      .andWhere('slot.startTime >= :dayStart', { dayStart })
      .andWhere('slot.startTime <= :dayEnd', { dayEnd })
      .andWhere('slot.status = :status', { status: SlotStatus.AVAILABLE })
      .andWhere('slot.appointmentCount < slot.maxAppointmentCount');

    if (dto.employeeId) {
      qb.andWhere('slot.employee_id = :employeeId', { employeeId: dto.employeeId });
    }
    if (dto.serviceId) {
      qb.andWhere(this.serviceMatchClause(), { serviceId: dto.serviceId });
    }

    qb.orderBy('slot.startTime', 'ASC');

    const slots = await qb.getMany();

    if (slots.length > 0) {
      return {
        date: dto.date,
        slots: slots.map((s) => ({
          slotId: s.id,
          startTime: s.startTime,
          endTime: s.endTime,
          employeeId: s.employeeId,
          employeeName: s.employee?.name,
          serviceId: s.serviceId,
          serviceIds: s.serviceIds ?? [],
          availableCount: s.maxAppointmentCount - s.appointmentCount,
          placeholderLabel: s.placeholderLabel,
        })),
      };
    }

    const engineSlots = await this.schedulingEngine.getAvailableSlots({
      businessId,
      serviceId: dto.serviceId,
      date,
      employeeId: dto.employeeId,
    });

    return {
      date: dto.date,
      slots: engineSlots.map((s) => ({
        slotId: null,
        startTime: s.startTime,
        endTime: s.endTime,
        employeeId: s.employeeId,
        employeeName: s.employeeName,
        serviceId: dto.serviceId,
        serviceIds: [],
        availableCount: 1,
      })),
    };
  }

  async create(
    businessId: string,
    dto: CreateBookingDto,
    userId?: string,
    options?: { paymentStatus?: PaymentStatus; sameVisitMultiService?: boolean },
  ): Promise<Booking> {
    const service = await this.serviceRepo.findOne({ where: { id: dto.serviceId, businessId } });
    if (!service) throw new NotFoundException('Service not found');

    const startTime = new Date(dto.startTime);
    const totalDuration = service.durationMinutes + service.bufferMinutes;
    const endTime = new Date(startTime.getTime() + totalDuration * 60000);

    const business = await this.businessRepo.findOne({
      where: { id: businessId },
      select: { timezone: true },
    });
    const timeZone = pickTimezone(business?.timezone);
    if (isWallClockStartInPast(startTime, timeZone)) {
      throw new ConflictException('Cannot book in the past');
    }

    if (dto.customerId) {
      const customer = await this.customerRepo.findOne({
        where: { id: dto.customerId, businessId, isActive: true },
      });
      if (!customer) {
        throw new NotFoundException('Customer not found');
      }
    }

    await this.validateEmployeeCanPerformService(businessId, dto.employeeId, dto.serviceId);

    if (dto.customerId) {
      const existingBooking = await this.bookingRepo.findOne({
        where: {
          customerId: dto.customerId,
          businessId,
          status: Not(In([BookingStatus.CANCELLED])) as any,
          startTime: Between(
            new Date(startTime.getTime() - 60000),
            new Date(startTime.getTime() + 60000),
          ) as any,
        },
      });
      if (existingBooking) {
        throw new ConflictException('Customer already has a booking at this time');
      }
    }

    // Free any stuck micro-slots when no active booking occupies this window
    await this.reconcileStuckSlotsInWindow(businessId, dto.employeeId, startTime, endTime);

    // Same-visit multi-service: the full block is validated once before creating siblings.
    if (!options?.sameVisitMultiService) {
      await this.validateBookingWindow(businessId, dto.employeeId, startTime, endTime, dto.serviceId);
    }

    const requiredResourceIds = await this.resourcesService.getRequiredResourceIds(
      businessId,
      dto.serviceId,
    );
    const resourceIds =
      dto.resourceIds && dto.resourceIds.length > 0 ? dto.resourceIds : requiredResourceIds;
    if (resourceIds.length > 0) {
      await this.resourcesService.assertResourcesAvailable(
        businessId,
        resourceIds,
        startTime,
        endTime,
      );
    }

    const useSubscriptionId = dto.useSubscriptionId;
    if (useSubscriptionId) {
      if (!dto.customerId) {
        throw new BadRequestException('Customer is required when using a subscription');
      }
      await this.subscriptionsService.assertCanConsume(
        businessId,
        useSubscriptionId,
        dto.customerId,
        dto.serviceId,
      );
    }

    // Same-visit segments may reuse generic micro-slots not tagged for every service id.
    const slotServiceFilter = options?.sameVisitMultiService ? undefined : dto.serviceId;
    const slotsToLock = await this.findSlotsInWindow(
      businessId,
      dto.employeeId,
      startTime,
      endTime,
      slotServiceFilter,
    );

    const booking = await this.dataSource.transaction(async (manager) => {
      if (slotsToLock.length > 0) {
        // Lock ALL micro-slots in the booking window (clinic-app pattern)
        for (const slot of slotsToLock) {
          slot.appointmentCount += 1;
          if (slot.appointmentCount >= slot.maxAppointmentCount) {
            slot.status = SlotStatus.BOOKED;
          }
          await manager.save(SchedulingSlot, slot);
        }
      } else {
        // No scheduled slots — fall back to engine / conflict check
        const conflictQb = manager
          .createQueryBuilder(Booking, 'booking')
          .setLock('pessimistic_write')
          .where('booking.employee_id = :employeeId', { employeeId: dto.employeeId })
          .andWhere('booking.business_id = :businessId', { businessId })
          .andWhere('booking.status NOT IN (:...excludedStatuses)', {
            excludedStatuses: [BookingStatus.CANCELLED],
          })
          .andWhere('booking.startTime < :endTime', { endTime })
          .andWhere('booking.endTime > :startTime', { startTime });

        if (options?.sameVisitMultiService && dto.multiServiceGroupId) {
          conflictQb.andWhere(
            '(booking.multiServiceGroupId IS NULL OR booking.multiServiceGroupId != :groupId)',
            { groupId: dto.multiServiceGroupId },
          );
        }

        const conflicts = await conflictQb.getMany();

        if (conflicts.length > 0) {
          const existing = conflicts[0];
          throw new ConflictException(
            formatBookingOverlapConflict({
              employeeName: existing?.employee?.name,
              startTime: existing?.startTime,
              existingCustomerName: existing?.customer?.name,
            }),
          );
        }
      }

      const paymentStatus =
        options?.paymentStatus ??
        (dto.packagePurchaseId
          ? PaymentStatus.NOT_APPLICABLE
          : dto.multiServiceGroupId
            ? PaymentStatus.NOT_APPLICABLE
            : useSubscriptionId
          ? PaymentStatus.NOT_APPLICABLE
          : service.prepaymentMode === PrepaymentMode.NONE
            ? PaymentStatus.NOT_APPLICABLE
            : PaymentStatus.PENDING);

      const newBooking = manager.create(Booking, {
        businessId,
        employeeId: dto.employeeId,
        serviceId: dto.serviceId,
        customerId: dto.customerId,
        packagePurchaseId: dto.packagePurchaseId ?? null,
        multiServiceGroupId: dto.multiServiceGroupId ?? null,
        startTime,
        endTime,
        status: BookingStatus.CONFIRMED,
        paymentStatus,
        notes: dto.notes,
        description: dto.description,
        linkedEmployeeIds: dto.linkedEmployeeIds,
        virtualMeetingUrl: dto.virtualMeetingUrl,
        metadata: {
          ...(dto.metadata || {}),
          ...(useSubscriptionId ? { subscriptionId: useSubscriptionId, subscriptionCreditUsed: true } : {}),
        },
        // Store the first slot id for backward compat
        slotId: slotsToLock[0]?.id,
      });

      const saved = await manager.save(newBooking);

      if (resourceIds.length > 0) {
        await this.resourcesService.assignToBooking(manager, saved.id, resourceIds);
      }

      if (useSubscriptionId) {
        await this.subscriptionsService.consumeCreditInTransaction(
          manager,
          useSubscriptionId,
          saved.id,
          dto.serviceId,
        );
      }

      return saved;
    });

    await this.eventStore.publish({
      eventType: EventType.BOOKING_CREATED,
      aggregateType: 'booking',
      aggregateId: booking.id,
      businessId,
      payload: {
        employeeId: booking.employeeId,
        serviceId: booking.serviceId,
        startTime: booking.startTime,
        endTime: booking.endTime,
        lockedSlotsCount: slotsToLock.length,
      },
      userId,
    });

    if (booking.paymentStatus === PaymentStatus.PAID) {
      await this.tryAwardLoyalty(booking.id);
    }

    return this.findOne(booking.id);
  }

  async update(
    bookingId: string,
    dto: UpdateBookingDto,
    userId?: string,
    internal?: {
      skipGroupReschedule?: boolean;
      /** Package / same-visit block segment — skip per-segment micro-slot service checks. */
      sameVisitBlockSegment?: boolean;
      /** Other bookings in the visit still at old times while rescheduling segment-by-segment. */
      excludeBookingIds?: string[];
    },
  ): Promise<Booking> {
    const booking = await this.bookingRepo.findOne({
      where: { id: bookingId },
      relations: { employee: true, service: true, customer: true },
    });
    if (!booking) throw new NotFoundException('Booking not found');

    this.assertExpectedUpdatedAt(booking, dto.expectedUpdatedAt);

    const visibilityOnly =
      dto.hiddenFromCalendar !== undefined &&
      dto.startTime === undefined &&
      dto.employeeId === undefined &&
      dto.serviceId === undefined &&
      dto.status === undefined &&
      dto.paymentStatus === undefined &&
      dto.description === undefined &&
      dto.notes === undefined &&
      dto.customerId === undefined &&
      dto.linkedEmployeeIds === undefined &&
      dto.virtualMeetingUrl === undefined &&
      !dto.metadata;

    if (visibilityOnly) {
      booking.hiddenFromCalendar = dto.hiddenFromCalendar!;
      await this.bookingRepo.save(booking);
      await this.eventStore.publish({
        eventType: EventType.BOOKING_UPDATED,
        aggregateType: 'booking',
        aggregateId: booking.id,
        businessId: booking.businessId,
        payload: {
          bookingId: booking.id,
          hiddenFromCalendar: booking.hiddenFromCalendar,
          status: booking.status,
        },
        userId,
      });
      return this.findOne(booking.id);
    }

    if (booking.status === BookingStatus.CANCELLED) {
      throw new BadRequestException('Cancelled appointments cannot be updated');
    }

    const targetEmployeeId = dto.employeeId ?? booking.employeeId;
    const targetServiceId = dto.serviceId ?? booking.serviceId;
    const targetStart = dto.startTime ? new Date(dto.startTime) : booking.startTime;

    const isRescheduling =
      targetStart.getTime() !== booking.startTime.getTime() ||
      targetEmployeeId !== booking.employeeId ||
      targetServiceId !== booking.serviceId;

    const oldStart = booking.startTime;
    const oldEnd = booking.endTime;
    const oldEmployeeId = booking.employeeId;

    if (isRescheduling) {
      if (!internal?.skipGroupReschedule && booking.multiServiceGroupId) {
        const rescheduled = await this.maybeRescheduleMultiServiceGroup(
          booking,
          targetStart,
          targetEmployeeId,
          userId,
          dto.expectedUpdatedAt,
        );
        if (rescheduled) return this.findOne(booking.id);
      }

      if (targetStart <= new Date()) {
        throw new ConflictException('Cannot reschedule to a time in the past');
      }

      await this.releaseSlotsByWindow(
        booking.employeeId,
        booking.businessId,
        booking.startTime,
        booking.endTime,
      );

      const service = await this.serviceRepo.findOneOrFail({ where: { id: targetServiceId } });
      const totalDuration = service.durationMinutes + service.bufferMinutes;
      const newEnd = new Date(targetStart.getTime() + totalDuration * 60000);

      await this.reconcileStuckSlotsInWindow(
        booking.businessId,
        targetEmployeeId,
        targetStart,
        newEnd,
      );

      const excludeBookingIds = this.mergeExcludeBookingIds(bookingId, internal?.excludeBookingIds);

      if (!internal?.sameVisitBlockSegment) {
        await this.validateBookingWindow(
          booking.businessId,
          targetEmployeeId,
          targetStart,
          newEnd,
          targetServiceId,
          excludeBookingIds,
        );
      }

      const newSlots = await this.findSlotsInWindow(
        booking.businessId,
        targetEmployeeId,
        targetStart,
        newEnd,
        internal?.sameVisitBlockSegment ? undefined : targetServiceId,
      );

      if (newSlots.length === 0) {
        const conflicts = await this.findOverlappingBookings(
          booking.businessId,
          targetEmployeeId,
          targetStart,
          newEnd,
          excludeBookingIds,
        );
        if (conflicts.length > 0) {
          const existing = conflicts[0];
          throw new ConflictException(
            formatBookingOverlapConflict({
              employeeName: booking.employee?.name,
              startTime: targetStart,
              existingCustomerName: existing?.customer?.name,
            }),
          );
        }
      } else {
        for (const slot of newSlots) {
          slot.appointmentCount += 1;
          if (slot.appointmentCount >= slot.maxAppointmentCount) {
            slot.status = SlotStatus.BOOKED;
          }
          await this.slotRepo.save(slot);
        }
      }

      booking.startTime = targetStart;
      booking.endTime = newEnd;
      booking.employeeId = targetEmployeeId;
      booking.serviceId = targetServiceId;
      booking.service = service;
      if (targetEmployeeId !== oldEmployeeId) {
        const employee = await this.bookingRepo.manager.findOne(Employee, {
          where: { id: targetEmployeeId, businessId: booking.businessId },
        });
        if (!employee) throw new NotFoundException('Employee not found');
        booking.employee = employee;
      }
      booking.slotId = newSlots[0]?.id ?? null;

      await this.eventStore.publish({
        eventType: EventType.BOOKING_RESCHEDULED,
        aggregateType: 'booking',
        aggregateId: booking.id,
        businessId: booking.businessId,
        payload: {
          bookingId: booking.id,
          employeeId: targetEmployeeId,
          serviceId: targetServiceId,
          oldStartTime: oldStart.toISOString(),
          oldEndTime: oldEnd.toISOString(),
          newStartTime: targetStart.toISOString(),
          newEndTime: newEnd.toISOString(),
        },
        userId,
      });
    }

    if (dto.description !== undefined) booking.description = dto.description;
    if (dto.notes !== undefined) booking.notes = dto.notes;

    if (dto.customerId !== undefined) {
      if (dto.customerId) {
        const customer = await this.customerRepo.findOne({
          where: { id: dto.customerId, businessId: booking.businessId, isActive: true },
        });
        if (!customer) throw new NotFoundException('Customer not found');
        booking.customerId = dto.customerId;
      } else {
        booking.customerId = null as any;
      }
    }

    const previousStatus = booking.status;
    const previousPaymentStatus = booking.paymentStatus;
    if (dto.status) booking.status = dto.status;
    this.applyPaymentStatusOnStatusChange(
      booking,
      previousStatus,
      booking.status,
      dto.paymentStatus,
    );
    if (dto.linkedEmployeeIds) booking.linkedEmployeeIds = dto.linkedEmployeeIds;
    if (dto.virtualMeetingUrl !== undefined) booking.virtualMeetingUrl = dto.virtualMeetingUrl;
    if (dto.metadata) booking.metadata = { ...booking.metadata, ...dto.metadata };
    if (dto.hiddenFromCalendar !== undefined) booking.hiddenFromCalendar = dto.hiddenFromCalendar;

    await this.bookingRepo.save(booking);

    if (
      booking.paymentStatus === PaymentStatus.PAID &&
      previousPaymentStatus !== PaymentStatus.PAID
    ) {
      await this.tryAwardLoyalty(booking.id);
    }

    if (
      booking.status === BookingStatus.COMPLETED &&
      previousStatus !== BookingStatus.COMPLETED
    ) {
      await this.eventStore.publish({
        eventType: EventType.BOOKING_COMPLETED,
        aggregateType: 'booking',
        aggregateId: booking.id,
        businessId: booking.businessId,
        payload: {
          customerId: booking.customerId,
          serviceId: booking.serviceId,
          employeeId: booking.employeeId,
        },
        userId,
      });
    }

    if (
      booking.status === BookingStatus.NO_SHOW &&
      previousStatus !== BookingStatus.NO_SHOW
    ) {
      await this.eventStore.publish({
        eventType: EventType.BOOKING_NO_SHOW,
        aggregateType: 'booking',
        aggregateId: booking.id,
        businessId: booking.businessId,
        payload: {
          customerId: booking.customerId,
          serviceId: booking.serviceId,
          employeeId: booking.employeeId,
          startTime: booking.startTime.toISOString(),
          endTime: booking.endTime.toISOString(),
          previousStatus,
        },
        userId,
      });
    }

    await this.eventStore.publish({
      eventType: EventType.BOOKING_UPDATED,
      aggregateType: 'booking',
      aggregateId: booking.id,
      businessId: booking.businessId,
      payload: {
        bookingId: booking.id,
        employeeId: booking.employeeId,
        serviceId: booking.serviceId,
        startTime: booking.startTime.toISOString(),
        endTime: booking.endTime.toISOString(),
        status: booking.status,
        paymentStatus: booking.paymentStatus,
        rescheduled: isRescheduling,
        previousEmployeeId: isRescheduling ? oldEmployeeId : undefined,
      },
      userId,
    });

    return this.findOne(booking.id);
  }

  async findAll(
    businessId: string,
    date?: string,
    employeeId?: string,
    includeHidden = false,
  ): Promise<Booking[]> {
    const where: any = { businessId };
    if (!includeHidden) {
      where.hiddenFromCalendar = false;
    }
    if (date) {
      const dayStart = new Date(`${date}T00:00:00.000Z`);
      const dayEnd = new Date(`${date}T23:59:59.999Z`);
      if (!Number.isNaN(dayStart.getTime())) {
        where.startTime = Between(dayStart, dayEnd);
      }
    }
    if (employeeId) {
      where.employeeId = employeeId;
    }
    return this.bookingRepo.find({
      where,
      relations: { employee: true, service: true, customer: true },
      order: { startTime: 'ASC' },
    });
  }

  /** Hide or restore appointments on the schedule calendar without deleting records. */
  async setHiddenFromCalendar(
    bookingIds: string[],
    hidden: boolean,
    userId?: string,
  ): Promise<{ updatedCount: number; updatedIds: string[] }> {
    const updatedIds: string[] = [];

    for (const bookingId of bookingIds) {
      const booking = await this.bookingRepo.findOne({ where: { id: bookingId } });
      if (!booking || booking.hiddenFromCalendar === hidden) continue;

      booking.hiddenFromCalendar = hidden;
      await this.bookingRepo.save(booking);
      updatedIds.push(booking.id);

      await this.eventStore.publish({
        eventType: EventType.BOOKING_UPDATED,
        aggregateType: 'booking',
        aggregateId: booking.id,
        businessId: booking.businessId,
        payload: {
          bookingId: booking.id,
          hiddenFromCalendar: hidden,
          status: booking.status,
        },
        userId,
      });
    }

    return { updatedCount: updatedIds.length, updatedIds };
  }

  async searchDashboard(
    businessId: string,
    query: GetBookingsQueryDto,
  ): Promise<AppointmentsSearchResult> {
    const statuses = parseBookingStatusFilter(query.status);
    const sortBy = query.sortBy ?? 'startTime';
    const sortOrder = query.sortOrder === 'ASC' ? 'ASC' : 'DESC';
    const page = query.page && query.page > 0 ? query.page : 1;
    const pageSize =
      query.pageSize && query.pageSize > 0 ? Math.min(query.pageSize, 100) : 20;
    const skip = (page - 1) * pageSize;

    const qb = this.bookingRepo
      .createQueryBuilder('booking')
      .leftJoinAndSelect('booking.customer', 'customer')
      .leftJoinAndSelect('booking.employee', 'employee')
      .leftJoinAndSelect('booking.service', 'service')
      .where('booking.business_id = :businessId', { businessId });

    if (!query.includeHidden) {
      qb.andWhere('booking.hidden_from_calendar = false');
    }

    if (query.search?.trim()) {
      const term = `%${query.search.trim()}%`;
      qb.andWhere(
        `(customer.name ILIKE :term OR customer.email ILIKE :term OR customer.phone ILIKE :term OR service.name ILIKE :term OR employee.name ILIKE :term OR COALESCE(booking.notes, '') ILIKE :term)`,
        { term },
      );
    }

    if (statuses.length > 0) {
      qb.andWhere('booking.status IN (:...statuses)', { statuses });
    }

    if (query.date?.trim()) {
      const dayStart = new Date(`${query.date.trim()}T00:00:00.000Z`);
      if (!Number.isNaN(dayStart.getTime())) {
        const dayEnd = new Date(`${query.date.trim()}T23:59:59.999Z`);
        qb.andWhere('booking.startTime >= :dayStart', { dayStart });
        qb.andWhere('booking.startTime <= :dayEnd', { dayEnd });
      }
    }

    switch (sortBy) {
      case 'customerName':
        qb.orderBy('LOWER(customer.name)', sortOrder);
        break;
      case 'serviceName':
        qb.orderBy('LOWER(service.name)', sortOrder);
        break;
      case 'employeeName':
        qb.orderBy('LOWER(employee.name)', sortOrder);
        break;
      case 'status':
        qb.orderBy('booking.status', sortOrder);
        break;
      case 'createdAt':
        qb.orderBy('booking.createdAt', sortOrder);
        break;
      case 'updatedAt':
        qb.orderBy('booking.updatedAt', sortOrder);
        break;
      default:
        qb.orderBy('booking.startTime', sortOrder);
    }

    const [bookings, totalItems] = await qb.skip(skip).take(pageSize).getManyAndCount();

    return {
      totalItems,
      page,
      pageSize,
      appointments: bookings.map((b) => ({
        id: b.id,
        startTime: b.startTime.toISOString(),
        endTime: b.endTime.toISOString(),
        status: b.status,
        paymentStatus: b.paymentStatus,
        hiddenFromCalendar: b.hiddenFromCalendar,
        notes: b.notes ?? null,
        createdAt: b.createdAt.toISOString(),
        updatedAt: b.updatedAt.toISOString(),
        customer: b.customer
          ? {
              id: b.customer.id,
              name: b.customer.name,
              email: b.customer.email ?? null,
              phone: b.customer.phone ?? null,
            }
          : null,
        employee: b.employee ? { id: b.employee.id, name: b.employee.name } : null,
        service: b.service
          ? {
              id: b.service.id,
              name: b.service.name,
              price: Number(b.service.price),
              currency: b.service.currency,
            }
          : null,
      })),
    };
  }

  async findOne(id: string): Promise<Booking> {
    const booking = await this.bookingRepo.findOne({
      where: { id },
      relations: { employee: true, service: true, customer: true },
    });
    if (!booking) throw new NotFoundException('Booking not found');
    return booking;
  }

  async cancel(
    id: string,
    reason?: string,
    userId?: string,
    expectedUpdatedAt?: string,
    options?: { skipGroupCancel?: boolean },
  ): Promise<Booking> {
    const booking = await this.findOne(id);
    this.assertExpectedUpdatedAt(booking, expectedUpdatedAt);

    if (!options?.skipGroupCancel && booking.multiServiceGroupId) {
      const group = await this.multiServiceGroupRepo.findOne({
        where: { id: booking.multiServiceGroupId },
      });
      if (group?.schedulingMode === 'same_visit') {
        const siblings = await this.bookingRepo.find({
          where: {
            multiServiceGroupId: group.id,
            status: Not(BookingStatus.CANCELLED) as any,
          },
        });
        for (const sibling of siblings) {
          if (sibling.id === id) continue;
          await this.cancel(sibling.id, reason, userId, undefined, { skipGroupCancel: true });
        }
      }
    }

    const wasAlreadyCancelled = booking.status === BookingStatus.CANCELLED;

    await this.releaseSlotsByWindow(
      booking.employeeId,
      booking.businessId,
      booking.startTime,
      booking.endTime,
    );
    await this.reconcileStuckSlotsInWindow(
      booking.businessId,
      booking.employeeId,
      booking.startTime,
      booking.endTime,
    );

    if (!wasAlreadyCancelled) {
      const previousStatus = booking.status;
      booking.status = BookingStatus.CANCELLED;
      booking.cancellationReason = reason || 'Cancelled';
      this.applyPaymentStatusOnStatusChange(
        booking,
        previousStatus,
        BookingStatus.CANCELLED,
      );
      await this.bookingRepo.save(booking);

      await this.subscriptionsService.restoreCreditForBooking(id);

      await this.eventStore.publish({
        eventType: EventType.BOOKING_CANCELLED,
        aggregateType: 'booking',
        aggregateId: id,
        businessId: booking.businessId,
        payload: {
          reason,
          employeeId: booking.employeeId,
          startTime: booking.startTime.toISOString(),
          endTime: booking.endTime.toISOString(),
        },
        userId,
      });

      await this.eventStore.publish({
        eventType: EventType.BOOKING_UPDATED,
        aggregateType: 'booking',
        aggregateId: id,
        businessId: booking.businessId,
        payload: {
          bookingId: id,
          status: BookingStatus.CANCELLED,
          employeeId: booking.employeeId,
          startTime: booking.startTime.toISOString(),
          endTime: booking.endTime.toISOString(),
        },
        userId,
      });
    }

    return booking;
  }

  /** Re-activate a cancelled booking and re-lock schedule slots when possible. */
  async restoreCancelled(id: string, userId?: string): Promise<Booking> {
    const booking = await this.findOne(id);
    if (booking.status !== BookingStatus.CANCELLED) {
      throw new BadRequestException('Only cancelled bookings can be restored');
    }

    await this.reconcileStuckSlotsInWindow(
      booking.businessId,
      booking.employeeId,
      booking.startTime,
      booking.endTime,
    );

    await this.validateBookingWindow(
      booking.businessId,
      booking.employeeId,
      booking.startTime,
      booking.endTime,
      booking.serviceId,
      [booking.id],
    );

    const slotsToLock = await this.findSlotsInWindow(
      booking.businessId,
      booking.employeeId,
      booking.startTime,
      booking.endTime,
      booking.serviceId,
    );

    if (slotsToLock.length === 0) {
      const conflicts = await this.findOverlappingBookings(
        booking.businessId,
        booking.employeeId,
        booking.startTime,
        booking.endTime,
        [booking.id],
      );
      if (conflicts.length > 0) {
        throw new ConflictException('Cannot restore: time slot is already booked');
      }
    } else {
      for (const slot of slotsToLock) {
        slot.appointmentCount += 1;
        if (slot.appointmentCount >= slot.maxAppointmentCount) {
          slot.status = SlotStatus.BOOKED;
        }
        await this.slotRepo.save(slot);
      }
    }

    booking.status = BookingStatus.CONFIRMED;
    booking.cancellationReason = null as any;
    booking.slotId = slotsToLock[0]?.id ?? null;
    await this.bookingRepo.save(booking);

    await this.eventStore.publish({
      eventType: EventType.BOOKING_UPDATED,
      aggregateType: 'booking',
      aggregateId: booking.id,
      businessId: booking.businessId,
      payload: {
        bookingId: booking.id,
        status: BookingStatus.CONFIRMED,
        restored: true,
        employeeId: booking.employeeId,
        startTime: booking.startTime.toISOString(),
        endTime: booking.endTime.toISOString(),
      },
      userId,
    });

    return this.findOne(booking.id);
  }

  async getUpcoming(businessId: string, limit = 10): Promise<Booking[]> {
    return this.bookingRepo.find({
      where: {
        businessId,
        startTime: Not(In([])) as any,
        status: Not(In([BookingStatus.CANCELLED, BookingStatus.COMPLETED])) as any,
      },
      relations: { employee: true, service: true, customer: true },
      order: { startTime: 'ASC' },
      take: limit,
    });
  }

  // ─── Private helpers ────────────────────────────────────────────────────────

  private async tryAwardLoyalty(bookingId: string): Promise<void> {
    try {
      await this.loyaltyAwardService.awardForPaidBooking(bookingId);
    } catch (err) {
      this.logger.warn(`Loyalty award failed for booking ${bookingId}: ${err}`);
    }
  }

  /**
   * Cancelled and no-show appointments don't need payment tracking.
   * If the client omits paymentStatus on a status change, default to not_applicable.
   */
  private applyPaymentStatusOnStatusChange(
    booking: Booking,
    previousStatus: BookingStatus,
    nextStatus: BookingStatus,
    explicitPaymentStatus?: PaymentStatus,
  ): void {
    if (explicitPaymentStatus) {
      booking.paymentStatus = explicitPaymentStatus;
      return;
    }

    if (previousStatus === nextStatus) return;

    if (
      nextStatus === BookingStatus.CANCELLED ||
      nextStatus === BookingStatus.NO_SHOW
    ) {
      booking.paymentStatus = PaymentStatus.NOT_APPLICABLE;
    }
  }

  /**
   * Service-match helper: a slot covers a service if
   *   (a) slot.service_ids contains the serviceId, OR
   *   (b) slot.service_ids is NULL/empty (generic slot — any service allowed)
   */
  private serviceMatchClause(alias = 'slot'): string {
    return (
      `(${alias}.service_ids IS NULL ` +
      `OR cardinality(${alias}.service_ids) = 0 ` +
      `OR :serviceId = ANY(${alias}.service_ids))`
    );
  }

  private slotAllowsService(slot: SchedulingSlot, serviceId: string): boolean {
    const ids = slot.serviceIds;
    if (!ids || ids.length === 0) return true;
    return ids.includes(serviceId);
  }

  /** Merge duplicate micro-slots at the same start time (e.g. from overlapping gap fills). */
  private dedupeSlotsByStartTime(slots: SchedulingSlot[]): SchedulingSlot[] {
    const byStart = new Map<number, SchedulingSlot>();

    for (const slot of slots) {
      const key = slot.startTime.getTime();
      const existing = byStart.get(key);
      if (!existing) {
        byStart.set(key, slot);
        continue;
      }

      const mergedIds = this.mergeSlotServiceIds(existing.serviceIds, slot.serviceIds);
      byStart.set(key, {
        ...existing,
        serviceIds: mergedIds,
        serviceId: existing.serviceId ?? slot.serviceId,
        maxAppointmentCount: Math.max(
          existing.maxAppointmentCount ?? 1,
          slot.maxAppointmentCount ?? 1,
        ),
        appointmentCount: Math.min(existing.appointmentCount, slot.appointmentCount),
        status:
          existing.status === SlotStatus.AVAILABLE || slot.status === SlotStatus.AVAILABLE
            ? SlotStatus.AVAILABLE
            : existing.status,
      });
    }

    return [...byStart.values()].sort(
      (a, b) => a.startTime.getTime() - b.startTime.getTime(),
    );
  }

  private mergeSlotServiceIds(
    a: string[] | null | undefined,
    b: string[] | null | undefined,
  ): string[] | null {
    if (!a?.length && !b?.length) return null;
    if (!a?.length) return [...b!];
    if (!b?.length) return [...a];
    return [...new Set([...a, ...b])];
  }

  /** Public API: checks whether a service fits the selected time slot (used by public booking). */
  async validateServiceFitsWindow(
    businessId: string,
    employeeId: string,
    startTime: Date,
    endTime: Date,
    serviceId: string,
  ): Promise<void> {
    await this.validateBookingWindow(businessId, employeeId, startTime, endTime, serviceId);
  }

  /**
   * Same-visit multi-service: validate the full contiguous block once.
   * Per-segment checks fail when turnover pushes a segment off the micro-slot grid (e.g. 10:05).
   */
  async validateMultiServiceBlockFits(
    businessId: string,
    employeeId: string,
    blockStart: Date,
    blockEnd: Date,
    serviceIds: string[],
    excludeBookingIds?: string[],
  ): Promise<void> {
    const periodCheck = await this.checkServicePeriodsForMultiService(
      businessId,
      employeeId,
      blockStart,
      blockEnd,
      serviceIds,
    );
    if (periodCheck === 'invalid') {
      throw new BadRequestException(
        'The booking does not fit within an available service period. ' +
          'The full service duration must finish before the period ends.',
      );
    }

    await this.assertNoBlockingScheduleOverlap(
      businessId,
      employeeId,
      blockStart,
      blockEnd,
    );

    if (periodCheck === 'valid') {
      const hasActiveBooking = await this.hasActiveBookingOverlap(
        businessId,
        employeeId,
        blockStart,
        blockEnd,
        excludeBookingIds,
      );
      if (hasActiveBooking) {
        throw new ConflictException(
          'All time slots in the requested window are already fully booked.',
        );
      }
      return;
    }

    const microSlotsInWindow = await this.slotRepo
      .createQueryBuilder('slot')
      .where('slot.business_id = :businessId', { businessId })
      .andWhere('slot.employee_id = :employeeId', { employeeId })
      .andWhere('slot.startTime >= :startTime', { startTime: blockStart })
      .andWhere('slot.startTime < :endTime', { endTime: blockEnd })
      .andWhere('slot.status = :status', { status: SlotStatus.AVAILABLE })
      .getMany();

    if (microSlotsInWindow.length === 0) {
      const anySlotInWindow = await this.slotRepo
        .createQueryBuilder('slot')
        .where('slot.business_id = :businessId', { businessId })
        .andWhere('slot.employee_id = :employeeId', { employeeId })
        .andWhere('slot.startTime >= :startTime', { startTime: blockStart })
        .andWhere('slot.startTime < :endTime', { endTime: blockEnd })
        .andWhere('slot.status NOT IN (:...blockStatuses)', {
          blockStatuses: [SlotStatus.BLOCKED, SlotStatus.UNAVAILABLE],
        })
        .getCount();

      if (anySlotInWindow > 0) {
        const hasActiveBooking = await this.hasActiveBookingOverlap(
          businessId,
          employeeId,
          blockStart,
          blockEnd,
          excludeBookingIds,
        );
        if (hasActiveBooking) {
          throw new ConflictException(
            'All time slots in the requested window are already fully booked.',
          );
        }
        await this.reconcileStuckSlotsInWindow(businessId, employeeId, blockStart, blockEnd);
        return;
      }
      throw new BadRequestException(
        'No bookable schedule window exists for this provider at the requested time.',
      );
    }

    const slotGranularityMs = 10 * 60 * 1000;
    const slotsNeeded = Math.ceil(
      (blockEnd.getTime() - blockStart.getTime()) / slotGranularityMs,
    );
    const dedupedSlots = this.dedupeSlotsByStartTime(microSlotsInWindow);

    if (dedupedSlots.length < slotsNeeded) {
      throw new BadRequestException(
        'The full service duration does not fit within the available schedule. ' +
          'Choose an earlier start time so the appointment ends within the service period.',
      );
    }

    const hasActiveBooking = await this.hasActiveBookingOverlap(
      businessId,
      employeeId,
      blockStart,
      blockEnd,
      excludeBookingIds,
    );
    if (hasActiveBooking) {
      throw new ConflictException(
        'All time slots in the requested window are already fully booked.',
      );
    }
  }

  /** Explains why a service cannot be booked at a given start time (for assistant UX). */
  async explainServiceSlotFit(
    businessId: string,
    employeeId: string,
    startTime: Date,
    serviceId: string,
  ): Promise<{
    fits: boolean;
    requiredMinutes?: number;
    remainingMinutes?: number;
    availableUntil?: Date;
    failureReason?: 'duration' | 'service_period' | 'service_restriction' | 'blocked' | 'booked' | 'other';
    message?: string;
  }> {
    const service = await this.serviceRepo.findOne({ where: { id: serviceId, businessId } });
    if (!service) {
      return { fits: false, failureReason: 'other', message: 'Service not found.' };
    }

    const requiredMinutes = service.durationMinutes + service.bufferMinutes;
    const endTime = new Date(startTime.getTime() + requiredMinutes * 60000);

    try {
      await this.validateServiceFitsWindow(businessId, employeeId, startTime, endTime, serviceId);
      return { fits: true, requiredMinutes };
    } catch (err: any) {
      const availableUntil = await this.getAvailableUntilAfterStart(businessId, employeeId, startTime);
      const remainingMinutes = Math.max(
        0,
        Math.floor((availableUntil.getTime() - startTime.getTime()) / 60000),
      );

      const msg: string = err?.message || '';
      let failureReason: 'duration' | 'service_period' | 'service_restriction' | 'blocked' | 'booked' | 'other' =
        'other';
      if (msg.includes('full service duration does not fit') || remainingMinutes < requiredMinutes) {
        failureReason = 'duration';
      } else if (msg.includes('service period')) {
        failureReason = 'service_period';
      } else if (msg.includes('does not offer this service')) {
        failureReason = 'service_restriction';
      } else if (msg.includes('blocked or unavailable')) {
        failureReason = 'blocked';
      } else if (msg.includes('fully booked')) {
        failureReason = 'booked';
      }

      return {
        fits: false,
        requiredMinutes,
        remainingMinutes,
        availableUntil,
        failureReason,
        message: msg,
      };
    }
  }

  /** Latest instant a booking may end when starting at `startTime` (consecutive open micro-slots). */
  async getAvailableUntilAfterStart(
    businessId: string,
    employeeId: string,
    startTime: Date,
  ): Promise<Date> {
    const SLOT_MS = 10 * 60 * 1000;
    const dayEnd = new Date(startTime);
    dayEnd.setUTCHours(23, 59, 59, 999);

    const microSlots = await this.slotRepo
      .createQueryBuilder('slot')
      .where('slot.business_id = :businessId', { businessId })
      .andWhere('slot.employee_id = :employeeId', { employeeId })
      .andWhere('slot.startTime >= :startTime', { startTime })
      .andWhere('slot.startTime <= :dayEnd', { dayEnd })
      .andWhere('slot.status = :status', { status: SlotStatus.AVAILABLE })
      .orderBy('slot.startTime', 'ASC')
      .getMany();

    const slotByStart = new Map(microSlots.map((s) => [s.startTime.getTime(), s]));

    let cursor = new Date(startTime);
    let availableUntil = new Date(startTime);

    while (true) {
      const slot = slotByStart.get(cursor.getTime());
      if (!slot || slot.appointmentCount >= slot.maxAppointmentCount) {
        break;
      }
      availableUntil = slot.endTime;
      cursor = new Date(cursor.getTime() + SLOT_MS);
    }

    const blockEnd = await this.getServiceBlockEndCoveringInstant(businessId, employeeId, startTime);
    if (blockEnd && blockEnd.getTime() < availableUntil.getTime()) {
      availableUntil = blockEnd;
    }

    const nextBlockStart = await this.getNextBlockingPeriodStart(
      businessId,
      employeeId,
      startTime,
      dayEnd,
    );
    if (nextBlockStart && nextBlockStart.getTime() < availableUntil.getTime()) {
      availableUntil = nextBlockStart;
    }

    return availableUntil;
  }

  private async getServiceBlockEndCoveringInstant(
    businessId: string,
    employeeId: string,
    instant: Date,
  ): Promise<Date | null> {
    const dayStart = new Date(instant);
    dayStart.setUTCHours(0, 0, 0, 0);
    const dayEnd = new Date(instant);
    dayEnd.setUTCHours(23, 59, 59, 999);

    const dayPeriods = await this.schedulingPeriodRepo.find({
      where: {
        businessId,
        employeeId,
        startTime: Between(dayStart, dayEnd) as any,
      },
    });

    const active = dayPeriods.find(
      (p) =>
        p.type === TemplatePeriodType.SERVICE_BLOCK &&
        p.startTime <= instant &&
        p.endTime > instant,
    );
    return active?.endTime ?? null;
  }

  private async getNextBlockingPeriodStart(
    businessId: string,
    employeeId: string,
    after: Date,
    dayEnd: Date,
  ): Promise<Date | null> {
    const block = await this.slotRepo
      .createQueryBuilder('slot')
      .where('slot.business_id = :businessId', { businessId })
      .andWhere('slot.employee_id = :employeeId', { employeeId })
      .andWhere('slot.startTime > :after', { after })
      .andWhere('slot.startTime <= :dayEnd', { dayEnd })
      .andWhere('slot.status IN (:...statuses)', {
        statuses: [SlotStatus.BLOCKED, SlotStatus.UNAVAILABLE],
      })
      .orderBy('slot.startTime', 'ASC')
      .getOne();

    return block?.startTime ?? null;
  }

  /**
   * Service IDs allowed at an instant based on applied schedule (service_block periods + micro-slots).
   * - null: no service_block on this day, or schedule allows any service at this instant
   * - []: schedule exists but no service window covers this instant
   * - string[]: explicit allow-list from period and/or micro-slots at this instant
   */
  async getAllowedServiceIdsAtInstant(
    businessId: string,
    employeeId: string,
    instant: Date,
  ): Promise<string[] | null> {
    const dayStart = new Date(instant);
    dayStart.setUTCHours(0, 0, 0, 0);
    const dayEnd = new Date(instant);
    dayEnd.setUTCHours(23, 59, 59, 999);

    const dayPeriods = await this.schedulingPeriodRepo.find({
      where: {
        businessId,
        employeeId,
        startTime: Between(dayStart, dayEnd) as any,
      },
    });

    const serviceBlocks = dayPeriods.filter(
      (p) => p.type === TemplatePeriodType.SERVICE_BLOCK,
    );

    if (serviceBlocks.length === 0) {
      return null;
    }

    const active = serviceBlocks.filter(
      (p) => p.startTime <= instant && p.endTime > instant,
    );

    if (active.length === 0) {
      return [];
    }

    const fromPeriods = new Set<string>();
    let periodAllowsAny = false;

    for (const period of active) {
      if (!period.serviceIds?.length) {
        periodAllowsAny = true;
      } else {
        period.serviceIds.forEach((id) => fromPeriods.add(id));
      }
    }

    if (fromPeriods.size > 0 && !periodAllowsAny) {
      return [...fromPeriods];
    }

    const fromSlots = await this.getServiceIdsFromMicroSlotsAtInstant(
      businessId,
      employeeId,
      instant,
    );

    if (fromPeriods.size > 0) {
      if (fromSlots?.length) {
        fromSlots.forEach((id) => fromPeriods.add(id));
      }
      return [...fromPeriods];
    }

    if (fromSlots?.length) {
      return fromSlots;
    }

    return null;
  }

  /** Collect service IDs from available micro-slots starting at this instant. */
  private async getServiceIdsFromMicroSlotsAtInstant(
    businessId: string,
    employeeId: string,
    instant: Date,
  ): Promise<string[] | null> {
    const windowEnd = new Date(instant.getTime() + 10 * 60000);
    const slots = await this.findSlotsInWindow(businessId, employeeId, instant, windowEnd);

    const ids = new Set<string>();
    for (const slot of this.dedupeSlotsByStartTime(slots)) {
      if (slot.serviceIds?.length) {
        slot.serviceIds.forEach((id) => ids.add(id));
      } else if (slot.serviceId) {
        ids.add(slot.serviceId);
      }
    }

    return ids.size > 0 ? [...ids] : null;
  }

  private async validateEmployeeCanPerformService(
    businessId: string,
    employeeId: string,
    serviceId: string,
  ): Promise<void> {
    const employee = await this.employeeRepo.findOne({
      where: { id: employeeId, businessId, isActive: true },
    });
    if (!employee) {
      throw new NotFoundException('Service provider not found');
    }
    if (employee.serviceIds?.length && !employee.serviceIds.includes(serviceId)) {
      const service = await this.serviceRepo.findOne({ where: { id: serviceId, businessId } });
      throw new BadRequestException(
        `${employee.name} is not assigned to provide ${service?.name ?? 'this service'}.`,
      );
    }
  }

  private async validateBookingWindow(
    businessId: string,
    employeeId: string,
    startTime: Date,
    endTime: Date,
    serviceId: string,
    excludeBookingIds?: string[],
  ): Promise<void> {
    await this.validateAgainstServicePeriods(businessId, employeeId, startTime, endTime, serviceId);

    // For BLOCKED / UNAVAILABLE periods we create ONE full-duration slot.
    // A booking overlaps with it if:  slotStart < bookEnd AND slotEnd > bookStart
    const blockingSlots = await this.slotRepo
      .createQueryBuilder('slot')
      .where('slot.business_id = :businessId', { businessId })
      .andWhere('slot.employee_id = :employeeId', { employeeId })
      .andWhere('slot.startTime < :endTime', { endTime })
      .andWhere('slot.endTime > :startTime', { startTime })
      .andWhere('slot.status IN (:...blockStatuses)', {
        blockStatuses: [SlotStatus.BLOCKED, SlotStatus.UNAVAILABLE],
      })
      .getCount();

    if (blockingSlots > 0) {
      throw new BadRequestException(
        'This time window overlaps with a blocked or unavailable period. Booking is not allowed.',
      );
    }

    // Check the 10-min micro-slots that start within [startTime, endTime)
    const microSlotsInWindow = await this.slotRepo
      .createQueryBuilder('slot')
      .where('slot.business_id = :businessId', { businessId })
      .andWhere('slot.employee_id = :employeeId', { employeeId })
      .andWhere('slot.startTime >= :startTime', { startTime })
      .andWhere('slot.startTime < :endTime', { endTime })
      .andWhere('slot.status = :status', { status: SlotStatus.AVAILABLE })
      .getMany();

    if (microSlotsInWindow.length === 0) {
      const anySlotInWindow = await this.slotRepo
        .createQueryBuilder('slot')
        .where('slot.business_id = :businessId', { businessId })
        .andWhere('slot.employee_id = :employeeId', { employeeId })
        .andWhere('slot.startTime >= :startTime', { startTime })
        .andWhere('slot.startTime < :endTime', { endTime })
        .andWhere('slot.status NOT IN (:...blockStatuses)', {
          blockStatuses: [SlotStatus.BLOCKED, SlotStatus.UNAVAILABLE],
        })
        .getCount();

      if (anySlotInWindow > 0) {
        const hasActiveBooking = await this.hasActiveBookingOverlap(
          businessId,
          employeeId,
          startTime,
          endTime,
          excludeBookingIds,
        );
        if (hasActiveBooking) {
          throw new ConflictException(
            'All time slots in the requested window are already fully booked.',
          );
        }
        await this.reconcileStuckSlotsInWindow(businessId, employeeId, startTime, endTime);
        return;
      }
      throw new BadRequestException(
        'No bookable schedule window exists for this provider at the requested time.',
      );
    }

    const slotGranularityMs = 10 * 60 * 1000;
    const slotsNeeded = Math.ceil((endTime.getTime() - startTime.getTime()) / slotGranularityMs);

    // Overlapping schedule fills can create duplicate micro-slots at the same start time
    // with different service_ids — merge them, then require enough slots that allow this service.
    const dedupedSlots = this.dedupeSlotsByStartTime(microSlotsInWindow);
    const supportingSlots = dedupedSlots.filter((s) => this.slotAllowsService(s, serviceId));

    if (supportingSlots.length < slotsNeeded) {
      throw new BadRequestException(
        'The service provider does not offer this service for the entire requested time window. ' +
        'Please choose a time when this service is scheduled.',
      );
    }

    if (dedupedSlots.length < slotsNeeded) {
      throw new BadRequestException(
        'The full service duration does not fit within the available schedule. ' +
        'Choose an earlier start time so the appointment ends within the service period.',
      );
    }
  }

  /**
   * When an applied schedule exists for the day, the entire booking window must
   * fall inside a service_block period that offers the requested service.
   */
  private async validateAgainstServicePeriods(
    businessId: string,
    employeeId: string,
    startTime: Date,
    endTime: Date,
    serviceId: string,
  ): Promise<void> {
    const dayStart = new Date(startTime);
    dayStart.setUTCHours(0, 0, 0, 0);
    const dayEnd = new Date(startTime);
    dayEnd.setUTCHours(23, 59, 59, 999);

    const dayPeriods = await this.schedulingPeriodRepo.find({
      where: {
        businessId,
        employeeId,
        startTime: Between(dayStart, dayEnd) as any,
      },
    });

    if (dayPeriods.length === 0) {
      throw new BadRequestException(
        'This provider has no schedule on the selected day. Booking is not allowed.',
      );
    }

    const containing = dayPeriods.filter(
      (p) =>
        p.type === TemplatePeriodType.SERVICE_BLOCK &&
        p.startTime <= startTime &&
        p.endTime >= endTime,
    );

    if (containing.length === 0) {
      throw new BadRequestException(
        'The booking does not fit within an available service period. ' +
        'The full service duration must finish before the period ends.',
      );
    }

    const serviceAllowed = containing.some((p) => {
      const ids = p.serviceIds;
      if (!ids || ids.length === 0) return true;
      return ids.includes(serviceId);
    });

    if (!serviceAllowed) {
      throw new BadRequestException(
        'This service is not offered in the service period for the selected time.',
      );
    }
  }

  private async validateAgainstServicePeriodsForMultiService(
    businessId: string,
    employeeId: string,
    startTime: Date,
    endTime: Date,
    serviceIds: string[],
  ): Promise<void> {
    const periodCheck = await this.checkServicePeriodsForMultiService(
      businessId,
      employeeId,
      startTime,
      endTime,
      serviceIds,
    );
    if (periodCheck === 'no_periods') {
      throw new BadRequestException(
        'This provider has no schedule on the selected day. Booking is not allowed.',
      );
    }
    if (periodCheck === 'invalid') {
      throw new BadRequestException(
        'The booking does not fit within an available service period. ' +
          'The full service duration must finish before the period ends.',
      );
    }
  }

  private async checkServicePeriodsForMultiService(
    businessId: string,
    employeeId: string,
    startTime: Date,
    endTime: Date,
    serviceIds: string[],
  ): Promise<'valid' | 'no_periods' | 'invalid'> {
    const dayStart = new Date(startTime);
    dayStart.setUTCHours(0, 0, 0, 0);
    const dayEnd = new Date(startTime);
    dayEnd.setUTCHours(23, 59, 59, 999);

    const dayPeriods = await this.schedulingPeriodRepo.find({
      where: {
        businessId,
        employeeId,
        startTime: Between(dayStart, dayEnd) as any,
      },
    });

    const servicePeriods = dayPeriods.filter(
      (p) => p.type === TemplatePeriodType.SERVICE_BLOCK,
    );
    if (servicePeriods.length === 0) {
      return 'no_periods';
    }

    const containing = servicePeriods.filter(
      (p) => p.startTime <= startTime && p.endTime >= endTime,
    );
    if (containing.length === 0) {
      return 'invalid';
    }

    const allServicesAllowed = containing.some((p) => {
      const ids = p.serviceIds;
      if (!ids || ids.length === 0) return true;
      return serviceIds.every((id) => ids.includes(id));
    });

    return allServicesAllowed ? 'valid' : 'invalid';
  }

  private async assertNoBlockingScheduleOverlap(
    businessId: string,
    employeeId: string,
    blockStart: Date,
    blockEnd: Date,
  ): Promise<void> {
    const dayStart = new Date(blockStart);
    dayStart.setUTCHours(0, 0, 0, 0);
    const dayEnd = new Date(blockStart);
    dayEnd.setUTCHours(23, 59, 59, 999);

    const dayPeriods = await this.schedulingPeriodRepo.find({
      where: {
        businessId,
        employeeId,
        startTime: Between(dayStart, dayEnd) as any,
      },
    });

    const blockingPeriod = dayPeriods.find(
      (p) =>
        (p.type === TemplatePeriodType.UNAVAILABLE_BLOCK ||
          p.type === TemplatePeriodType.BLOCKED_TIME) &&
        p.startTime < blockEnd &&
        p.endTime > blockStart,
    );
    if (blockingPeriod) {
      throw new BadRequestException(
        'This time window overlaps with a blocked or unavailable period. Booking is not allowed.',
      );
    }

    const blockingSlots = await this.slotRepo
      .createQueryBuilder('slot')
      .where('slot.business_id = :businessId', { businessId })
      .andWhere('slot.employee_id = :employeeId', { employeeId })
      .andWhere('slot.startTime < :endTime', { endTime: blockEnd })
      .andWhere('slot.endTime > :startTime', { startTime: blockStart })
      .andWhere('slot.status IN (:...blockStatuses)', {
        blockStatuses: [SlotStatus.BLOCKED, SlotStatus.UNAVAILABLE],
      })
      .getCount();

    if (blockingSlots > 0) {
      throw new BadRequestException(
        'This time window overlaps with a blocked or unavailable period. Booking is not allowed.',
      );
    }
  }

  /**
   * Returns all available micro-slots whose startTime falls within [startTime, endTime).
   * Matches clinic-app's `findSlotsByServiceTypeProviderAndDates` query pattern.
   */
  private async findSlotsInWindow(
    businessId: string,
    employeeId: string,
    startTime: Date,
    endTime: Date,
    serviceId?: string,
  ): Promise<SchedulingSlot[]> {
    const qb = this.slotRepo
      .createQueryBuilder('slot')
      .where('slot.business_id = :businessId', { businessId })
      .andWhere('slot.employee_id = :employeeId', { employeeId })
      .andWhere('slot.startTime >= :startTime', { startTime })
      .andWhere('slot.startTime < :endTime', { endTime })
      .andWhere('slot.status = :status', { status: SlotStatus.AVAILABLE })
      .andWhere('slot.appointmentCount < slot.maxAppointmentCount')
      .orderBy('slot.startTime', 'ASC');

    if (serviceId) {
      qb.andWhere(this.serviceMatchClause(), { serviceId });
    }

    return qb.getMany();
  }

  private mergeExcludeBookingIds(
    bookingId: string,
    extra?: string[],
  ): string[] {
    return [...new Set([bookingId, ...(extra ?? [])])];
  }

  private applyBookingIdExclusions(
    qb: { andWhere: (clause: string, params: Record<string, unknown>) => unknown },
    excludeBookingIds?: string[],
  ): void {
    if (excludeBookingIds?.length) {
      qb.andWhere('booking.id NOT IN (:...excludeBookingIds)', { excludeBookingIds });
    }
  }

  private async hasActiveBookingOverlap(
    businessId: string,
    employeeId: string,
    startTime: Date,
    endTime: Date,
    excludeBookingIds?: string[],
  ): Promise<boolean> {
    const qb = this.bookingRepo
      .createQueryBuilder('booking')
      .where('booking.business_id = :businessId', { businessId })
      .andWhere('booking.employee_id = :employeeId', { employeeId })
      .andWhere('booking.status != :cancelled', { cancelled: BookingStatus.CANCELLED })
      .andWhere('booking.startTime < :endTime', { endTime })
      .andWhere('booking.endTime > :startTime', { startTime });

    this.applyBookingIdExclusions(qb, excludeBookingIds);

    const count = await qb.getCount();
    return count > 0;
  }

  private async findOverlappingBookings(
    businessId: string,
    employeeId: string,
    startTime: Date,
    endTime: Date,
    excludeBookingIds?: string[],
  ): Promise<Booking[]> {
    const qb = this.bookingRepo
      .createQueryBuilder('booking')
      .where('booking.business_id = :businessId', { businessId })
      .andWhere('booking.employee_id = :employeeId', { employeeId })
      .andWhere('booking.status NOT IN (:...excluded)', {
        excluded: [BookingStatus.CANCELLED],
      })
      .andWhere('booking.startTime < :endTime', { endTime })
      .andWhere('booking.endTime > :startTime', { startTime });

    this.applyBookingIdExclusions(qb, excludeBookingIds);

    return qb.getMany();
  }

  private assertExpectedUpdatedAt(booking: Booking, expected?: string): void {
    if (!expected) return;
    const expectedMs = new Date(expected).getTime();
    if (Number.isNaN(expectedMs) || expectedMs !== booking.updatedAt.getTime()) {
      throw new ConflictException({
        message: 'This appointment was updated by someone else. Refresh and try again.',
        code: 'BOOKING_VERSION_CONFLICT',
        updatedAt: booking.updatedAt.toISOString(),
      });
    }
  }

  /**
   * When no active booking occupies a window, reset micro-slots that were left
   * booked after a cancellation (stuck state).
   */
  private async reconcileStuckSlotsInWindow(
    businessId: string,
    employeeId: string,
    startTime: Date,
    endTime: Date,
  ): Promise<void> {
    const hasActive = await this.hasActiveBookingOverlap(businessId, employeeId, startTime, endTime);
    if (hasActive) return;

    const stuckSlots = await this.slotRepo
      .createQueryBuilder('slot')
      .where('slot.business_id = :businessId', { businessId })
      .andWhere('slot.employee_id = :employeeId', { employeeId })
      .andWhere('slot.startTime < :endTime', { endTime })
      .andWhere('slot.endTime > :startTime', { startTime })
      .andWhere('slot.status NOT IN (:...blockStatuses)', {
        blockStatuses: [SlotStatus.BLOCKED, SlotStatus.UNAVAILABLE],
      })
      .getMany();

    for (const slot of stuckSlots) {
      if (slot.status !== SlotStatus.AVAILABLE || slot.appointmentCount > 0) {
        slot.appointmentCount = 0;
        slot.status = SlotStatus.AVAILABLE;
        await this.slotRepo.save(slot);
      }
    }
  }

  /**
   * Releases all micro-slots locked by a booking.
   * Uses overlap matching so partial slot coverage is handled correctly.
   */
  private async releaseSlotsByWindow(
    employeeId: string,
    businessId: string,
    startTime: Date,
    endTime: Date,
  ): Promise<void> {
    await this.releaseSlotsByWindowInRepo(this.slotRepo, employeeId, businessId, startTime, endTime);
  }

  private async releaseSlotsByWindowInRepo(
    slotRepo: Repository<SchedulingSlot>,
    employeeId: string,
    businessId: string,
    startTime: Date,
    endTime: Date,
  ): Promise<void> {
    const slots = await slotRepo
      .createQueryBuilder('slot')
      .where('slot.business_id = :businessId', { businessId })
      .andWhere('slot.employee_id = :employeeId', { employeeId })
      .andWhere('slot.startTime < :endTime', { endTime })
      .andWhere('slot.endTime > :startTime', { startTime })
      .andWhere('slot.status IN (:...statuses)', {
        statuses: [SlotStatus.BOOKED, SlotStatus.AVAILABLE],
      })
      .getMany();

    for (const slot of slots) {
      slot.appointmentCount = Math.max(0, slot.appointmentCount - 1);
      if (slot.appointmentCount < slot.maxAppointmentCount) {
        slot.status = SlotStatus.AVAILABLE;
      }
      await slotRepo.save(slot);
    }
  }

  private findSlotsInRepo(
    slotRepo: Repository<SchedulingSlot>,
    businessId: string,
    employeeId: string,
    startTime: Date,
    endTime: Date,
    serviceId?: string,
  ): Promise<SchedulingSlot[]> {
    const qb = slotRepo
      .createQueryBuilder('slot')
      .where('slot.business_id = :businessId', { businessId })
      .andWhere('slot.employee_id = :employeeId', { employeeId })
      .andWhere('slot.startTime >= :startTime', { startTime })
      .andWhere('slot.startTime < :endTime', { endTime })
      .andWhere('slot.status = :status', { status: SlotStatus.AVAILABLE })
      .andWhere('slot.appointmentCount < slot.maxAppointmentCount')
      .orderBy('slot.startTime', 'ASC');

    if (serviceId) {
      qb.andWhere(this.serviceMatchClause(), { serviceId });
    }

    return qb.getMany();
  }

  private findOverlappingInRepo(
    bookingRepo: Repository<Booking>,
    businessId: string,
    employeeId: string,
    startTime: Date,
    endTime: Date,
    excludeBookingIds?: string[],
  ): Promise<Booking[]> {
    const qb = bookingRepo
      .createQueryBuilder('booking')
      .where('booking.business_id = :businessId', { businessId })
      .andWhere('booking.employee_id = :employeeId', { employeeId })
      .andWhere('booking.status NOT IN (:...excluded)', {
        excluded: [BookingStatus.CANCELLED],
      })
      .andWhere('booking.startTime < :endTime', { endTime })
      .andWhere('booking.endTime > :startTime', { startTime });

    this.applyBookingIdExclusions(qb, excludeBookingIds);
    return qb.getMany();
  }

  /**
   * Reschedule every segment in one transaction — all succeed or none are persisted.
   * Caller must run validateMultiServiceBlockFits before this when using block scheduling.
   */
  async rescheduleSameVisitBlock(
    segments: SameVisitBlockRescheduleSegment[],
    userId?: string,
  ): Promise<Booking[]> {
    if (!segments.length) {
      throw new BadRequestException('No bookings to reschedule');
    }

    const excludeBookingIds = [...new Set(segments.map((segment) => segment.bookingId))];
    const pendingEvents: Array<{
      bookingId: string;
      businessId: string;
      employeeId: string;
      serviceId: string;
      oldStart: Date;
      oldEnd: Date;
      newStart: Date;
      newEnd: Date;
    }> = [];

    const saved = await this.dataSource.transaction(async (manager: EntityManager) => {
      const bookingRepo = manager.getRepository(Booking);
      const slotRepo = manager.getRepository(SchedulingSlot);
      const serviceRepo = manager.getRepository(Service);

      const loaded = await Promise.all(
        segments.map((segment) =>
          bookingRepo.findOne({
            where: { id: segment.bookingId },
            relations: { service: true },
          }),
        ),
      );

      for (let i = 0; i < loaded.length; i++) {
        if (!loaded[i]) {
          throw new NotFoundException(`Booking not found: ${segments[i].bookingId}`);
        }
        if (loaded[i]!.status === BookingStatus.CANCELLED) {
          throw new BadRequestException('Cancelled appointments cannot be rescheduled');
        }
      }

      for (const booking of loaded) {
        await this.releaseSlotsByWindowInRepo(
          slotRepo,
          booking!.employeeId,
          booking!.businessId,
          booking!.startTime,
          booking!.endTime,
        );
      }

      const updated: Booking[] = [];

      for (let i = 0; i < segments.length; i++) {
        const segment = segments[i];
        const booking = (await bookingRepo.findOne({
          where: { id: segment.bookingId },
          relations: { service: true },
        }))!;

        this.assertExpectedUpdatedAt(booking, segment.expectedUpdatedAt);

        const targetStart = new Date(segment.startTime);
        const targetEmployeeId = segment.employeeId;
        if (targetStart <= new Date()) {
          throw new ConflictException('Cannot reschedule to a time in the past');
        }

        const service =
          booking.service ??
          (await serviceRepo.findOneOrFail({ where: { id: booking.serviceId } }));
        const totalDuration = service.durationMinutes + service.bufferMinutes;
        const newEnd = new Date(targetStart.getTime() + totalDuration * 60000);
        const oldStart = booking.startTime;
        const oldEnd = booking.endTime;

        const newSlots = await this.findSlotsInRepo(
          slotRepo,
          booking.businessId,
          targetEmployeeId,
          targetStart,
          newEnd,
        );

        if (newSlots.length === 0) {
          const conflicts = await this.findOverlappingInRepo(
            bookingRepo,
            booking.businessId,
            targetEmployeeId,
            targetStart,
            newEnd,
            excludeBookingIds,
          );
          if (conflicts.length > 0) {
            throw new ConflictException('Time slot is already booked');
          }
        } else {
          for (const slot of newSlots) {
            slot.appointmentCount += 1;
            if (slot.appointmentCount >= slot.maxAppointmentCount) {
              slot.status = SlotStatus.BOOKED;
            }
            await slotRepo.save(slot);
          }
        }

        booking.startTime = targetStart;
        booking.endTime = newEnd;
        booking.employeeId = targetEmployeeId;
        booking.service = service;
        booking.slotId = newSlots[0]?.id ?? null;
        if (segment.metadata) {
          booking.metadata = { ...booking.metadata, ...segment.metadata };
        }

        await bookingRepo.save(booking);
        updated.push(booking);

        pendingEvents.push({
          bookingId: booking.id,
          businessId: booking.businessId,
          employeeId: targetEmployeeId,
          serviceId: booking.serviceId,
          oldStart,
          oldEnd,
          newStart: targetStart,
          newEnd,
        });
      }

      return updated;
    });

    for (const event of pendingEvents) {
      await this.eventStore.publish({
        eventType: EventType.BOOKING_RESCHEDULED,
        aggregateType: 'booking',
        aggregateId: event.bookingId,
        businessId: event.businessId,
        payload: {
          bookingId: event.bookingId,
          employeeId: event.employeeId,
          serviceId: event.serviceId,
          oldStartTime: event.oldStart.toISOString(),
          oldEndTime: event.oldEnd.toISOString(),
          newStartTime: event.newStart.toISOString(),
          newEndTime: event.newEnd.toISOString(),
        },
        userId,
      });
    }

    return Promise.all(saved.map((booking) => this.findOne(booking.id)));
  }

  private async maybeRescheduleMultiServiceGroup(
    booking: Booking,
    targetStart: Date,
    targetEmployeeId: string,
    userId?: string,
    expectedUpdatedAt?: string,
  ): Promise<boolean> {
    if (!booking.multiServiceGroupId) return false;

    const group = await this.multiServiceGroupRepo.findOne({
      where: { id: booking.multiServiceGroupId },
    });
    if (!group || group.schedulingMode !== 'same_visit') return false;

    const siblings = await this.bookingRepo.find({
      where: {
        multiServiceGroupId: group.id,
        status: Not(BookingStatus.CANCELLED) as any,
      },
      relations: { service: true },
      order: { startTime: 'ASC' },
    });
    if (siblings.length === 0) return false;

    const business = await this.businessRepo.findOne({ where: { id: booking.businessId } });
    const turnover = resolveMultiServiceSettings(business?.settings).turnoverBufferMinutes;
    const serviceLines = siblings.map((entry) => ({
      serviceId: entry.serviceId,
      durationMinutes: entry.service!.durationMinutes,
      bufferMinutes: entry.service!.bufferMinutes,
    }));

    const sequential = buildSequentialAppointments(serviceLines, targetStart, turnover);
    const excludeBookingIds = siblings.map((entry) => entry.id);
    const blockEnd = sequential[sequential.length - 1].endTime;
    const serviceIds = serviceLines.map((line) => line.serviceId);

    await this.validateMultiServiceBlockFits(
      booking.businessId,
      targetEmployeeId,
      sequential[0].startTime,
      blockEnd,
      serviceIds,
      excludeBookingIds,
    );

    await this.rescheduleSameVisitBlock(
      siblings.map((sibling, i) => ({
        bookingId: sibling.id,
        startTime: sequential[i].startTime.toISOString(),
        employeeId: targetEmployeeId,
        ...(sibling.id === booking.id ? { expectedUpdatedAt } : {}),
      })),
      userId,
    );

    return true;
  }
}
