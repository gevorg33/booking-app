import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, Not, In, DataSource } from 'typeorm';
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
import { Customer } from '../customer/entities/customer.entity.js';
import { EventStoreService } from '../../events/store/event-store.service.js';
import { EventType } from '../../events/event-types.js';

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
  service: { id: string; name: string } | null;
}

export interface AppointmentsSearchResult {
  totalItems: number;
  page: number;
  pageSize: number;
  appointments: AppointmentListItem[];
}

@Injectable()
export class BookingService {
  constructor(
    @InjectRepository(Booking) private bookingRepo: Repository<Booking>,
    @InjectRepository(SchedulingSlot) private slotRepo: Repository<SchedulingSlot>,
    @InjectRepository(SchedulingPeriod) private schedulingPeriodRepo: Repository<SchedulingPeriod>,
    @InjectRepository(Service) private serviceRepo: Repository<Service>,
    @InjectRepository(Customer) private customerRepo: Repository<Customer>,
    private schedulingEngine: SchedulingEngineService,
    private eventStore: EventStoreService,
    private dataSource: DataSource,
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
    options?: { paymentStatus?: PaymentStatus },
  ): Promise<Booking> {
    const service = await this.serviceRepo.findOne({ where: { id: dto.serviceId, businessId } });
    if (!service) throw new NotFoundException('Service not found');

    const startTime = new Date(dto.startTime);
    const totalDuration = service.durationMinutes + service.bufferMinutes;
    const endTime = new Date(startTime.getTime() + totalDuration * 60000);

    if (startTime <= new Date()) {
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

    // Validate the entire booking window against applied schedule
    await this.validateBookingWindow(businessId, dto.employeeId, startTime, endTime, dto.serviceId);

    // Find all available micro-slots that fall within the booking window
    const slotsToLock = await this.findSlotsInWindow(businessId, dto.employeeId, startTime, endTime, dto.serviceId);

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
        const conflicts = await manager
          .createQueryBuilder(Booking, 'booking')
          .setLock('pessimistic_write')
          .where('booking.employee_id = :employeeId', { employeeId: dto.employeeId })
          .andWhere('booking.business_id = :businessId', { businessId })
          .andWhere('booking.status NOT IN (:...excludedStatuses)', {
            excludedStatuses: [BookingStatus.CANCELLED],
          })
          .andWhere('booking.startTime < :endTime', { endTime })
          .andWhere('booking.endTime > :startTime', { startTime })
          .getMany();

        if (conflicts.length > 0) {
          throw new ConflictException('Time slot is already booked');
        }
      }

      const paymentStatus =
        options?.paymentStatus ??
        (service.prepaymentMode === PrepaymentMode.NONE
          ? PaymentStatus.NOT_APPLICABLE
          : PaymentStatus.PENDING);

      const newBooking = manager.create(Booking, {
        businessId,
        employeeId: dto.employeeId,
        serviceId: dto.serviceId,
        customerId: dto.customerId,
        startTime,
        endTime,
        status: BookingStatus.CONFIRMED,
        paymentStatus,
        notes: dto.notes,
        description: dto.description,
        linkedEmployeeIds: dto.linkedEmployeeIds,
        virtualMeetingUrl: dto.virtualMeetingUrl,
        metadata: dto.metadata || {},
        // Store the first slot id for backward compat
        slotId: slotsToLock[0]?.id,
      });

      return manager.save(newBooking);
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

    return this.findOne(booking.id);
  }

  async update(bookingId: string, dto: UpdateBookingDto, userId?: string): Promise<Booking> {
    const booking = await this.bookingRepo.findOne({
      where: { id: bookingId },
      relations: { employee: true, service: true, customer: true },
    });
    if (!booking) throw new NotFoundException('Booking not found');

    const isRescheduling = dto.startTime && dto.startTime !== booking.startTime.toISOString();

    if (isRescheduling) {
      // Release all micro-slots from the old booking window
      await this.releaseSlotsByWindow(
        booking.employeeId,
        booking.businessId,
        booking.startTime,
        booking.endTime,
      );

      const targetServiceId = dto.serviceId || booking.serviceId;
      const targetEmployeeId = dto.employeeId || booking.employeeId;
      const service = await this.serviceRepo.findOneOrFail({ where: { id: targetServiceId } });
      const newStart = new Date(dto.startTime!);
      const totalDuration = service.durationMinutes + service.bufferMinutes;
      const newEnd = new Date(newStart.getTime() + totalDuration * 60000);

      // Validate and lock new window
      await this.validateBookingWindow(booking.businessId, targetEmployeeId, newStart, newEnd, targetServiceId);
      const newSlots = await this.findSlotsInWindow(booking.businessId, targetEmployeeId, newStart, newEnd, targetServiceId);

      for (const slot of newSlots) {
        slot.appointmentCount += 1;
        if (slot.appointmentCount >= slot.maxAppointmentCount) {
          slot.status = SlotStatus.BOOKED;
        }
        await this.slotRepo.save(slot);
      }

      booking.startTime = newStart;
      booking.endTime = newEnd;
      booking.slotId = newSlots[0]?.id;

      await this.eventStore.publish({
        eventType: EventType.BOOKING_RESCHEDULED,
        aggregateType: 'booking',
        aggregateId: booking.id,
        businessId: booking.businessId,
        payload: { newStartTime: dto.startTime },
        userId,
      });
    }

    if (dto.employeeId) booking.employeeId = dto.employeeId;
    if (dto.serviceId) booking.serviceId = dto.serviceId;
    if (dto.description !== undefined) booking.description = dto.description;
    if (dto.notes !== undefined) booking.notes = dto.notes;

    const previousStatus = booking.status;
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

    await this.bookingRepo.save(booking);
    return this.findOne(booking.id);
  }

  async findAll(businessId: string, date?: string, employeeId?: string): Promise<Booking[]> {
    const where: any = { businessId };
    if (date) {
      const dayStart = new Date(date);
      dayStart.setUTCHours(0, 0, 0, 0);
      const dayEnd = new Date(date);
      dayEnd.setUTCHours(23, 59, 59, 999);
      where.startTime = Between(dayStart, dayEnd);
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
        service: b.service ? { id: b.service.id, name: b.service.name } : null,
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

  async cancel(id: string, reason?: string, userId?: string): Promise<Booking> {
    const booking = await this.findOne(id);
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

      await this.eventStore.publish({
        eventType: EventType.BOOKING_CANCELLED,
        aggregateType: 'booking',
        aggregateId: id,
        businessId: booking.businessId,
        payload: { reason, employeeId: booking.employeeId, startTime: booking.startTime },
        userId,
      });
    }

    return booking;
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
   * Service IDs allowed at an instant based on applied service_block periods.
   * Returns null when any active service is permitted.
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

    const active = dayPeriods.filter(
      (p) =>
        p.type === TemplatePeriodType.SERVICE_BLOCK &&
        p.startTime <= instant &&
        p.endTime > instant,
    );

    if (active.length === 0) return null;

    const allowed = new Set<string>();
    for (const period of active) {
      if (!period.serviceIds || period.serviceIds.length === 0) return null;
      period.serviceIds.forEach((id) => allowed.add(id));
    }
    return [...allowed];
  }

  private async validateBookingWindow(
    businessId: string,
    employeeId: string,
    startTime: Date,
    endTime: Date,
    serviceId: string,
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
        );
        if (hasActiveBooking) {
          throw new ConflictException(
            'All time slots in the requested window are already fully booked.',
          );
        }
        await this.reconcileStuckSlotsInWindow(businessId, employeeId, startTime, endTime);
        return;
      }
      // No slots at all → engine path, allow
      return;
    }

    // Verify service restriction: every slot in the window must permit this service
    const mismatch = microSlotsInWindow.some((s) => {
      const ids = s.serviceIds;
      if (!ids || ids.length === 0) return false; // generic slot = OK
      return !ids.includes(serviceId);
    });

    if (mismatch) {
      throw new BadRequestException(
        'The service provider does not offer this service for the entire requested time window. ' +
        'Please choose a time when this service is scheduled.',
      );
    }

    const slotGranularityMs = 10 * 60 * 1000;
    const slotsNeeded = Math.ceil((endTime.getTime() - startTime.getTime()) / slotGranularityMs);
    if (microSlotsInWindow.length < slotsNeeded) {
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
      return;
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

  private async hasActiveBookingOverlap(
    businessId: string,
    employeeId: string,
    startTime: Date,
    endTime: Date,
  ): Promise<boolean> {
    const count = await this.bookingRepo
      .createQueryBuilder('booking')
      .where('booking.business_id = :businessId', { businessId })
      .andWhere('booking.employee_id = :employeeId', { employeeId })
      .andWhere('booking.status != :cancelled', { cancelled: BookingStatus.CANCELLED })
      .andWhere('booking.startTime < :endTime', { endTime })
      .andWhere('booking.endTime > :startTime', { startTime })
      .getCount();
    return count > 0;
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
    const slots = await this.slotRepo
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
      await this.slotRepo.save(slot);
    }
  }
}
