import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, Not, In } from 'typeorm';
import { Employee } from '../employee/entities/employee.entity.js';
import {
  Booking,
  BookingStatus,
  PaymentStatus,
} from '../booking/entities/booking.entity.js';
import { SchedulingEngineService } from '../../engine/scheduling/scheduling-engine.service.js';
import { AiSuggestionsService } from './ai-suggestions.service.js';
import { formatDateDisplay } from '../../common/utils/date-format.util.js';

export interface MorningBriefing {
  date: string;
  utilizationPercent: number;
  todaysBookings: number;
  cancellationsToday: number;
  conflictsToday: number;
  unpaidToday: number;
  highlights: string[];
  suggestedActions: Array<{ title: string; prompt: string }>;
}

@Injectable()
export class AiBriefingService {
  constructor(
    @InjectRepository(Employee) private employeeRepo: Repository<Employee>,
    @InjectRepository(Booking) private bookingRepo: Repository<Booking>,
    private schedulingEngine: SchedulingEngineService,
    private suggestions: AiSuggestionsService,
  ) {}

  async getMorningBriefing(businessId: string): Promise<MorningBriefing> {
    const now = new Date();
    const dayStart = new Date(now);
    dayStart.setUTCHours(0, 0, 0, 0);
    const dayEnd = new Date(now);
    dayEnd.setUTCHours(23, 59, 59, 999);

    const weekEnd = new Date(dayStart);
    weekEnd.setUTCDate(weekEnd.getUTCDate() + 7);

    const [
      employees,
      todaysBookings,
      cancellationsToday,
      conflicts,
      suggestions,
    ] = await Promise.all([
      this.employeeRepo.find({ where: { businessId, isActive: true } }),
      this.bookingRepo.find({
        where: {
          businessId,
          startTime: Between(dayStart, dayEnd) as any,
          status: Not(In([BookingStatus.CANCELLED])) as any,
        },
      }),
      this.bookingRepo.count({
        where: {
          businessId,
          status: BookingStatus.CANCELLED,
          updatedAt: Between(dayStart, dayEnd) as any,
        },
      }),
      this.schedulingEngine.findConflicts(businessId, {
        start: dayStart,
        end: weekEnd,
      }),
      this.suggestions.getSuggestions(businessId, { route: '/dashboard' }),
    ]);

    const unpaidToday = todaysBookings.filter(
      (b) =>
        b.paymentStatus === PaymentStatus.PENDING &&
        b.status === BookingStatus.COMPLETED,
    ).length;

    const conflictsToday = conflicts.filter((c) =>
      c.bookings.some((b) => {
        const t = new Date(b.startTime);
        return t >= dayStart && t <= dayEnd;
      }),
    ).length;

    let totalBookedMin = 0;
    let totalCapacityMin = 0;
    for (const emp of employees) {
      const util = await this.schedulingEngine.getEmployeeUtilization(
        emp.id,
        dayStart,
        dayEnd,
      );
      totalBookedMin += util.bookedMinutes ?? 0;
      totalCapacityMin += util.totalMinutes ?? 0;
    }
    const utilizationPercent =
      totalCapacityMin > 0
        ? Math.round((totalBookedMin / totalCapacityMin) * 100)
        : 0;

    const highlights: string[] = [];
    if (conflictsToday > 0) {
      highlights.push(`${conflictsToday} scheduling conflict(s) today`);
    }
    if (cancellationsToday > 0) {
      highlights.push(
        `${cancellationsToday} cancellation(s) today — recovery opportunities`,
      );
    }
    if (unpaidToday > 0) {
      highlights.push(
        `${unpaidToday} completed appointment(s) awaiting payment`,
      );
    }
    if (utilizationPercent < 50 && employees.length > 0) {
      highlights.push(
        `Team utilization is ${utilizationPercent}% — room to fill gaps`,
      );
    }
    if (highlights.length === 0) {
      highlights.push(
        `${todaysBookings.length} appointment(s) scheduled — looking good`,
      );
    }

    const suggestedActions = suggestions.slice(0, 3).map((s) => ({
      title: s.title,
      prompt: s.prompt,
    }));

    return {
      date: formatDateDisplay(dayStart),
      utilizationPercent,
      todaysBookings: todaysBookings.length,
      cancellationsToday,
      conflictsToday,
      unpaidToday,
      highlights,
      suggestedActions,
    };
  }
}
