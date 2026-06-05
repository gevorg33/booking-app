import { Injectable, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Repository,
  Between,
  Not,
  In,
  LessThan,
  MoreThan,
  DataSource,
} from 'typeorm';
import {
  Booking,
  BookingStatus,
} from '../../modules/booking/entities/booking.entity.js';
import {
  ScheduleTemplate,
  DayOfWeek,
  TimeSlotRange,
} from '../../modules/schedule/entities/schedule-template.entity.js';
import { ScheduleAssignment } from '../../modules/schedule/entities/schedule-assignment.entity.js';
import {
  ScheduleOverride,
  OverrideType,
} from '../../modules/schedule/entities/schedule-override.entity.js';
import { Service } from '../../modules/service/entities/service.entity.js';
import { Employee } from '../../modules/employee/entities/employee.entity.js';

export interface TimeSlot {
  startTime: Date;
  endTime: Date;
}

export interface AvailableSlot extends TimeSlot {
  employeeId: string;
  employeeName: string;
}

export interface AvailabilityQuery {
  businessId: string;
  serviceId: string;
  date: Date;
  employeeId?: string;
  timezone?: string;
}

export interface BookingRequest {
  businessId: string;
  employeeId: string;
  serviceId: string;
  customerId?: string;
  startTime: Date;
  notes?: string;
}

const SLOT_GRANULARITY_MINUTES = 10;

@Injectable()
export class SchedulingEngineService {
  constructor(
    @InjectRepository(Booking)
    private bookingRepo: Repository<Booking>,
    @InjectRepository(ScheduleTemplate)
    private templateRepo: Repository<ScheduleTemplate>,
    @InjectRepository(ScheduleAssignment)
    private assignmentRepo: Repository<ScheduleAssignment>,
    @InjectRepository(ScheduleOverride)
    private overrideRepo: Repository<ScheduleOverride>,
    @InjectRepository(Service)
    private serviceRepo: Repository<Service>,
    @InjectRepository(Employee)
    private employeeRepo: Repository<Employee>,
    private dataSource: DataSource,
  ) {}

  async getAvailableSlots(query: AvailabilityQuery): Promise<AvailableSlot[]> {
    const service = await this.serviceRepo.findOneOrFail({
      where: { id: query.serviceId },
    });
    const totalDuration = service.durationMinutes + service.bufferMinutes;

    let employees: Employee[];
    if (query.employeeId) {
      employees = await this.employeeRepo.find({
        where: {
          id: query.employeeId,
          businessId: query.businessId,
          isActive: true,
        },
      });
    } else {
      employees = await this.employeeRepo.find({
        where: { businessId: query.businessId, isActive: true },
      });
    }

    employees = employees.filter(
      (e) =>
        !e.serviceIds ||
        e.serviceIds.length === 0 ||
        e.serviceIds.includes(query.serviceId),
    );

    const allSlots: AvailableSlot[] = [];

    for (const employee of employees) {
      const slots = await this.getEmployeeAvailableSlots(
        employee,
        query.date,
        totalDuration,
        query.businessId,
      );
      allSlots.push(
        ...slots.map((s) => ({
          ...s,
          employeeId: employee.id,
          employeeName: employee.name,
        })),
      );
    }

    return allSlots.sort(
      (a, b) => a.startTime.getTime() - b.startTime.getTime(),
    );
  }

  private async getEmployeeAvailableSlots(
    employee: Employee,
    date: Date,
    durationMinutes: number,
    businessId: string,
  ): Promise<TimeSlot[]> {
    const workingHours = await this.getEffectiveWorkingHours(
      employee.id,
      date,
      businessId,
    );
    if (!workingHours || workingHours.length === 0) return [];

    const dayStart = new Date(date);
    dayStart.setUTCHours(0, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setUTCHours(23, 59, 59, 999);

    const existingBookings = await this.bookingRepo.find({
      where: {
        employeeId: employee.id,
        startTime: Between(dayStart, dayEnd),
        status: Not(In([BookingStatus.CANCELLED])),
      },
      order: { startTime: 'ASC' },
    });

    const slots: TimeSlot[] = [];

    for (const hours of workingHours) {
      const [startH, startM] = hours.startTime.split(':').map(Number);
      const [endH, endM] = hours.endTime.split(':').map(Number);

      const windowStart = new Date(date);
      windowStart.setUTCHours(startH, startM, 0, 0);
      const windowEnd = new Date(date);
      windowEnd.setUTCHours(endH, endM, 0, 0);

      let current = new Date(windowStart);

      while (
        current.getTime() + durationMinutes * 60000 <=
        windowEnd.getTime()
      ) {
        const slotEnd = new Date(current.getTime() + durationMinutes * 60000);

        const hasConflict = existingBookings.some(
          (booking) =>
            current.getTime() < booking.endTime.getTime() &&
            slotEnd.getTime() > booking.startTime.getTime(),
        );

        if (!hasConflict) {
          slots.push({
            startTime: new Date(current),
            endTime: slotEnd,
          });
        }

        current = new Date(
          current.getTime() + SLOT_GRANULARITY_MINUTES * 60000,
        );
      }
    }

    return slots;
  }

  private async getEffectiveWorkingHours(
    employeeId: string,
    date: Date,
    businessId: string,
  ): Promise<TimeSlotRange[] | null> {
    const dateStr = date.toISOString().split('T')[0];
    const override = await this.overrideRepo.findOne({
      where: { employeeId, date: new Date(dateStr), businessId },
    });

    if (override) {
      if (
        override.type === OverrideType.VACATION ||
        override.type === OverrideType.SICK_LEAVE ||
        override.type === OverrideType.BLOCKED
      ) {
        return null;
      }
      if (override.type === OverrideType.CUSTOM_HOURS && override.customHours) {
        return override.customHours;
      }
    }

    // Convert JS Sunday=0 to our Monday=0 system
    const jsDay = date.getUTCDay();
    const dayOfWeek = jsDay === 0 ? 6 : jsDay - 1;

    const assignment = await this.assignmentRepo.findOne({
      where: {
        employeeId,
        effectiveFrom: LessThan(new Date(dateStr)),
      },
      relations: { template: true },
      order: { effectiveFrom: 'DESC' },
    });

    if (!assignment || !assignment.template) return null;

    const template = await this.templateRepo.findOne({
      where: {
        id: assignment.templateId,
        dayOfWeek: dayOfWeek,
        isActive: true,
      },
    });

    if (!template) return null;

    let hours = [...template.workingHours];
    if (template.breaks && template.breaks.length > 0) {
      hours = this.subtractBreaks(hours, template.breaks);
    }

    return hours;
  }

  private subtractBreaks(
    hours: TimeSlotRange[],
    breaks: { startTime: string; endTime: string }[],
  ): TimeSlotRange[] {
    let result = [...hours];
    for (const brk of breaks) {
      const newResult: TimeSlotRange[] = [];
      for (const slot of result) {
        const segments = this.subtractRange(slot, brk);
        newResult.push(...segments);
      }
      result = newResult;
    }
    return result;
  }

  private subtractRange(
    slot: TimeSlotRange,
    brk: { startTime: string; endTime: string },
  ): TimeSlotRange[] {
    const slotStart = this.timeToMinutes(slot.startTime);
    const slotEnd = this.timeToMinutes(slot.endTime);
    const brkStart = this.timeToMinutes(brk.startTime);
    const brkEnd = this.timeToMinutes(brk.endTime);

    if (brkEnd <= slotStart || brkStart >= slotEnd) return [slot];
    const result: TimeSlotRange[] = [];
    if (brkStart > slotStart) {
      result.push({ startTime: slot.startTime, endTime: brk.startTime });
    }
    if (brkEnd < slotEnd) {
      result.push({ startTime: brk.endTime, endTime: slot.endTime });
    }
    return result;
  }

  private timeToMinutes(time: string): number {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
  }

  async createBooking(request: BookingRequest): Promise<Booking> {
    return this.dataSource.transaction(async (manager) => {
      const service = await manager.findOneOrFail(Service, {
        where: { id: request.serviceId },
      });
      const totalDuration = service.durationMinutes + service.bufferMinutes;

      const startTime = new Date(request.startTime);
      const endTime = new Date(startTime.getTime() + totalDuration * 60000);

      if (startTime.getUTCMinutes() % SLOT_GRANULARITY_MINUTES !== 0) {
        throw new ConflictException(
          'Booking must start on a 10-minute boundary',
        );
      }

      const conflicts = await manager
        .createQueryBuilder(Booking, 'booking')
        .setLock('pessimistic_write')
        .where('booking.employee_id = :employeeId', {
          employeeId: request.employeeId,
        })
        .andWhere('booking.status NOT IN (:...excludedStatuses)', {
          excludedStatuses: [BookingStatus.CANCELLED],
        })
        .andWhere('booking.startTime < :endTime', { endTime })
        .andWhere('booking.endTime > :startTime', { startTime })
        .getMany();

      if (conflicts.length > 0) {
        throw new ConflictException('Time slot is already booked');
      }

      const booking = manager.create(Booking, {
        businessId: request.businessId,
        employeeId: request.employeeId,
        serviceId: request.serviceId,
        customerId: request.customerId,
        startTime,
        endTime,
        status: BookingStatus.CONFIRMED,
        notes: request.notes,
      });

      return manager.save(booking);
    });
  }

  async cancelBooking(bookingId: string, reason?: string): Promise<Booking> {
    const booking = await this.bookingRepo.findOneOrFail({
      where: { id: bookingId },
    });
    booking.status = BookingStatus.CANCELLED;
    booking.cancellationReason = reason || 'Cancelled';
    return this.bookingRepo.save(booking);
  }

  async getEmployeeUtilization(
    employeeId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<{
    totalMinutes: number;
    bookedMinutes: number;
    utilizationPercent: number;
  }> {
    const bookings = await this.bookingRepo.find({
      where: {
        employeeId,
        startTime: Between(startDate, endDate),
        status: Not(In([BookingStatus.CANCELLED])),
      },
    });

    const bookedMinutes = bookings.reduce((sum, b) => {
      return sum + (b.endTime.getTime() - b.startTime.getTime()) / 60000;
    }, 0);

    const days = Math.ceil(
      (endDate.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000),
    );
    const totalMinutes = days * 8 * 60;

    return {
      totalMinutes,
      bookedMinutes,
      utilizationPercent:
        totalMinutes > 0 ? Math.round((bookedMinutes / totalMinutes) * 100) : 0,
    };
  }

  async findConflicts(
    businessId: string,
    dateRange: { start: Date; end: Date },
  ): Promise<{ employeeId: string; bookings: Booking[] }[]> {
    const bookings = await this.bookingRepo.find({
      where: {
        businessId,
        startTime: Between(dateRange.start, dateRange.end),
        status: Not(In([BookingStatus.CANCELLED])),
      },
      order: { employeeId: 'ASC', startTime: 'ASC' },
    });

    const byEmployee = new Map<string, Booking[]>();
    bookings.forEach((b) => {
      const list = byEmployee.get(b.employeeId) || [];
      list.push(b);
      byEmployee.set(b.employeeId, list);
    });

    const conflicts: { employeeId: string; bookings: Booking[] }[] = [];
    for (const [employeeId, empBookings] of byEmployee) {
      for (let i = 0; i < empBookings.length - 1; i++) {
        if (
          empBookings[i].endTime.getTime() >
          empBookings[i + 1].startTime.getTime()
        ) {
          conflicts.push({
            employeeId,
            bookings: [empBookings[i], empBookings[i + 1]],
          });
        }
      }
    }

    return conflicts;
  }
}
