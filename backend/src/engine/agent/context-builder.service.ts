import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, Not, In } from 'typeorm';
import { Employee } from '../../modules/employee/entities/employee.entity.js';
import { Service } from '../../modules/service/entities/service.entity.js';
import { Booking, BookingStatus } from '../../modules/booking/entities/booking.entity.js';
import { SchedulingPeriod } from '../../modules/schedule/entities/scheduling-period.entity.js';
import { ScheduleTemplate } from '../../modules/schedule/entities/schedule-template.entity.js';
import { BlockSchedule } from '../../modules/schedule/entities/block-schedule.entity.js';
import { AgentContext } from './interfaces/agent.interfaces.js';

@Injectable()
export class ContextBuilderService {
  constructor(
    @InjectRepository(Employee) private employeeRepo: Repository<Employee>,
    @InjectRepository(Service) private serviceRepo: Repository<Service>,
    @InjectRepository(Booking) private bookingRepo: Repository<Booking>,
    @InjectRepository(SchedulingPeriod) private periodRepo: Repository<SchedulingPeriod>,
    @InjectRepository(ScheduleTemplate) private templateRepo: Repository<ScheduleTemplate>,
    @InjectRepository(BlockSchedule) private blockScheduleRepo: Repository<BlockSchedule>,
  ) {}

  async build(
    businessId: string,
    options?: {
      dateRange?: { start: Date; end: Date };
      employeeId?: string;
    },
  ): Promise<AgentContext> {
    const dateRange = options?.dateRange ?? this.defaultDateRange();

    const employeeWhere: any = { businessId, isActive: true };
    if (options?.employeeId) employeeWhere.id = options.employeeId;

    const bookingWhere: any = {
      businessId,
      startTime: Between(dateRange.start, dateRange.end),
      status: Not(In([BookingStatus.CANCELLED])),
    };
    if (options?.employeeId) bookingWhere.employeeId = options.employeeId;

    const periodWhere: any = {
      businessId,
      startTime: Between(dateRange.start, dateRange.end),
    };
    if (options?.employeeId) periodWhere.employeeId = options.employeeId;

    const [employees, services, bookings, schedules, templates, blockSchedules] = await Promise.all([
      this.employeeRepo.find({ where: employeeWhere }),
      this.serviceRepo.find({ where: { businessId } }),
      this.bookingRepo.find({
        where: bookingWhere,
        relations: { employee: true, service: true, customer: true },
        order: { startTime: 'ASC' },
      }),
      this.periodRepo.find({ where: periodWhere, order: { startTime: 'ASC' } }),
      this.templateRepo.find({ where: { businessId, isDeleted: false }, order: { name: 'ASC' } }),
      this.blockScheduleRepo.find({ where: { businessId, isDeleted: false }, take: 20 }),
    ]);

    return {
      businessId,
      dateRange,
      employees,
      services,
      bookings,
      schedules,
      templates,
      blockSchedules,
      constraints: [
        'No double booking',
        '10-minute slot boundaries',
        'Respect employee schedules and breaks',
      ],
    };
  }

  private defaultDateRange(): { start: Date; end: Date } {
    const start = new Date();
    start.setUTCHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setUTCDate(end.getUTCDate() + 7);
    end.setUTCHours(23, 59, 59, 999);
    return { start, end };
  }
}
