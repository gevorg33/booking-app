import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, Not, In } from 'typeorm';
import {
  Booking,
  BookingStatus,
  PaymentStatus,
} from '../booking/entities/booking.entity.js';
import { Employee } from '../employee/entities/employee.entity.js';
import { Service } from '../service/entities/service.entity.js';
import { Customer } from '../customer/entities/customer.entity.js';
import {
  SchedulingSlot,
  SlotStatus,
} from '../schedule/entities/scheduling-slot.entity.js';
import { Business } from './entities/business.entity.js';
import { getBusinessDefaultCurrency } from '../../common/utils/business-currency.util.js';
import {
  resolveBookingPaidGrossAmount,
  resolveBookingTaxCollected,
  resolveBookingNetRevenue,
} from '../../common/utils/booking-receipt-tax.util.js';

export interface DashboardOverview {
  todaysBookings: number;
  activeEmployees: number;
  services: number;
  totalCustomers: number;
  utilizationPercent: number;
  revenueThisMonth: number;
  taxCollectedThisMonth: number;
  netRevenueThisMonth: number;
  currency: string;
  bookingsThisMonth: number;
  noShowCount: number;
  noShowRatePercent: number;
  completedThisMonth: number;
}

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Booking) private bookingRepo: Repository<Booking>,
    @InjectRepository(Business) private businessRepo: Repository<Business>,
    @InjectRepository(Employee) private employeeRepo: Repository<Employee>,
    @InjectRepository(Service) private serviceRepo: Repository<Service>,
    @InjectRepository(Customer) private customerRepo: Repository<Customer>,
    @InjectRepository(SchedulingSlot)
    private slotRepo: Repository<SchedulingSlot>,
  ) {}

  async getOverview(businessId: string): Promise<DashboardOverview> {
    const business = await this.businessRepo.findOne({
      where: { id: businessId },
    });
    const currency = getBusinessDefaultCurrency(
      business?.settings as Record<string, unknown> | undefined,
    );
    const dayStart = new Date();
    dayStart.setUTCHours(0, 0, 0, 0);
    const dayEnd = new Date();
    dayEnd.setUTCHours(23, 59, 59, 999);

    const monthStart = new Date(
      Date.UTC(dayStart.getUTCFullYear(), dayStart.getUTCMonth(), 1),
    );
    const monthEnd = new Date(
      Date.UTC(
        dayStart.getUTCFullYear(),
        dayStart.getUTCMonth() + 1,
        0,
        23,
        59,
        59,
        999,
      ),
    );

    const [
      todaysBookings,
      activeEmployees,
      services,
      totalCustomers,
      utilizationPercent,
      monthStats,
    ] = await Promise.all([
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
      this.computeMonthStats(businessId, monthStart, monthEnd),
    ]);

    return {
      todaysBookings,
      activeEmployees,
      services,
      totalCustomers,
      utilizationPercent,
      currency,
      ...monthStats,
    };
  }

  private async computeMonthStats(
    businessId: string,
    monthStart: Date,
    monthEnd: Date,
  ) {
    const bookings = await this.bookingRepo.find({
      where: {
        businessId,
        startTime: Between(monthStart, monthEnd),
      },
      relations: { service: true },
    });

    const nonCancelled = bookings.filter(
      (b) => b.status !== BookingStatus.CANCELLED,
    );
    const completed = nonCancelled.filter(
      (b) => b.status === BookingStatus.COMPLETED,
    );
    const noShows = nonCancelled.filter(
      (b) => b.status === BookingStatus.NO_SHOW,
    );
    const denom = completed.length + noShows.length;

    let revenueThisMonth = 0;
    let taxCollectedThisMonth = 0;
    let netRevenueThisMonth = 0;
    for (const b of nonCancelled) {
      if (b.paymentStatus === PaymentStatus.PAID && b.service) {
        revenueThisMonth += resolveBookingPaidGrossAmount({
          service: b.service,
          metadata: b.metadata as Record<string, unknown> | null,
        });
        taxCollectedThisMonth += resolveBookingTaxCollected({
          service: b.service,
          metadata: b.metadata as Record<string, unknown> | null,
        });
        netRevenueThisMonth += resolveBookingNetRevenue({
          service: b.service,
          metadata: b.metadata as Record<string, unknown> | null,
        });
      }
    }

    return {
      bookingsThisMonth: nonCancelled.length,
      revenueThisMonth: Math.round(revenueThisMonth * 100) / 100,
      taxCollectedThisMonth: Math.round(taxCollectedThisMonth * 100) / 100,
      netRevenueThisMonth: Math.round(netRevenueThisMonth * 100) / 100,
      noShowCount: noShows.length,
      noShowRatePercent:
        denom > 0 ? Math.round((noShows.length / denom) * 100) : 0,
      completedThisMonth: completed.length,
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
        startTime: Between(dayStart, dayEnd),
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
        startTime: Between(dayStart, dayEnd),
        status: Not(
          In([BookingStatus.CANCELLED, BookingStatus.NO_SHOW]),
        ) as any,
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
