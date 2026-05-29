import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, Not } from 'typeorm';
import { Booking, BookingStatus } from '../booking/entities/booking.entity.js';
import { Employee } from '../employee/entities/employee.entity.js';
import { SchedulingEngineService } from '../../engine/scheduling/scheduling-engine.service.js';
import { AiIntelligenceService } from './ai-intelligence.service.js';
import { resolveDateRange } from './ai-orchestration.helpers.js';

@Injectable()
export class AiWeeklyReportService {
  constructor(
    @InjectRepository(Booking) private bookingRepo: Repository<Booking>,
    @InjectRepository(Employee) private employeeRepo: Repository<Employee>,
    private schedulingEngine: SchedulingEngineService,
    private intelligence: AiIntelligenceService,
  ) {}

  async getWeeklyReport(businessId: string) {
    const range = resolveDateRange({}, 'last week');
    if (!range) {
      return { title: 'Weekly report', sections: [], generated: false };
    }

    const start = new Date(range.start);
    start.setUTCHours(0, 0, 0, 0);
    const end = new Date(range.end);
    end.setUTCHours(23, 59, 59, 999);

    const [bookings, employees, conflicts] = await Promise.all([
      this.bookingRepo.find({
        where: {
          businessId,
          startTime: Between(start, end) as any,
          status: Not(BookingStatus.CANCELLED) as any,
        },
        relations: { service: true },
      }),
      this.employeeRepo.find({ where: { businessId, isActive: true } }),
      this.schedulingEngine.findConflicts(businessId, { start, end }),
    ]);

    const revenue = bookings.reduce(
      (s, b) => s + Number(b.service?.price ?? b.metadata?.price ?? 0),
      0,
    );
    const noShows = bookings.filter((b) => b.status === BookingStatus.NO_SHOW).length;
    const cancelled = await this.bookingRepo.count({
      where: {
        businessId,
        startTime: Between(start, end) as any,
        status: BookingStatus.CANCELLED,
      },
    });

    const snapshot = {
      period: { start: range.start, end: range.end },
      totalBookings: bookings.length,
      revenue,
      noShows,
      cancelled,
      conflictCount: conflicts.length,
      staffCount: employees.length,
      staffNames: employees.map((e) => e.name),
    };

    const report = await this.intelligence.generateWeeklyReport(businessId, snapshot);

    return {
      snapshot,
      ...(report ?? {
        title: 'Weekly operations summary',
        sections: [
          {
            heading: 'Overview',
            body: `${bookings.length} bookings, $${revenue.toFixed(0)} revenue, ${noShows} no-shows, ${conflicts.length} conflicts.`,
          },
        ],
      }),
      generated: !!report,
    };
  }
}
