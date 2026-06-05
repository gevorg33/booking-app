import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, Not } from 'typeorm';
import { Booking, BookingStatus } from './entities/booking.entity.js';
import { Service } from '../service/entities/service.entity.js';
import { Employee } from '../employee/entities/employee.entity.js';
import { SchedulingPeriod } from '../schedule/entities/scheduling-period.entity.js';
import { TemplatePeriodType } from '../schedule/entities/scheduling-template-period.entity.js';
import {
  formatTimeDisplay,
  parseDateInput,
  buildUtcStartTimeFromDayAndTime,
} from '../../common/utils/date-format.util.js';
import {
  normalizeTime24,
  timeToMinutes,
} from '../../common/utils/time-format.util.js';
import {
  isWallClockSlotBookable,
  addDaysToDateKey,
} from '../../common/utils/timezone.util.js';
import { findScheduleGapsInWindow } from '../schedule/helpers/schedule-gap.helpers.js';
import type {
  BookingFallbackResolveInput,
  BookingFallbackResolveResult,
  SlotAvailabilityCheck,
} from './booking-slot-resolver.types.js';

@Injectable()
export class BookingSlotResolverService {
  constructor(
    @InjectRepository(Booking)
    private readonly bookingRepo: Repository<Booking>,
    @InjectRepository(Service)
    private readonly serviceRepo: Repository<Service>,
    @InjectRepository(Employee)
    private readonly employeeRepo: Repository<Employee>,
    @InjectRepository(SchedulingPeriod)
    private readonly periodRepo: Repository<SchedulingPeriod>,
  ) {}

  describeUnavailable(
    check: SlotAvailabilityCheck,
    serviceName: string,
    timeSlot: string,
    isoDay: string,
  ): string {
    switch (check.reason) {
      case 'provider_not_assigned':
        return `${check.employeeName} does not provide ${serviceName}. Choose another provider or service.`;
      case 'no_schedule':
        return `${check.employeeName} has no schedule on ${isoDay}. Pick another day or provider.`;
      case 'service_not_scheduled':
        return `${serviceName} is not scheduled for ${check.employeeName} on ${isoDay}. The provider may not offer this service that day.`;
      case 'slot_unavailable':
        return `${check.employeeName} is not free at ${timeSlot} on ${isoDay} for ${serviceName}.`;
      case 'past_time':
        return `Cannot book ${serviceName} in the past. Choose a future time slot.`;
      default:
        return `${check.employeeName} is not available for ${serviceName} at ${timeSlot} on ${isoDay}.`;
    }
  }

  async assertBookable(params: {
    businessId: string;
    employeeId: string;
    employeeName: string;
    serviceId: string;
    serviceName: string;
    isoDay: string;
    timeSlot: string;
    timeZone?: string;
  }): Promise<void> {
    const check = await this.checkSlotAvailability(
      params.businessId,
      params.employeeId,
      params.employeeName,
      params.serviceId,
      params.isoDay,
      params.timeSlot,
      params.timeZone,
    );
    if (!check.available) {
      throw new BadRequestException(
        this.describeUnavailable(
          check,
          params.serviceName,
          params.timeSlot,
          params.isoDay,
        ),
      );
    }
  }

  snapTo10min(hhmm: string): string {
    const normalized = normalizeTime24(hhmm);
    const [h, m] = normalized.split(':').map(Number);
    const snapped = Math.round((h * 60 + m) / 10) * 10;
    const hh = Math.floor(snapped / 60);
    const mm = snapped % 60;
    return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
  }

  async checkSlotAvailability(
    businessId: string,
    employeeId: string,
    employeeName: string,
    serviceId: string,
    isoDay: string,
    timeSlot: string,
    timeZone = 'UTC',
  ): Promise<SlotAvailabilityCheck> {
    const employee = await this.employeeRepo.findOne({
      where: { id: employeeId, businessId, isActive: true },
    });
    if (
      employee?.serviceIds?.length &&
      !employee.serviceIds.includes(serviceId)
    ) {
      return {
        employeeId,
        employeeName,
        available: false,
        hasSchedule: false,
        openSlots: [],
        reason: 'provider_not_assigned',
      };
    }

    const row = await this.getProviderAvailabilityForService(
      businessId,
      employeeId,
      serviceId,
      isoDay,
    );
    const snapped = this.snapTo10min(timeSlot);
    const service = await this.serviceRepo.findOne({
      where: { id: serviceId, businessId },
    });
    const duration =
      (service?.durationMinutes ?? 30) + (service?.bufferMinutes ?? 0);

    if (!isWallClockSlotBookable(isoDay, snapped, timeZone)) {
      return {
        employeeId,
        employeeName,
        available: false,
        hasSchedule: row.hasSchedule,
        openSlots: row.openSlots,
        reason: 'past_time',
      };
    }

    if (!row.hasSchedule) {
      return {
        employeeId,
        employeeName,
        available: false,
        hasSchedule: false,
        openSlots: [],
        reason: 'no_schedule',
      };
    }

    if (!row.hasServiceBlock) {
      return {
        employeeId,
        employeeName,
        available: false,
        hasSchedule: true,
        openSlots: [],
        reason: 'service_not_scheduled',
      };
    }

    const slotFits = this.isTimeSlotBookable(row.openSlots, snapped, duration);
    if (!slotFits) {
      return {
        employeeId,
        employeeName,
        available: false,
        hasSchedule: true,
        openSlots: row.openSlots,
        reason: 'slot_unavailable',
      };
    }

    return {
      employeeId,
      employeeName,
      available: true,
      hasSchedule: row.hasSchedule,
      openSlots: row.openSlots,
    };
  }

  async resolveWithFallback(
    input: BookingFallbackResolveInput,
  ): Promise<BookingFallbackResolveResult | null> {
    const timeSlot = this.snapTo10min(input.timeSlot);
    const timeZone = input.timeZone ?? 'UTC';
    const checks: SlotAvailabilityCheck[] = [];

    for (const provider of input.providerPriority) {
      const check = await this.checkSlotAvailability(
        input.businessId,
        provider.id,
        provider.name,
        input.serviceId,
        input.isoDay,
        timeSlot,
        timeZone,
      );
      checks.push(check);
      if (check.available) {
        return {
          employeeId: provider.id,
          employeeName: provider.name,
          serviceId: input.serviceId,
          isoDay: input.isoDay,
          timeSlot,
          startTime: buildUtcStartTimeFromDayAndTime(input.isoDay, timeSlot),
          matchReason: 'priority_provider',
          checks,
        };
      }
    }

    if (input.fallbackAnyProvider && input.allActiveProviders?.length) {
      const tried = new Set(input.providerPriority.map((p) => p.id));
      for (const provider of input.allActiveProviders) {
        if (tried.has(provider.id)) continue;
        const check = await this.checkSlotAvailability(
          input.businessId,
          provider.id,
          provider.name,
          input.serviceId,
          input.isoDay,
          timeSlot,
          timeZone,
        );
        checks.push(check);
        if (check.available) {
          return {
            employeeId: provider.id,
            employeeName: provider.name,
            serviceId: input.serviceId,
            isoDay: input.isoDay,
            timeSlot,
            startTime: buildUtcStartTimeFromDayAndTime(input.isoDay, timeSlot),
            matchReason: 'any_provider',
            checks,
          };
        }
      }
    }

    return null;
  }

  private isTimeSlotBookable(
    openSlots: Array<{ start: string; end: string }>,
    timeSlot: string,
    durationMinutes: number,
  ): boolean {
    const startMin = timeToMinutes(timeSlot);
    const endMin = startMin + durationMinutes;
    return openSlots.some((s) => {
      const os = timeToMinutes(s.start);
      const oe = timeToMinutes(s.end);
      return startMin >= os && endMin <= oe;
    });
  }

  private timesOverlap(
    aStart: Date,
    aEnd: Date,
    bStart: Date,
    bEnd: Date,
  ): boolean {
    return aStart < bEnd && bStart < aEnd;
  }

  private mergeOpenSlotRanges(
    slots: Array<{ startTime: Date; endTime: Date }>,
  ): Array<{ start: string; end: string }> {
    if (slots.length === 0) return [];
    const sorted = [...slots].sort(
      (a, b) => a.startTime.getTime() - b.startTime.getTime(),
    );
    const merged: Array<{ start: Date; end: Date }> = [
      { start: sorted[0].startTime, end: sorted[0].endTime },
    ];
    for (let i = 1; i < sorted.length; i++) {
      const slot = sorted[i];
      const last = merged[merged.length - 1];
      if (slot.startTime.getTime() <= last.end.getTime()) {
        if (slot.endTime > last.end) last.end = slot.endTime;
      } else {
        merged.push({ start: slot.startTime, end: slot.endTime });
      }
    }
    return merged.map((r) => ({
      start: formatTimeDisplay(r.start),
      end: formatTimeDisplay(r.end),
    }));
  }

  async findFirstAvailableSlot(
    businessId: string,
    employeeId: string,
    employeeName: string,
    serviceId: string,
    startIsoDay: string,
    timeZone = 'UTC',
    notBeforeTime?: string | null,
    maxDays = 1,
  ): Promise<{
    isoDay: string;
    timeSlot: string;
    openSlots: Array<{ start: string; end: string }>;
  } | null> {
    let best: {
      isoDay: string;
      timeSlot: string;
      sortKey: number;
      openSlots: Array<{ start: string; end: string }>;
    } | null = null;

    for (let offset = 0; offset < maxDays; offset++) {
      const isoDay = addDaysToDateKey(startIsoDay, offset, timeZone);
      const row = await this.getProviderAvailabilityForService(
        businessId,
        employeeId,
        serviceId,
        isoDay,
      );
      if (!row.hasServiceBlock || row.openSlots.length === 0) continue;

      for (const slot of row.openSlots) {
        if (
          !isWallClockSlotBookable(isoDay, slot.start, timeZone, notBeforeTime)
        )
          continue;
        const sortKey = offset * 24 * 60 + timeToMinutes(slot.start);
        if (!best || sortKey < best.sortKey) {
          best = {
            isoDay,
            timeSlot: slot.start,
            sortKey,
            openSlots: row.openSlots,
          };
        }
      }
    }

    return best
      ? {
          isoDay: best.isoDay,
          timeSlot: best.timeSlot,
          openSlots: best.openSlots,
        }
      : null;
  }

  private async getProviderAvailabilityForService(
    businessId: string,
    employeeId: string,
    serviceId: string,
    isoDay: string,
  ): Promise<{
    hasSchedule: boolean;
    hasServiceBlock: boolean;
    openSlots: Array<{ start: string; end: string }>;
  }> {
    const d = parseDateInput(isoDay) ?? new Date(isoDay);
    const dayStart = new Date(d);
    dayStart.setUTCHours(0, 0, 0, 0);
    const dayEnd = new Date(d);
    dayEnd.setUTCHours(23, 59, 59, 999);

    const service = await this.serviceRepo.findOne({
      where: { id: serviceId, businessId },
    });
    const minGapMinutes =
      service?.durationMinutes && service.durationMinutes > 0
        ? service.durationMinutes
        : 10;

    const [periods, bookings] = await Promise.all([
      this.periodRepo.find({
        where: {
          businessId,
          employeeId,
          startTime: Between(dayStart, dayEnd) as any,
        },
        order: { startTime: 'ASC' },
      }),
      this.bookingRepo.find({
        where: {
          businessId,
          employeeId,
          startTime: Between(dayStart, dayEnd) as any,
          status: Not(BookingStatus.CANCELLED) as any,
        },
        order: { startTime: 'ASC' },
      }),
    ]);

    const serviceBlocks = periods.filter(
      (p) =>
        p.type === TemplatePeriodType.SERVICE_BLOCK &&
        (!p.serviceIds?.length || p.serviceIds.includes(serviceId)),
    );

    if (serviceBlocks.length === 0) {
      return {
        hasSchedule: periods.length > 0,
        hasServiceBlock: false,
        openSlots: [],
      };
    }

    const openSlotCandidates: Array<{ startTime: Date; endTime: Date }> = [];
    for (const block of serviceBlocks) {
      const occupied = bookings
        .filter((b) =>
          this.timesOverlap(
            block.startTime,
            block.endTime,
            b.startTime,
            b.endTime,
          ),
        )
        .map((b) => ({ startTime: b.startTime, endTime: b.endTime }));

      const gaps = findScheduleGapsInWindow(
        d,
        formatTimeDisplay(block.startTime),
        formatTimeDisplay(block.endTime),
        occupied,
        minGapMinutes,
      );

      for (const gap of gaps) {
        const [sh, sm] = gap.startTime.split(':').map(Number);
        const [eh, em] = gap.endTime.split(':').map(Number);
        const startTime = new Date(d);
        startTime.setUTCHours(sh, sm, 0, 0);
        const endTime = new Date(d);
        endTime.setUTCHours(eh, em, 0, 0);
        openSlotCandidates.push({ startTime, endTime });
      }
    }

    return {
      hasSchedule: true,
      hasServiceBlock: true,
      openSlots: this.mergeOpenSlotRanges(openSlotCandidates),
    };
  }
}
