import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BlockSchedule } from '../entities/block-schedule.entity.js';
import { BlockScheduleInstance } from '../entities/block-schedule-instance.entity.js';
import { SchedulingPeriod } from '../entities/scheduling-period.entity.js';
import { SchedulingSlot, SlotStatus } from '../entities/scheduling-slot.entity.js';
import { TemplatePeriodType } from '../entities/scheduling-template-period.entity.js';
import { Employee } from '../../employee/entities/employee.entity.js';
import {
  CreateBlockScheduleDto,
  UpdateBlockScheduleDto,
} from '../dto/block-schedule.dto.js';
import {
  buildUtcDateTime,
  dayIsoFromDate,
  getDaysInRange,
  isWeekdayActive,
  periodsCanMerge,
  splitPeriodByBlock,
} from '../helpers/block-schedule.helpers.js';
import { EventStoreService } from '../../../events/store/event-store.service.js';
import { EventType } from '../../../events/event-types.js';

const SLOT_DURATION_MINUTES = 10;

@Injectable()
export class BlockScheduleService {
  private readonly logger = new Logger(BlockScheduleService.name);

  constructor(
    @InjectRepository(BlockSchedule) private blockScheduleRepo: Repository<BlockSchedule>,
    @InjectRepository(BlockScheduleInstance) private instanceRepo: Repository<BlockScheduleInstance>,
    @InjectRepository(SchedulingPeriod) private periodRepo: Repository<SchedulingPeriod>,
    @InjectRepository(SchedulingSlot) private slotRepo: Repository<SchedulingSlot>,
    @InjectRepository(Employee) private employeeRepo: Repository<Employee>,
    private eventStore: EventStoreService,
  ) {}

  async list(businessId: string, employeeId?: string) {
    const where: Record<string, unknown> = { businessId, isDeleted: false };
    if (employeeId) where.employeeId = employeeId;

    const schedules = await this.blockScheduleRepo.find({
      where,
      relations: { employee: true },
      order: { updatedAt: 'DESC' },
    });

    return schedules.map((s) => this.toSummary(s));
  }

  async getOne(businessId: string, id: string) {
    const schedule = await this.blockScheduleRepo.findOne({
      where: { id, businessId, isDeleted: false },
      relations: { employee: true, instances: true },
    });
    if (!schedule) throw new NotFoundException('Block schedule not found');
    return this.toDetail(schedule);
  }

  async create(businessId: string, dto: CreateBlockScheduleDto, userId?: string) {
    await this.ensureEmployee(businessId, dto.employeeId);
    this.validateDto(dto);

    const schedule = this.blockScheduleRepo.create({
      businessId,
      employeeId: dto.employeeId,
      placeholderLabel: dto.placeholder?.trim() || 'Blocked',
      isRepetitive: dto.isRepetitive,
      ...(dto.isRepetitive && dto.repetitiveBlock
        ? {
            startDay: dto.repetitiveBlock.startDay,
            endDay: dto.repetitiveBlock.endDay,
            blockStartTime: dto.repetitiveBlock.startTime,
            blockEndTime: dto.repetitiveBlock.endTime,
            repeatWeeksCount: dto.repetitiveBlock.weeksCount,
            isActiveOnMonday: dto.repetitiveBlock.isActiveOnMonday,
            isActiveOnTuesday: dto.repetitiveBlock.isActiveOnTuesday,
            isActiveOnWednesday: dto.repetitiveBlock.isActiveOnWednesday,
            isActiveOnThursday: dto.repetitiveBlock.isActiveOnThursday,
            isActiveOnFriday: dto.repetitiveBlock.isActiveOnFriday,
            isActiveOnSaturday: dto.repetitiveBlock.isActiveOnSaturday,
            isActiveOnSunday: dto.repetitiveBlock.isActiveOnSunday,
          }
        : {
            singleStartTime: new Date(dto.singleBlock!.startTime),
            singleEndTime: new Date(dto.singleBlock!.endTime),
          }),
    });

    await this.blockScheduleRepo.save(schedule);
    const instances = await this.buildInstances(schedule);
    await this.instanceRepo.save(instances);

    for (const instance of instances) {
      await this.applyBlockWindow(
        businessId,
        schedule.employeeId,
        instance.startTime,
        instance.endTime,
        schedule.id,
        schedule.placeholderLabel,
      );
    }

    await this.publishAvailabilityUpdated(businessId, schedule.employeeId, userId);

    return this.getOne(businessId, schedule.id);
  }

  async update(businessId: string, id: string, dto: UpdateBlockScheduleDto, userId?: string) {
    const existing = await this.blockScheduleRepo.findOne({
      where: { id, businessId, isDeleted: false },
      relations: { instances: true },
    });
    if (!existing) throw new NotFoundException('Block schedule not found');

    await this.revertBlockSchedule(existing);
    await this.instanceRepo.delete({ blockScheduleId: id });

    existing.placeholderLabel = dto.placeholder?.trim() || 'Blocked';
    existing.isRepetitive = dto.isRepetitive;
    if (dto.isRepetitive && dto.repetitiveBlock) {
      Object.assign(existing, {
        startDay: dto.repetitiveBlock.startDay,
        endDay: dto.repetitiveBlock.endDay,
        blockStartTime: dto.repetitiveBlock.startTime,
        blockEndTime: dto.repetitiveBlock.endTime,
        repeatWeeksCount: dto.repetitiveBlock.weeksCount,
        isActiveOnMonday: dto.repetitiveBlock.isActiveOnMonday,
        isActiveOnTuesday: dto.repetitiveBlock.isActiveOnTuesday,
        isActiveOnWednesday: dto.repetitiveBlock.isActiveOnWednesday,
        isActiveOnThursday: dto.repetitiveBlock.isActiveOnThursday,
        isActiveOnFriday: dto.repetitiveBlock.isActiveOnFriday,
        isActiveOnSaturday: dto.repetitiveBlock.isActiveOnSaturday,
        isActiveOnSunday: dto.repetitiveBlock.isActiveOnSunday,
        singleStartTime: null,
        singleEndTime: null,
      });
    } else if (dto.singleBlock) {
      Object.assign(existing, {
        singleStartTime: new Date(dto.singleBlock.startTime),
        singleEndTime: new Date(dto.singleBlock.endTime),
        startDay: null,
        endDay: null,
        blockStartTime: null,
        blockEndTime: null,
      });
    }

    this.validateScheduleEntity(existing);
    await this.blockScheduleRepo.save(existing);

    const instances = await this.buildInstances(existing);
    await this.instanceRepo.save(instances);
    for (const instance of instances) {
      await this.applyBlockWindow(
        businessId,
        existing.employeeId,
        instance.startTime,
        instance.endTime,
        existing.id,
        existing.placeholderLabel,
      );
    }

    await this.publishAvailabilityUpdated(businessId, existing.employeeId, userId);
    return this.getOne(businessId, id);
  }

  async remove(businessId: string, id: string, userId?: string) {
    const schedule = await this.blockScheduleRepo.findOne({
      where: { id, businessId, isDeleted: false },
      relations: { instances: true },
    });
    if (!schedule) throw new NotFoundException('Block schedule not found');

    await this.revertBlockSchedule(schedule);
    await this.instanceRepo.delete({ blockScheduleId: id });
    schedule.isDeleted = true;
    await this.blockScheduleRepo.save(schedule);

    await this.publishAvailabilityUpdated(businessId, schedule.employeeId, userId);
    return { deleted: true };
  }

  private async revertBlockSchedule(schedule: BlockSchedule) {
    await this.periodRepo.delete({ blockScheduleId: schedule.id });

    const blockedSlots = await this.slotRepo.find({
      where: { blockScheduleId: schedule.id, businessId: schedule.businessId },
    });
    for (const slot of blockedSlots) {
      if (slot.appointmentCount > 0) {
        slot.status = SlotStatus.BOOKED;
      } else {
        slot.status = SlotStatus.AVAILABLE;
      }
      slot.blockScheduleId = null;
      await this.slotRepo.save(slot);
    }

    await this.mergeAdjacentServicePeriods(schedule.businessId, schedule.employeeId);
  }

  /** Apply a block window: split service periods and mark micro-slots blocked. */
  private async applyBlockWindow(
    businessId: string,
    employeeId: string,
    blockStart: Date,
    blockEnd: Date,
    blockScheduleId: string,
    placeholderLabel: string,
  ) {
    if (blockEnd <= blockStart) return;

    const overlappingPeriods = await this.periodRepo
      .createQueryBuilder('period')
      .where('period.business_id = :businessId', { businessId })
      .andWhere('period.employee_id = :employeeId', { employeeId })
      .andWhere('period.startTime < :blockEnd', { blockEnd })
      .andWhere('period.endTime > :blockStart', { blockStart })
      .getMany();

    for (const period of overlappingPeriods) {
      if (period.blockScheduleId) continue;

      const { before, blocked, after } = splitPeriodByBlock(
        { start: period.startTime, end: period.endTime },
        { start: blockStart, end: blockEnd },
      );

      await this.periodRepo.delete({ id: period.id });

      const toCreate: Partial<SchedulingPeriod>[] = [];

      if (before) {
        toCreate.push({
          businessId,
          employeeId,
          startTime: before.start,
          endTime: before.end,
          type: period.type,
          placeholderLabel: period.placeholderLabel,
          serviceIds: period.serviceIds,
          maxAppointmentCount: period.maxAppointmentCount,
          templateId: period.templateId,
          blockScheduleId: null,
        });
      }

      if (blocked) {
        toCreate.push({
          businessId,
          employeeId,
          startTime: blocked.start,
          endTime: blocked.end,
          type: TemplatePeriodType.BLOCKED_TIME,
          placeholderLabel,
          serviceIds: null,
          maxAppointmentCount: 0,
          templateId: null,
          blockScheduleId,
        });
      }

      if (after) {
        toCreate.push({
          businessId,
          employeeId,
          startTime: after.start,
          endTime: after.end,
          type: period.type,
          placeholderLabel: period.placeholderLabel,
          serviceIds: period.serviceIds,
          maxAppointmentCount: period.maxAppointmentCount,
          templateId: period.templateId,
          blockScheduleId: null,
        });
      }

      if (toCreate.length > 0) {
        await this.periodRepo.save(toCreate as SchedulingPeriod[]);
      }
    }

    // If no periods existed, still show the block on the calendar
    if (overlappingPeriods.length === 0) {
      await this.periodRepo.save({
        businessId,
        employeeId,
        startTime: blockStart,
        endTime: blockEnd,
        type: TemplatePeriodType.BLOCKED_TIME,
        placeholderLabel,
        serviceIds: null,
        maxAppointmentCount: 0,
        blockScheduleId,
      });
    }

    await this.blockMicroSlotsInWindow(
      businessId,
      employeeId,
      blockStart,
      blockEnd,
      blockScheduleId,
      placeholderLabel,
    );
  }

  private async blockMicroSlotsInWindow(
    businessId: string,
    employeeId: string,
    blockStart: Date,
    blockEnd: Date,
    blockScheduleId: string,
    placeholderLabel: string,
  ) {
    const existing = await this.slotRepo
      .createQueryBuilder('slot')
      .where('slot.business_id = :businessId', { businessId })
      .andWhere('slot.employee_id = :employeeId', { employeeId })
      .andWhere('slot.startTime < :blockEnd', { blockEnd })
      .andWhere('slot.endTime > :blockStart', { blockStart })
      .getMany();

    for (const slot of existing) {
      if (slot.status === SlotStatus.BLOCKED || slot.status === SlotStatus.UNAVAILABLE) continue;
      if (slot.appointmentCount > 0 || slot.status === SlotStatus.BOOKED) continue;
      slot.status = SlotStatus.BLOCKED;
      slot.placeholderLabel = placeholderLabel;
      slot.blockScheduleId = blockScheduleId;
      await this.slotRepo.save(slot);
    }

    if (existing.length === 0) {
      let current = new Date(blockStart);
      const slotsToSave: Partial<SchedulingSlot>[] = [];
      while (current.getTime() + SLOT_DURATION_MINUTES * 60000 <= blockEnd.getTime()) {
        const slotEnd = new Date(current.getTime() + SLOT_DURATION_MINUTES * 60000);
        slotsToSave.push({
          businessId,
          employeeId,
          startTime: new Date(current),
          endTime: slotEnd,
          status: SlotStatus.BLOCKED,
          placeholderLabel,
          maxAppointmentCount: 0,
          appointmentCount: 0,
          blockScheduleId,
        });
        current = slotEnd;
      }
      if (slotsToSave.length > 0) {
        await this.slotRepo.save(slotsToSave as SchedulingSlot[]);
      }
    }
  }

  private async mergeAdjacentServicePeriods(businessId: string, employeeId: string) {
    const periods = await this.periodRepo.find({
      where: {
        businessId,
        employeeId,
        type: TemplatePeriodType.SERVICE_BLOCK,
      },
      order: { startTime: 'ASC' },
    });

    let changed = true;
    while (changed) {
      changed = false;
      for (let i = 0; i < periods.length - 1; i++) {
        const a = periods[i];
        const b = periods[i + 1];
        if (periodsCanMerge(a, b)) {
          a.endTime = b.endTime;
          await this.periodRepo.save(a);
          await this.periodRepo.delete({ id: b.id });
          periods.splice(i + 1, 1);
          changed = true;
          break;
        }
      }
    }
  }

  private async buildInstances(schedule: BlockSchedule): Promise<BlockScheduleInstance[]> {
    const instances: BlockScheduleInstance[] = [];

    if (!schedule.isRepetitive && schedule.singleStartTime && schedule.singleEndTime) {
      instances.push(
        this.instanceRepo.create({
          blockScheduleId: schedule.id,
          businessId: schedule.businessId,
          employeeId: schedule.employeeId,
          startTime: schedule.singleStartTime,
          endTime: schedule.singleEndTime,
        }),
      );
      return instances;
    }

    if (!schedule.startDay || !schedule.endDay || !schedule.blockStartTime || !schedule.blockEndTime) {
      return instances;
    }

    const days = getDaysInRange(
      new Date(`${schedule.startDay}T00:00:00.000Z`),
      new Date(`${schedule.endDay}T00:00:00.000Z`),
      schedule.repeatWeeksCount,
    );

    for (const day of days) {
      if (
        !isWeekdayActive(day, {
          isActiveOnMonday: schedule.isActiveOnMonday,
          isActiveOnTuesday: schedule.isActiveOnTuesday,
          isActiveOnWednesday: schedule.isActiveOnWednesday,
          isActiveOnThursday: schedule.isActiveOnThursday,
          isActiveOnFriday: schedule.isActiveOnFriday,
          isActiveOnSaturday: schedule.isActiveOnSaturday,
          isActiveOnSunday: schedule.isActiveOnSunday,
        })
      ) {
        continue;
      }

      const dayIso = dayIsoFromDate(day);
      const startTime = buildUtcDateTime(dayIso, schedule.blockStartTime);
      const endTime = buildUtcDateTime(dayIso, schedule.blockEndTime);
      if (endTime <= startTime) continue;

      instances.push(
        this.instanceRepo.create({
          blockScheduleId: schedule.id,
          businessId: schedule.businessId,
          employeeId: schedule.employeeId,
          startTime,
          endTime,
        }),
      );
    }

    return instances;
  }

  private validateDto(dto: CreateBlockScheduleDto) {
    if (dto.isRepetitive) {
      if (!dto.repetitiveBlock) {
        throw new BadRequestException('repetitiveBlock is required when isRepetitive is true');
      }
      const { startDay, endDay, startTime, endTime, weeksCount } = dto.repetitiveBlock;
      if (new Date(endDay) < new Date(startDay)) {
        throw new BadRequestException('End day must be on or after start day');
      }
      if (buildUtcDateTime(endDay, endTime) <= buildUtcDateTime(startDay, startTime) && startDay === endDay) {
        throw new BadRequestException('Block end time must be after start time');
      }
      if (weeksCount < 1) throw new BadRequestException('weeksCount must be at least 1');
    } else {
      if (!dto.singleBlock) {
        throw new BadRequestException('singleBlock is required when isRepetitive is false');
      }
      const start = new Date(dto.singleBlock.startTime);
      const end = new Date(dto.singleBlock.endTime);
      if (end <= start) throw new BadRequestException('Block end must be after start');
      if (start < new Date()) {
        throw new BadRequestException('Cannot create a block schedule in the past');
      }
    }
  }

  private validateScheduleEntity(schedule: BlockSchedule) {
    if (schedule.isRepetitive) {
      if (!schedule.startDay || !schedule.endDay || !schedule.blockStartTime || !schedule.blockEndTime) {
        throw new BadRequestException('Incomplete repetitive block schedule');
      }
    } else if (!schedule.singleStartTime || !schedule.singleEndTime) {
      throw new BadRequestException('Incomplete single block schedule');
    }
  }

  private async ensureEmployee(businessId: string, employeeId: string) {
    const employee = await this.employeeRepo.findOne({ where: { id: employeeId, businessId } });
    if (!employee) throw new NotFoundException('Employee not found');
  }

  private async publishAvailabilityUpdated(businessId: string, employeeId: string, userId?: string) {
    await this.eventStore.publish({
      eventType: EventType.AVAILABILITY_UPDATED,
      aggregateType: 'availability',
      aggregateId: businessId,
      businessId,
      payload: { reason: 'block_schedule_changed', employeeId },
      userId,
    });
  }

  private toSummary(schedule: BlockSchedule) {
    return {
      id: schedule.id,
      employee: schedule.employee ? { id: schedule.employee.id, name: schedule.employee.name } : null,
      placeholderLabel: schedule.placeholderLabel,
      isRepetitive: schedule.isRepetitive,
      startDay: schedule.startDay,
      endDay: schedule.endDay,
      blockStartTime: schedule.blockStartTime,
      blockEndTime: schedule.blockEndTime,
      repeatWeeksCount: schedule.repeatWeeksCount,
      singleStartTime: schedule.singleStartTime?.toISOString() ?? null,
      singleEndTime: schedule.singleEndTime?.toISOString() ?? null,
      updatedAt: schedule.updatedAt.toISOString(),
      weekdays: {
        isActiveOnMonday: schedule.isActiveOnMonday,
        isActiveOnTuesday: schedule.isActiveOnTuesday,
        isActiveOnWednesday: schedule.isActiveOnWednesday,
        isActiveOnThursday: schedule.isActiveOnThursday,
        isActiveOnFriday: schedule.isActiveOnFriday,
        isActiveOnSaturday: schedule.isActiveOnSaturday,
        isActiveOnSunday: schedule.isActiveOnSunday,
      },
    };
  }

  private toDetail(schedule: BlockSchedule) {
    return {
      ...this.toSummary(schedule),
      instances: (schedule.instances ?? []).map((i) => ({
        id: i.id,
        startTime: i.startTime.toISOString(),
        endTime: i.endTime.toISOString(),
      })),
    };
  }
}
