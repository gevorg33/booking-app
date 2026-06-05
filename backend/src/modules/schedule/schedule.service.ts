import {
  Injectable,
  NotFoundException,
  BadRequestException,
  OnModuleInit,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, ILike, Between } from 'typeorm';
import { ScheduleTemplate } from './entities/schedule-template.entity.js';
import { ScheduleAssignment } from './entities/schedule-assignment.entity.js';
import { ScheduleOverride } from './entities/schedule-override.entity.js';
import {
  SchedulingTemplatePeriod,
  TemplatePeriodType,
} from './entities/scheduling-template-period.entity.js';
import {
  SchedulingSlot,
  SlotStatus,
} from './entities/scheduling-slot.entity.js';
import { SchedulingPeriod } from './entities/scheduling-period.entity.js';
import {
  CreateScheduleTemplateDto,
  UpdateScheduleTemplateDto,
  AssignScheduleDto,
  CreateOverrideDto,
  DeleteTemplatesDto,
  GetTemplatesQueryDto,
  CreateDirectScheduleDto,
} from './dto/create-schedule.dto.js';
import { EventStoreService } from '../../events/store/event-store.service.js';
import { EventType } from '../../events/event-types.js';
import {
  normalizeTime24,
  isValidTime24,
} from '../../common/utils/time-format.util.js';
import {
  buildScheduleCreationSnapshot,
  deleteScheduleUndoSnapshot,
} from './schedule-undo-snapshot.util.js';

@Injectable()
export class ScheduleService implements OnModuleInit {
  private readonly logger = new Logger(ScheduleService.name);
  constructor(
    @InjectRepository(ScheduleTemplate)
    private templateRepo: Repository<ScheduleTemplate>,
    @InjectRepository(SchedulingTemplatePeriod)
    private periodRepo: Repository<SchedulingTemplatePeriod>,
    @InjectRepository(ScheduleAssignment)
    private assignmentRepo: Repository<ScheduleAssignment>,
    @InjectRepository(ScheduleOverride)
    private overrideRepo: Repository<ScheduleOverride>,
    @InjectRepository(SchedulingSlot)
    private slotRepo: Repository<SchedulingSlot>,
    @InjectRepository(SchedulingPeriod)
    private schedulingPeriodRepo: Repository<SchedulingPeriod>,
    private eventStore: EventStoreService,
  ) {}

  async onModuleInit() {
    await this.migratePeriodTimesTo24Hour();
  }

  private normalizePeriodFields<
    T extends { startTime: string; endTime: string },
  >(period: T): T {
    const startTime = normalizeTime24(period.startTime);
    const endTime = normalizeTime24(period.endTime);
    if (!isValidTime24(startTime) || !isValidTime24(endTime)) {
      throw new BadRequestException(
        `Invalid period time. Use 24-hour HH:mm format (got "${period.startTime}"–"${period.endTime}").`,
      );
    }
    return { ...period, startTime, endTime };
  }

  private async migratePeriodTimesTo24Hour() {
    const periods = await this.periodRepo.find();
    let updated = 0;

    for (const period of periods) {
      const startTime = normalizeTime24(period.startTime || '09:00');
      const endTime = normalizeTime24(period.endTime || '17:00');
      if (startTime !== period.startTime || endTime !== period.endTime) {
        period.startTime = startTime;
        period.endTime = endTime;
        await this.periodRepo.save(period);
        updated++;
      }
    }

    const templates = await this.templateRepo.find();
    for (const template of templates) {
      let changed = false;
      const workingHours = template.workingHours?.map((slot) => {
        const startTime = normalizeTime24(slot.startTime);
        const endTime = normalizeTime24(slot.endTime);
        if (startTime !== slot.startTime || endTime !== slot.endTime)
          changed = true;
        return { ...slot, startTime, endTime };
      });
      const breaks = template.breaks?.map((slot) => {
        const startTime = normalizeTime24(slot.startTime);
        const endTime = normalizeTime24(slot.endTime);
        if (startTime !== slot.startTime || endTime !== slot.endTime)
          changed = true;
        return { ...slot, startTime, endTime };
      });
      if (changed) {
        template.workingHours = workingHours;
        template.breaks = breaks;
        await this.templateRepo.save(template);
        updated++;
      }
    }

    if (updated > 0) {
      this.logger.log(
        `Normalized ${updated} schedule record(s) to 24-hour HH:mm format`,
      );
    }
  }

  async createTemplate(
    businessId: string,
    dto: CreateScheduleTemplateDto,
    userId?: string,
  ): Promise<ScheduleTemplate> {
    const template = this.templateRepo.create({
      businessId,
      name: dto.name,
      dayOfWeek: dto.dayOfWeek,
      workingHours: dto.workingHours,
      breaks: dto.breaks || [],
    });
    await this.templateRepo.save(template);

    if (dto.timePeriods && dto.timePeriods.length > 0) {
      const normalizedPeriods = dto.timePeriods.map((tp) =>
        this.normalizePeriodFields(tp),
      );
      this.validateTemplatePeriodsDayOverlap(normalizedPeriods);

      const periods = normalizedPeriods.map((tp) =>
        this.periodRepo.create({
          templateId: template.id,
          type: tp.type,
          startTime: tp.startTime,
          endTime: tp.endTime,
          placeholderLabel: tp.placeholderLabel,
          serviceIds: tp.serviceIds,
          maxAppointmentCount: tp.maxAppointmentCount || 1,
          isActiveOnMonday: tp.isActiveOnMonday ?? false,
          isActiveOnTuesday: tp.isActiveOnTuesday ?? false,
          isActiveOnWednesday: tp.isActiveOnWednesday ?? false,
          isActiveOnThursday: tp.isActiveOnThursday ?? false,
          isActiveOnFriday: tp.isActiveOnFriday ?? false,
          isActiveOnSaturday: tp.isActiveOnSaturday ?? false,
          isActiveOnSunday: tp.isActiveOnSunday ?? false,
        }),
      );
      await this.periodRepo.save(periods);
      this.updateTemplateCompleteness(template, periods);
      await this.templateRepo.save(template);
    }

    await this.eventStore.publish({
      eventType: EventType.SCHEDULE_TEMPLATE_CREATED,
      aggregateType: 'schedule_template',
      aggregateId: template.id,
      businessId,
      payload: {
        name: template.name,
        periodsCount: dto.timePeriods?.length || 0,
      },
      userId,
    });

    return (await this.templateRepo.findOne({
      where: { id: template.id },
      relations: { periods: true },
    }))!;
  }

  async updateTemplate(
    businessId: string,
    templateId: string,
    dto: UpdateScheduleTemplateDto,
    userId?: string,
  ): Promise<ScheduleTemplate> {
    const template = await this.templateRepo.findOne({
      where: { id: templateId, businessId, isDeleted: false },
      relations: { periods: true },
    });
    if (!template) throw new NotFoundException('Template not found');

    if (dto.name) template.name = dto.name;

    if (dto.timePeriods) {
      const normalizedPeriods = dto.timePeriods.map((tp) =>
        this.normalizePeriodFields(tp),
      );
      this.validateTemplatePeriodsDayOverlap(normalizedPeriods);
      await this.periodRepo.delete({ templateId: template.id });

      const periods = normalizedPeriods.map((tp) =>
        this.periodRepo.create({
          templateId: template.id,
          type: tp.type,
          startTime: tp.startTime,
          endTime: tp.endTime,
          placeholderLabel: tp.placeholderLabel,
          serviceIds: tp.serviceIds,
          maxAppointmentCount: tp.maxAppointmentCount || 1,
          isActiveOnMonday: tp.isActiveOnMonday ?? false,
          isActiveOnTuesday: tp.isActiveOnTuesday ?? false,
          isActiveOnWednesday: tp.isActiveOnWednesday ?? false,
          isActiveOnThursday: tp.isActiveOnThursday ?? false,
          isActiveOnFriday: tp.isActiveOnFriday ?? false,
          isActiveOnSaturday: tp.isActiveOnSaturday ?? false,
          isActiveOnSunday: tp.isActiveOnSunday ?? false,
        }),
      );
      await this.periodRepo.save(periods);
      this.updateTemplateCompleteness(template, periods);
    }

    await this.templateRepo.save(template);

    await this.eventStore.publish({
      eventType: EventType.SCHEDULE_UPDATED,
      aggregateType: 'schedule_template',
      aggregateId: template.id,
      businessId,
      payload: { name: template.name },
      userId,
    });

    return (await this.templateRepo.findOne({
      where: { id: template.id },
      relations: { periods: true },
    }))!;
  }

  async getTemplates(
    businessId: string,
    query?: GetTemplatesQueryDto,
  ): Promise<{
    templates: ScheduleTemplate[];
    totalItems: number;
    page: number;
    pageSize: number;
  }> {
    const page = query?.page || 1;
    const pageSize = query?.pageSize || 20;
    const skip = (page - 1) * pageSize;

    const where: any = { businessId, isDeleted: false };
    if (query?.searchString) {
      where.name = ILike(`%${query.searchString}%`);
    }
    if (query?.onlyCompleted) {
      where.countDaysIncomplete = 0;
    }

    const order: any = {};
    if (query?.sortBy) {
      order[query.sortBy] = query?.sortOrder || 'ASC';
    } else {
      order.updatedAt = 'DESC';
    }

    const [templates, totalItems] = await this.templateRepo.findAndCount({
      where,
      relations: { periods: true },
      order,
      skip,
      take: pageSize,
    });

    return { templates, totalItems, page, pageSize };
  }

  async getTemplateById(
    businessId: string,
    templateId: string,
  ): Promise<ScheduleTemplate> {
    const template = await this.templateRepo.findOne({
      where: { id: templateId, businessId, isDeleted: false },
      relations: { periods: true },
    });
    if (!template) throw new NotFoundException('Template not found');
    return template;
  }

  async duplicateTemplate(
    businessId: string,
    templateId: string,
    _userId?: string,
  ): Promise<ScheduleTemplate> {
    const source = await this.getTemplateById(businessId, templateId);

    const newTemplate = this.templateRepo.create({
      businessId,
      name: `${source.name} (Copy)`.slice(0, 50),
      dayOfWeek: source.dayOfWeek,
      workingHours: source.workingHours,
      breaks: source.breaks,
      countDaysComplete: source.countDaysComplete,
      countDaysIncomplete: source.countDaysIncomplete,
    });
    await this.templateRepo.save(newTemplate);

    if (source.periods?.length > 0) {
      const periods = source.periods.map((p) =>
        this.periodRepo.create({
          templateId: newTemplate.id,
          type: p.type,
          startTime: p.startTime,
          endTime: p.endTime,
          placeholderLabel: p.placeholderLabel,
          serviceIds: p.serviceIds,
          maxAppointmentCount: p.maxAppointmentCount,
          isActiveOnMonday: p.isActiveOnMonday,
          isActiveOnTuesday: p.isActiveOnTuesday,
          isActiveOnWednesday: p.isActiveOnWednesday,
          isActiveOnThursday: p.isActiveOnThursday,
          isActiveOnFriday: p.isActiveOnFriday,
          isActiveOnSaturday: p.isActiveOnSaturday,
          isActiveOnSunday: p.isActiveOnSunday,
        }),
      );
      await this.periodRepo.save(periods);
    }

    return (await this.templateRepo.findOne({
      where: { id: newTemplate.id },
      relations: { periods: true },
    }))!;
  }

  async deleteTemplates(
    businessId: string,
    dto: DeleteTemplatesDto,
    userId?: string,
  ): Promise<{ deleted: number }> {
    const result = await this.templateRepo.update(
      { id: In(dto.templateIds), businessId },
      { isDeleted: true, isActive: false },
    );

    await this.eventStore.publish({
      eventType: EventType.SCHEDULE_TEMPLATE_DELETED,
      aggregateType: 'schedule_template',
      aggregateId: dto.templateIds.join(','),
      businessId,
      payload: { templateIds: dto.templateIds },
      userId,
    });

    return { deleted: result.affected || 0 };
  }

  async createDirectSchedule(
    businessId: string,
    dto: CreateDirectScheduleDto,
    userId?: string,
  ): Promise<{ slotsCreated: number; periodIds: string[]; slotIds: string[] }> {
    const targetDate = new Date(dto.date);
    if (Number.isNaN(targetDate.getTime())) {
      throw new BadRequestException(`Invalid schedule date: "${dto.date}"`);
    }

    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    targetDate.setUTCHours(0, 0, 0, 0);

    if (targetDate < today) {
      throw new BadRequestException('Cannot create schedule for a past date');
    }

    // Validate that submitted periods do not overlap with each other
    const normalizedPeriods = dto.periods.map((p) =>
      this.normalizePeriodFields(p),
    );
    this.validatePeriodsNoOverlap(normalizedPeriods);

    const SLOT_GRANULARITY = 10;
    const slotsToSave: Partial<SchedulingSlot>[] = [];
    const periodsToSave: Partial<SchedulingPeriod>[] = [];

    // Delete existing micro-slots and applied periods for this employee/day
    const dayStart = new Date(targetDate);
    dayStart.setUTCHours(0, 0, 0, 0);
    const dayEnd = new Date(targetDate);
    dayEnd.setUTCHours(23, 59, 59, 999);
    await Promise.all([
      this.slotRepo.delete({
        employeeId: dto.employeeId,
        businessId,
        startTime: Between(dayStart, dayEnd) as any,
      }),
      this.schedulingPeriodRepo.delete({
        employeeId: dto.employeeId,
        businessId,
        startTime: Between(dayStart, dayEnd) as any,
      }),
    ]);

    for (const period of normalizedPeriods) {
      const [startH, startM] = period.startTime.split(':').map(Number);
      const [endH, endM] = period.endTime.split(':').map(Number);

      const periodStart = new Date(targetDate);
      periodStart.setUTCHours(startH, startM, 0, 0);
      const periodEnd = new Date(targetDate);
      periodEnd.setUTCHours(endH, endM, 0, 0);

      const validServiceIds = (period.serviceIds || []).filter(Boolean);

      // Always create one applied period record for calendar display
      periodsToSave.push({
        businessId,
        employeeId: dto.employeeId,
        startTime: new Date(periodStart),
        endTime: new Date(periodEnd),
        type: period.type,
        placeholderLabel: period.placeholderLabel,
        serviceIds: validServiceIds.length > 0 ? validServiceIds : null,
        maxAppointmentCount:
          period.type === TemplatePeriodType.SERVICE_BLOCK
            ? period.maxAppointmentCount || 1
            : 0,
        templateId: null,
      });

      if (period.type !== TemplatePeriodType.SERVICE_BLOCK) {
        // One blocking micro-slot covering the whole period
        slotsToSave.push({
          businessId,
          employeeId: dto.employeeId,
          startTime: periodStart,
          endTime: periodEnd,
          status:
            period.type === TemplatePeriodType.UNAVAILABLE_BLOCK
              ? SlotStatus.UNAVAILABLE
              : SlotStatus.BLOCKED,
          placeholderLabel: period.placeholderLabel,
          maxAppointmentCount: 0,
          appointmentCount: 0,
        });
        continue;
      }

      // SERVICE_BLOCK: generate 10-minute micro-slots for booking counting
      let current = new Date(periodStart);
      while (
        current.getTime() + SLOT_GRANULARITY * 60000 <=
        periodEnd.getTime()
      ) {
        const slotEnd = new Date(current.getTime() + SLOT_GRANULARITY * 60000);
        slotsToSave.push({
          businessId,
          employeeId: dto.employeeId,
          startTime: new Date(current),
          endTime: slotEnd,
          status: SlotStatus.AVAILABLE,
          serviceId: validServiceIds[0] || undefined,
          serviceIds: validServiceIds.length > 0 ? validServiceIds : null,
          placeholderLabel: period.placeholderLabel,
          maxAppointmentCount: period.maxAppointmentCount || 1,
          appointmentCount: 0,
        });
        current = new Date(current.getTime() + SLOT_GRANULARITY * 60000);
      }
    }

    let savedSlots: SchedulingSlot[] = [];
    let savedPeriods: SchedulingPeriod[] = [];
    if (slotsToSave.length > 0) {
      savedSlots = await this.slotRepo.save(slotsToSave as SchedulingSlot[]);
    }
    if (periodsToSave.length > 0) {
      savedPeriods = await this.schedulingPeriodRepo.save(
        periodsToSave as SchedulingPeriod[],
      );
    }

    await this.eventStore.publish({
      eventType: EventType.SCHEDULE_SLOTS_GENERATED,
      aggregateType: 'schedule_slot',
      aggregateId: dto.employeeId,
      businessId,
      payload: {
        employeeId: dto.employeeId,
        date: dto.date,
        slotsCreated: slotsToSave.length,
      },
      userId,
    });

    return buildScheduleCreationSnapshot(
      savedPeriods,
      savedSlots,
      slotsToSave.length,
    );
  }

  /** Reverts a direct schedule creation captured in workflow undo snapshots. */
  async revertCreatedSchedule(
    businessId: string,
    snapshot: { periodIds?: string[]; slotIds?: string[] },
  ): Promise<{ periodsRemoved: number; slotsRemoved: number }> {
    return deleteScheduleUndoSnapshot(businessId, snapshot, {
      deletePeriods: async (bizId, periodIds) => {
        const result = await this.schedulingPeriodRepo.delete({
          id: In(periodIds),
          businessId: bizId,
        });
        return result.affected;
      },
      deleteSlots: async (bizId, slotIds) => {
        const result = await this.slotRepo.delete({
          id: In(slotIds),
          businessId: bizId,
        });
        return result.affected;
      },
    });
  }

  /** Remove applied schedule periods and micro-slots for a provider on one day (does not cancel bookings). */
  async clearScheduleForDay(
    businessId: string,
    dto: { employeeId: string; date: string },
    userId?: string,
  ): Promise<{ periodsRemoved: number; slotsRemoved: number }> {
    const targetDate = new Date(dto.date);
    targetDate.setUTCHours(0, 0, 0, 0);
    const dayStart = new Date(targetDate);
    dayStart.setUTCHours(0, 0, 0, 0);
    const dayEnd = new Date(targetDate);
    dayEnd.setUTCHours(23, 59, 59, 999);

    const [slotResult, periodResult] = await Promise.all([
      this.slotRepo.delete({
        employeeId: dto.employeeId,
        businessId,
        startTime: Between(dayStart, dayEnd) as any,
      }),
      this.schedulingPeriodRepo.delete({
        employeeId: dto.employeeId,
        businessId,
        startTime: Between(dayStart, dayEnd) as any,
      }),
    ]);

    await this.eventStore.publish({
      eventType: EventType.SCHEDULE_UPDATED,
      aggregateType: 'schedule_slot',
      aggregateId: dto.employeeId,
      businessId,
      payload: {
        employeeId: dto.employeeId,
        date: dto.date,
        cleared: true,
        periodsRemoved: periodResult.affected ?? 0,
        slotsRemoved: slotResult.affected ?? 0,
      },
      userId,
    });

    return {
      periodsRemoved: periodResult.affected ?? 0,
      slotsRemoved: slotResult.affected ?? 0,
    };
  }

  /**
   * Append service_block periods (and micro-slots) for a day without removing existing schedule.
   */
  async addServicePeriods(
    businessId: string,
    dto: {
      employeeId: string;
      date: string;
      periods: Array<{
        startTime: string;
        endTime: string;
        serviceIds: string[];
        maxAppointmentCount?: number;
      }>;
    },
    userId?: string,
  ): Promise<{ periodsCreated: number; slotsCreated: number }> {
    if (!dto.periods.length) {
      return { periodsCreated: 0, slotsCreated: 0 };
    }

    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const targetDate = new Date(dto.date);
    targetDate.setUTCHours(0, 0, 0, 0);

    if (targetDate < today) {
      throw new BadRequestException(
        'Cannot add schedule periods for a past date',
      );
    }

    const dayStart = new Date(targetDate);
    dayStart.setUTCHours(0, 0, 0, 0);
    const dayEnd = new Date(targetDate);
    dayEnd.setUTCHours(23, 59, 59, 999);

    const existingPeriods = await this.schedulingPeriodRepo.find({
      where: {
        businessId,
        employeeId: dto.employeeId,
        startTime: Between(dayStart, dayEnd),
      },
    });

    const normalizedNew = dto.periods.map((p) => this.normalizePeriodFields(p));
    const combinedForValidation = [
      ...existingPeriods.map((p) => ({
        startTime: this.periodToHHmm(p.startTime),
        endTime: this.periodToHHmm(p.endTime),
      })),
      ...normalizedNew,
    ];
    this.validatePeriodsNoOverlap(combinedForValidation);

    const SLOT_GRANULARITY = 10;
    const slotsToSave: Partial<SchedulingSlot>[] = [];
    const periodsToSave: Partial<SchedulingPeriod>[] = [];

    for (const period of normalizedNew) {
      const [startH, startM] = period.startTime.split(':').map(Number);
      const [endH, endM] = period.endTime.split(':').map(Number);

      const periodStart = new Date(targetDate);
      periodStart.setUTCHours(startH, startM, 0, 0);
      const periodEnd = new Date(targetDate);
      periodEnd.setUTCHours(endH, endM, 0, 0);

      const validServiceIds = (period.serviceIds || []).filter(Boolean);

      periodsToSave.push({
        businessId,
        employeeId: dto.employeeId,
        startTime: new Date(periodStart),
        endTime: new Date(periodEnd),
        type: TemplatePeriodType.SERVICE_BLOCK,
        serviceIds: validServiceIds.length > 0 ? validServiceIds : null,
        maxAppointmentCount: period.maxAppointmentCount || 1,
        templateId: null,
      });

      // Replace bookable micro-slots in this window so overlapping gap fills do not stack conflicting service_ids.
      await this.slotRepo
        .createQueryBuilder('slot')
        .delete()
        .where('slot.businessId = :businessId', { businessId })
        .andWhere('slot.employeeId = :employeeId', {
          employeeId: dto.employeeId,
        })
        .andWhere('slot.startTime >= :periodStart', { periodStart })
        .andWhere('slot.startTime < :periodEnd', { periodEnd })
        .andWhere('slot.status = :status', { status: SlotStatus.AVAILABLE })
        .andWhere('slot.appointmentCount = 0')
        .execute();

      let current = new Date(periodStart);
      while (
        current.getTime() + SLOT_GRANULARITY * 60000 <=
        periodEnd.getTime()
      ) {
        const slotEnd = new Date(current.getTime() + SLOT_GRANULARITY * 60000);
        slotsToSave.push({
          businessId,
          employeeId: dto.employeeId,
          startTime: new Date(current),
          endTime: slotEnd,
          status: SlotStatus.AVAILABLE,
          serviceId: validServiceIds[0] || undefined,
          serviceIds: validServiceIds.length > 0 ? validServiceIds : null,
          maxAppointmentCount: period.maxAppointmentCount || 1,
          appointmentCount: 0,
        });
        current = new Date(current.getTime() + SLOT_GRANULARITY * 60000);
      }
    }

    if (periodsToSave.length > 0) {
      await this.schedulingPeriodRepo.save(periodsToSave as SchedulingPeriod[]);
    }
    if (slotsToSave.length > 0) {
      await this.slotRepo.save(slotsToSave as SchedulingSlot[]);
    }

    await this.eventStore.publish({
      eventType: EventType.SCHEDULE_SLOTS_GENERATED,
      aggregateType: 'schedule_slot',
      aggregateId: dto.employeeId,
      businessId,
      payload: {
        employeeId: dto.employeeId,
        date: dto.date,
        periodsCreated: periodsToSave.length,
        slotsCreated: slotsToSave.length,
      },
      userId,
    });

    return {
      periodsCreated: periodsToSave.length,
      slotsCreated: slotsToSave.length,
    };
  }

  private periodToHHmm(date: Date): string {
    const hh = String(date.getUTCHours()).padStart(2, '0');
    const mm = String(date.getUTCMinutes()).padStart(2, '0');
    return `${hh}:${mm}`;
  }

  async assignSchedule(
    businessId: string,
    dto: AssignScheduleDto,
    userId?: string,
  ): Promise<ScheduleAssignment> {
    const assignment = await this.assignmentRepo.save(
      this.assignmentRepo.create({
        employeeId: dto.employeeId,
        templateId: dto.templateId,
        effectiveFrom: new Date(dto.effectiveFrom),
        effectiveTo: dto.effectiveTo ? new Date(dto.effectiveTo) : undefined,
      }),
    );
    await this.eventStore.publish({
      eventType: EventType.SCHEDULE_UPDATED,
      aggregateType: 'schedule_assignment',
      aggregateId: assignment.id,
      businessId,
      payload: { employeeId: dto.employeeId, templateId: dto.templateId },
      userId,
    });
    return assignment;
  }

  async getAssignments(employeeId: string): Promise<ScheduleAssignment[]> {
    return this.assignmentRepo.find({
      where: { employeeId },
      relations: { template: true },
      order: { effectiveFrom: 'DESC' },
    });
  }

  async createOverride(
    businessId: string,
    dto: CreateOverrideDto,
    userId?: string,
  ): Promise<ScheduleOverride> {
    const override = await this.overrideRepo.save(
      this.overrideRepo.create({
        businessId,
        employeeId: dto.employeeId,
        date: new Date(dto.date),
        type: dto.type,
        customHours: dto.customHours,
        reason: dto.reason,
      }),
    );
    await this.eventStore.publish({
      eventType: EventType.SCHEDULE_OVERRIDE_CREATED,
      aggregateType: 'schedule_override',
      aggregateId: override.id,
      businessId,
      payload: { employeeId: dto.employeeId, type: dto.type, date: dto.date },
      userId,
    });
    return override;
  }

  async getOverrides(
    businessId: string,
    employeeId?: string,
  ): Promise<ScheduleOverride[]> {
    const where: any = { businessId };
    if (employeeId) where.employeeId = employeeId;
    return this.overrideRepo.find({ where, order: { date: 'ASC' } });
  }

  /**
   * Validates that template periods don't overlap on any given day they are both active.
   * Groups periods by which days they are active and checks each day independently.
   */
  private validateTemplatePeriodsDayOverlap(
    periods: Array<{
      startTime: string;
      endTime: string;
      isActiveOnMonday?: boolean;
      isActiveOnTuesday?: boolean;
      isActiveOnWednesday?: boolean;
      isActiveOnThursday?: boolean;
      isActiveOnFriday?: boolean;
      isActiveOnSaturday?: boolean;
      isActiveOnSunday?: boolean;
    }>,
  ): void {
    const dayKeys = [
      'isActiveOnSunday',
      'isActiveOnMonday',
      'isActiveOnTuesday',
      'isActiveOnWednesday',
      'isActiveOnThursday',
      'isActiveOnFriday',
      'isActiveOnSaturday',
    ] as const;

    for (const dayKey of dayKeys) {
      const dayPeriods = periods.filter((p) => p[dayKey]);
      if (dayPeriods.length > 1) {
        this.validatePeriodsNoOverlap(dayPeriods);
      }
    }
  }

  /**
   * Validates that a list of periods (each with startTime / endTime as "HH:MM" strings)
   * does not contain any overlapping ranges.
   */
  private validatePeriodsNoOverlap(
    periods: Array<{ startTime: string; endTime: string }>,
  ): void {
    const toMinutes = (hhmm: string) => {
      const [h, m] = hhmm.split(':').map(Number);
      return h * 60 + m;
    };

    const sorted = [...periods]
      .map((p, i) => ({
        index: i,
        start: toMinutes(p.startTime),
        end: toMinutes(p.endTime),
      }))
      .sort((a, b) => a.start - b.start);

    for (let i = 0; i < sorted.length; i++) {
      const cur = sorted[i];
      if (cur.end <= cur.start) {
        throw new BadRequestException(
          `Period #${cur.index + 1} has an invalid time range: end must be after start.`,
        );
      }
      if (i + 1 < sorted.length) {
        const next = sorted[i + 1];
        if (next.start < cur.end) {
          throw new BadRequestException(
            `Periods overlap: ${periods[cur.index].startTime}–${periods[cur.index].endTime} ` +
              `conflicts with ${periods[next.index].startTime}–${periods[next.index].endTime}. ` +
              `Each period must be a completely independent, non-overlapping time block.`,
          );
        }
      }
    }
  }

  private updateTemplateCompleteness(
    template: ScheduleTemplate,
    periods: SchedulingTemplatePeriod[],
  ): void {
    const dayFlags = [
      'isActiveOnMonday',
      'isActiveOnTuesday',
      'isActiveOnWednesday',
      'isActiveOnThursday',
      'isActiveOnFriday',
      'isActiveOnSaturday',
      'isActiveOnSunday',
    ] as const;
    let complete = 0;
    let incomplete = 0;

    for (const flag of dayFlags) {
      const hasActivePeriod = periods.some((p) => p[flag]);
      if (hasActivePeriod) {
        const allPeriodsValid = periods
          .filter((p) => p[flag])
          .every((p) => p.startTime && p.endTime && p.startTime < p.endTime);
        if (allPeriodsValid) {
          complete++;
        } else {
          incomplete++;
        }
      }
    }

    template.countDaysComplete = complete;
    template.countDaysIncomplete = incomplete;
  }

  /**
   * Returns applied scheduling periods (whole blocks) for calendar display.
   * These are the period records created when a template is applied or a direct
   * schedule is created — each one represents a full time window (e.g. 09:00–12:00).
   *
   * NOTE: micro-slots (SchedulingSlot) are NOT returned here; they are used
   * internally for booking counting/locking only.
   */
  async getProviderCalendar(
    businessId: string,
    employeeId: string,
    startDate: string,
    endDate: string,
  ) {
    if (!employeeId) {
      return { periods: [] };
    }

    const start = new Date(startDate);
    start.setUTCHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setUTCHours(23, 59, 59, 999);

    const periods = await this.schedulingPeriodRepo
      .createQueryBuilder('p')
      .leftJoinAndSelect('p.employee', 'employee')
      .where('p.business_id = :businessId', { businessId })
      .andWhere('p.employee_id = :employeeId', { employeeId })
      .andWhere('p.startTime >= :start', { start })
      .andWhere('p.startTime <= :end', { end })
      .orderBy('p.startTime', 'ASC')
      .getMany();

    return {
      periods: periods.map((p) => ({
        id: p.id,
        startTime: p.startTime,
        endTime: p.endTime,
        type: p.type,
        serviceIds: p.serviceIds ?? [],
        placeholderLabel: p.placeholderLabel,
        maxAppointmentCount: p.maxAppointmentCount,
        employeeId: p.employeeId,
        employeeName: p.employee?.name || null,
      })),
    };
  }
}
