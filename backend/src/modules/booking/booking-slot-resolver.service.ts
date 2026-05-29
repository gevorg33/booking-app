import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, Not } from 'typeorm';
import { Booking, BookingStatus } from './entities/booking.entity.js';
import { Service } from '../service/entities/service.entity.js';
import { SchedulingPeriod } from '../schedule/entities/scheduling-period.entity.js';
import { TemplatePeriodType } from '../schedule/entities/scheduling-template-period.entity.js';
import {
  formatTimeDisplay,
  parseDateInput,
  buildUtcStartTimeFromDayAndTime,
} from '../../common/utils/date-format.util.js';
import { normalizeTime24, timeToMinutes } from '../../common/utils/time-format.util.js';
import { isWallClockSlotBookable } from '../../common/utils/timezone.util.js';
import { findScheduleGapsInWindow } from '../schedule/helpers/schedule-gap.helpers.js';
import type {
  BookingFallbackResolveInput,
  BookingFallbackResolveResult,
  SlotAvailabilityCheck,
} from './booking-slot-resolver.types.js';

@Injectable()
export class BookingSlotResolverService {
  constructor(
    @InjectRepository(Booking) private readonly bookingRepo: Repository<Booking>,
    @InjectRepository(Service) private readonly serviceRepo: Repository<Service>,
    @InjectRepository(SchedulingPeriod) private readonly periodRepo: Repository<SchedulingPeriod>,
  ) {}

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
    const row = await this.getProviderAvailabilityForService(businessId, employeeId, serviceId, isoDay);
    const snapped = this.snapTo10min(timeSlot);
    const service = await this.serviceRepo.findOne({ where: { id: serviceId, businessId } });
    const duration = (service?.durationMinutes ?? 30) + (service?.bufferMinutes ?? 0);

    const available =
      row.hasServiceBlock &&
      this.isTimeSlotBookable(row.openSlots, snapped, duration) &&
      isWallClockSlotBookable(isoDay, snapped, timeZone);

    return {
      employeeId,
      employeeName,
      available,
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

  private timesOverlap(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date): boolean {
    return aStart < bEnd && bStart < aEnd;
  }

  private mergeOpenSlotRanges(
    slots: Array<{ startTime: Date; endTime: Date }>,
  ): Array<{ start: string; end: string }> {
    if (slots.length === 0) return [];
    const sorted = [...slots].sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
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

    const service = await this.serviceRepo.findOne({ where: { id: serviceId, businessId } });
    const minGapMinutes =
      service?.durationMinutes && service.durationMinutes > 0 ? service.durationMinutes : 10;

    const [periods, bookings] = await Promise.all([
      this.periodRepo.find({
        where: { businessId, employeeId, startTime: Between(dayStart, dayEnd) as any },
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
        .filter((b) => this.timesOverlap(block.startTime, block.endTime, b.startTime, b.endTime))
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
