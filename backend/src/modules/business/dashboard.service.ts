import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, Not, In } from 'typeorm';
import { Booking, BookingStatus } from '../booking/entities/booking.entity.js';
import { Employee } from '../employee/entities/employee.entity.js';
import { Service } from '../service/entities/service.entity.js';
import { Customer } from '../customer/entities/customer.entity.js';
import { SchedulingSlot, SlotStatus } from '../schedule/entities/scheduling-slot.entity.js';

export interface DashboardOverview {
  todaysBookings: number;
  activeEmployees: number;
  services: number;
  totalCustomers: number;
  utilizationPercent: number;
}

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Booking) private bookingRepo: Repository<Booking>,
    @InjectRepository(Employee) private employeeRepo: Repository<Employee>,
    @InjectRepository(Service) private serviceRepo: Repository<Service>,
    @InjectRepository(Customer) private customerRepo: Repository<Customer>,
    @InjectRepository(SchedulingSlot) private slotRepo: Repository<SchedulingSlot>,
  ) {}

  async getOverview(businessId: string): Promise<DashboardOverview> {
    const dayStart = new Date();
    dayStart.setUTCHours(0, 0, 0, 0);
    const dayEnd = new Date();
    dayEnd.setUTCHours(23, 59, 59, 999);

    const [todaysBookings, activeEmployees, services, totalCustomers, utilizationPercent] =
      await Promise.all([
        this.bookingRepo.count({
          where: {
            businessId,
            startTime: Between(dayStart, dayEnd) as any,
            status: Not(In([BookingStatus.CANCELLED])) as any,
          },
        }),
        this.employeeRepo.count({ where: { businessId, isActive: true } }),
        this.serviceRepo.count({ where: { businessId, isActive: true } }),
        this.customerRepo.count({ where: { businessId, isActive: true } }),
        this.computeTodayUtilization(businessId, dayStart, dayEnd),
      ]);

    return {
      todaysBookings,
      activeEmployees,
      services,
      totalCustomers,
      utilizationPercent,
    };
  }

  private async computeTodayUtilization(
    businessId: string,
    dayStart: Date,
    dayEnd: Date,
  ): Promise<number> {
    const slots = await this.slotRepo.find({
      where: {
        businessId,
        startTime: Between(dayStart, dayEnd) as any,
        status: In([SlotStatus.AVAILABLE, SlotStatus.BOOKED]),
      },
    });

    if (slots.length > 0) {
      const booked = slots.filter(
        (s) =>
          s.status === SlotStatus.BOOKED ||
          s.appointmentCount >= s.maxAppointmentCount,
      ).length;
      return Math.round((booked / slots.length) * 100);
    }

    const bookings = await this.bookingRepo.find({
      where: {
        businessId,
        startTime: Between(dayStart, dayEnd) as any,
        status: Not(In([BookingStatus.CANCELLED, BookingStatus.NO_SHOW])) as any,
      },
    });

    if (bookings.length === 0) return 0;

    const bookedMinutes = bookings.reduce(
      (sum, b) => sum + (b.endTime.getTime() - b.startTime.getTime()) / 60000,
      0,
    );
    const employeeCount = await this.employeeRepo.count({
      where: { businessId, isActive: true },
    });
    const capacityMinutes = Math.max(employeeCount, 1) * 8 * 60;
    return Math.min(100, Math.round((bookedMinutes / capacityMinutes) * 100));
  }
}
