import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, Between } from 'typeorm';
import { ScheduleTemplate } from '../entities/schedule-template.entity.js';
import {
  SchedulingTemplatePeriod,
  TemplatePeriodType,
} from '../entities/scheduling-template-period.entity.js';
import {
  SchedulingSlot,
  SlotStatus,
} from '../entities/scheduling-slot.entity.js';
import { SchedulingPeriod } from '../entities/scheduling-period.entity.js';
import { ApplyTemplateDto } from '../dto/create-schedule.dto.js';
import { Employee } from '../../employee/entities/employee.entity.js';
import {
  Booking,
  BookingStatus,
} from '../../booking/entities/booking.entity.js';
import { EventStoreService } from '../../../events/store/event-store.service.js';
import { EventType } from '../../../events/event-types.js';

/** Granularity (minutes) for booking micro-slots. */
const SLOT_DURATION_MINUTES = 10;
const SAVE_CHUNK_SIZE = 1000;

@Injectable()
export class TemplateApplyService {
  private readonly logger = new Logger(TemplateApplyService.name);

  constructor(
    @InjectRepository(ScheduleTemplate)
    private templateRepo: Repository<ScheduleTemplate>,
    @InjectRepository(SchedulingTemplatePeriod)
    private periodRepo: Repository<SchedulingTemplatePeriod>,
    @InjectRepository(SchedulingSlot)
    private slotRepo: Repository<SchedulingSlot>,
    @InjectRepository(SchedulingPeriod)
    private schedulingPeriodRepo: Repository<SchedulingPeriod>,
    @InjectRepository(Employee)
    private employeeRepo: Repository<Employee>,
    @InjectRepository(Booking)
    private bookingRepo: Repository<Booking>,
    private eventStore: EventStoreService,
  ) {}

  async applyTemplate(
    dto: ApplyTemplateDto,
    businessId: string,
    userId?: string,
  ): Promise<{ slotsCreated: number }> {
    const startDate = new Date(dto.startDate);
    const endDate = new Date(dto.endDate);
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    if (startDate < today) {
      throw new BadRequestException('Cannot apply template to past dates');
    }
    if (endDate < startDate) {
      throw new BadRequestException('End date must be on or after start date');
    }

    const employee = await this.employeeRepo.findOne({
      where: { id: dto.employeeId, businessId },
    });
    if (!employee) {
      throw new BadRequestException('Employee not found');
    }

    const template = await this.templateRepo.findOne({
      where: { id: dto.templateId, businessId, isDeleted: false },
      relations: { periods: true },
    });
    if (!template) {
      throw new BadRequestException('Template not found');
    }
    if (!template.periods || template.periods.length === 0) {
      throw new BadRequestException('Template has no time periods defined');
    }

    const repeatWeeks = dto.repeatWeeksCount || 1;
    const periods = this.filterPeriodsByDays(template.periods, dto.applyDays);

    if (periods.length === 0) {
      throw new BadRequestException('No periods match the selected days');
    }

    const daysToApply = this.getIntervalDays(
      startDate,
      endDate,
      repeatWeeks,
    ).filter((day) => dto.applyDays.includes(day.getUTCDay()));

    // Delete existing micro-slots AND applied periods for affected days
    await this.deleteExistingData(employee.id, businessId, daysToApply);

    let totalSlotsCreated = 0;
    const periodsToSave: Partial<SchedulingPeriod>[] = [];

    for (const period of periods) {
      const { slots, appliedPeriods } = this.generateDataForPeriod(
        period,
        employee,
        businessId,
        daysToApply,
        template.id,
      );
      totalSlotsCreated += slots.length;
      periodsToSave.push(...appliedPeriods);

      for (let i = 0; i < slots.length; i += SAVE_CHUNK_SIZE) {
        await this.slotRepo.save(slots.slice(i, i + SAVE_CHUNK_SIZE));
      }
    }

    // Save applied period records (for calendar display)
    for (let i = 0; i < periodsToSave.length; i += SAVE_CHUNK_SIZE) {
      await this.schedulingPeriodRepo.save(
        periodsToSave.slice(i, i + SAVE_CHUNK_SIZE) as SchedulingPeriod[],
      );
    }

    await this.restoreBookedSlotStatus(
      employee.id,
      businessId,
      startDate,
      endDate,
    );

    await this.eventStore.publish({
      eventType: EventType.SCHEDULE_TEMPLATE_APPLIED,
      aggregateType: 'schedule_template',
      aggregateId: template.id,
      businessId,
      payload: {
        employeeId: employee.id,
        startDate: dto.startDate,
        endDate: dto.endDate,
        applyDays: dto.applyDays,
        slotsCreated: totalSlotsCreated,
      },
      userId,
    });

    this.logger.log(
      `Applied template "${template.name}" for employee ${employee.id}: ${totalSlotsCreated} micro-slots, ${periodsToSave.length} periods`,
    );

    return { slotsCreated: totalSlotsCreated };
  }

  private filterPeriodsByDays(
    periods: SchedulingTemplatePeriod[],
    applyDays: number[],
  ): SchedulingTemplatePeriod[] {
    return periods.filter((period) => {
      return applyDays.some((day) => this.isDayActiveForPeriod(day, period));
    });
  }

  private isDayActiveForPeriod(
    dayOfWeek: number,
    period: SchedulingTemplatePeriod,
  ): boolean {
    switch (dayOfWeek) {
      case 0:
        return period.isActiveOnSunday;
      case 1:
        return period.isActiveOnMonday;
      case 2:
        return period.isActiveOnTuesday;
      case 3:
        return period.isActiveOnWednesday;
      case 4:
        return period.isActiveOnThursday;
      case 5:
        return period.isActiveOnFriday;
      case 6:
        return period.isActiveOnSaturday;
      default:
        return false;
    }
  }

  private getIntervalDays(start: Date, end: Date, repeatWeeks: number): Date[] {
    const days: Date[] = [];
    const finalEnd = new Date(end);
    finalEnd.setDate(finalEnd.getDate() + (repeatWeeks - 1) * 7);

    const current = new Date(start);
    while (current <= finalEnd) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    return days;
  }

  /**
   * For a template period + set of days, produce:
   * - `slots`: 10-minute micro-slots used for booking counting/locking
   * - `appliedPeriods`: whole-block period records used for calendar display
   */
  private generateDataForPeriod(
    period: SchedulingTemplatePeriod,
    employee: Employee,
    businessId: string,
    daysToApply: Date[],
    templateId: string,
  ): { slots: SchedulingSlot[]; appliedPeriods: Partial<SchedulingPeriod>[] } {
    const slots: SchedulingSlot[] = [];
    const appliedPeriods: Partial<SchedulingPeriod>[] = [];

    for (const day of daysToApply) {
      if (!this.isDayActiveForPeriod(day.getUTCDay(), period)) continue;

      const [startH, startM] = period.startTime.split(':').map(Number);
      const [endH, endM] = period.endTime.split(':').map(Number);

      const periodStart = new Date(day);
      periodStart.setUTCHours(startH, startM, 0, 0);
      const periodEnd = new Date(day);
      periodEnd.setUTCHours(endH, endM, 0, 0);

      const validServiceIds = (period.serviceIds || []).filter(Boolean);

      // Always create one applied period record for calendar display
      appliedPeriods.push({
        businessId,
        employeeId: employee.id,
        startTime: new Date(periodStart),
        endTime: new Date(periodEnd),
        type: period.type,
        placeholderLabel: period.placeholderLabel,
        serviceIds: validServiceIds.length > 0 ? validServiceIds : null,
        maxAppointmentCount:
          period.type === TemplatePeriodType.SERVICE_BLOCK
            ? period.maxAppointmentCount || 1
            : 0,
        templateId,
      });

      if (
        period.type === TemplatePeriodType.UNAVAILABLE_BLOCK ||
        period.type === TemplatePeriodType.BLOCKED_TIME
      ) {
        // One blocking micro-slot covering the whole period
        const slot = this.slotRepo.create({
          businessId,
          employeeId: employee.id,
          startTime: periodStart,
          endTime: periodEnd,
          status:
            period.type === TemplatePeriodType.UNAVAILABLE_BLOCK
              ? SlotStatus.UNAVAILABLE
              : SlotStatus.BLOCKED,
          placeholderLabel: period.placeholderLabel,
          maxAppointmentCount: 0,
          appointmentCount: 0,
          templateId: period.templateId,
        });
        slots.push(slot);
        continue;
      }

      // SERVICE_BLOCK: generate 10-minute micro-slots for booking
      let current = new Date(periodStart);
      while (
        current.getTime() + SLOT_DURATION_MINUTES * 60000 <=
        periodEnd.getTime()
      ) {
        const slotEnd = new Date(
          current.getTime() + SLOT_DURATION_MINUTES * 60000,
        );

        const slot = this.slotRepo.create({
          businessId,
          employeeId: employee.id,
          startTime: new Date(current),
          endTime: slotEnd,
          status: SlotStatus.AVAILABLE,
          serviceId: validServiceIds[0] || undefined,
          serviceIds: validServiceIds.length > 0 ? validServiceIds : null,
          placeholderLabel: period.placeholderLabel,
          maxAppointmentCount: period.maxAppointmentCount || 1,
          appointmentCount: 0,
          templateId: period.templateId,
        });
        slots.push(slot);

        current = new Date(current.getTime() + SLOT_DURATION_MINUTES * 60000);
      }
    }

    return { slots, appliedPeriods };
  }

  /** Delete micro-slots AND applied periods for the given days. */
  private async deleteExistingData(
    employeeId: string,
    businessId: string,
    days: Date[],
  ): Promise<void> {
    if (days.length === 0) return;

    for (const day of days) {
      const dayStart = new Date(day);
      dayStart.setUTCHours(0, 0, 0, 0);
      const dayEnd = new Date(day);
      dayEnd.setUTCHours(23, 59, 59, 999);

      await Promise.all([
        this.slotRepo.delete({
          employeeId,
          businessId,
          startTime: Between(dayStart, dayEnd) as any,
        }),
        this.schedulingPeriodRepo.delete({
          employeeId,
          businessId,
          startTime: Between(dayStart, dayEnd) as any,
        }),
      ]);
    }
  }

  private async restoreBookedSlotStatus(
    employeeId: string,
    businessId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<void> {
    const bookings = await this.bookingRepo.find({
      where: {
        employeeId,
        businessId,
        startTime: Between(startDate, endDate),
        status: In([BookingStatus.CONFIRMED, BookingStatus.IN_PROGRESS]) as any,
      },
    });

    for (const booking of bookings) {
      // Lock all micro-slots that fall within this booking's window
      const overlappingSlots = await this.slotRepo
        .createQueryBuilder('slot')
        .where('slot.employee_id = :employeeId', { employeeId })
        .andWhere('slot.business_id = :businessId', { businessId })
        .andWhere('slot.startTime >= :startTime', {
          startTime: booking.startTime,
        })
        .andWhere('slot.startTime < :endTime', { endTime: booking.endTime })
        .andWhere('slot.status = :status', { status: SlotStatus.AVAILABLE })
        .getMany();

      for (const slot of overlappingSlots) {
        slot.appointmentCount = Math.min(
          slot.appointmentCount + 1,
          slot.maxAppointmentCount,
        );
        if (slot.appointmentCount >= slot.maxAppointmentCount) {
          slot.status = SlotStatus.BOOKED;
        }
        await this.slotRepo.save(slot);
      }
    }
  }

  async getAvailableSlots(
    businessId: string,
    date: Date,
    employeeId?: string,
    serviceId?: string,
  ): Promise<SchedulingSlot[]> {
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

    if (employeeId) {
      qb.andWhere('slot.employee_id = :employeeId', { employeeId });
    }
    if (serviceId) {
      qb.andWhere(
        '(slot.service_ids IS NULL OR cardinality(slot.service_ids) = 0 OR :serviceId = ANY(slot.service_ids))',
        { serviceId },
      );
    }

    qb.orderBy('slot.startTime', 'ASC');

    return qb.getMany();
  }
}
