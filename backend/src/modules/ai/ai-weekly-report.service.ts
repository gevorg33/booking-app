import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, Not } from 'typeorm';
import { Booking, BookingStatus } from '../booking/entities/booking.entity.js';
import { Business } from '../business/entities/business.entity.js';
import { Employee } from '../employee/entities/employee.entity.js';
import { formatBusinessMoney } from '../../common/utils/business-currency.util.js';
import { SchedulingEngineService } from '../../engine/scheduling/scheduling-engine.service.js';
import { AiIntelligenceService } from './ai-intelligence.service.js';
import { resolveDateRange } from './ai-orchestration.helpers.js';

@Injectable()
export class AiWeeklyReportService {
  constructor(
    @InjectRepository(Booking) private bookingRepo: Repository<Booking>,
    @InjectRepository(Business) private businessRepo: Repository<Business>,
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

    const business = await this.businessRepo.findOne({
      where: { id: businessId },
    });
    const businessSettings = business?.settings as
      | Record<string, unknown>
      | undefined;

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
    const noShows = bookings.filter(
      (b) => b.status === BookingStatus.NO_SHOW,
    ).length;
    const cancelled = await this.bookingRepo.count({
      where: {
        businessId,
        startTime: Between(start, end),
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

    const report = await this.intelligence.generateWeeklyReport(
      businessId,
      snapshot,
    );

    const revenueLabel = formatBusinessMoney(revenue, businessSettings);

    return {
      snapshot,
      ...(report ?? {
        title: 'Weekly operations summary',
        sections: [
          {
            heading: 'Overview',
            body: `${bookings.length} bookings, ${revenueLabel} revenue, ${noShows} no-shows, ${conflicts.length} conflicts.`,
          },
        ],
      }),
      generated: !!report,
    };
  }
}
