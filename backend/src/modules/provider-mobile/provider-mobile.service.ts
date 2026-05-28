import { Injectable, ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, Not, In } from 'typeorm';
import { Employee } from '../employee/entities/employee.entity.js';
import { BusinessMember } from '../business/entities/business-member.entity.js';
import { Booking, BookingStatus } from '../booking/entities/booking.entity.js';
import { BusinessService } from '../business/business.service.js';
import { BookingService } from '../booking/booking.service.js';
import { SchedulingSlot } from '../schedule/entities/scheduling-slot.entity.js';
import { LlmService } from '../../engine/agent/llm.service.js';
import {
  UpdateProviderBookingDto,
  CancelProviderBookingDto,
  SuggestCancelNoteDto,
} from './dto/provider-mobile.dto.js';

const ACTIVE_STATUSES = [
  BookingStatus.PENDING,
  BookingStatus.CONFIRMED,
  BookingStatus.IN_PROGRESS,
];

@Injectable()
export class ProviderMobileService {
  constructor(
    @InjectRepository(Employee) private employeeRepo: Repository<Employee>,
    @InjectRepository(Booking) private bookingRepo: Repository<Booking>,
    @InjectRepository(SchedulingSlot) private slotRepo: Repository<SchedulingSlot>,
    private businessService: BusinessService,
    private bookingService: BookingService,
    private llm: LlmService,
  ) {}

  async getContext(businessId: string, userId: string) {
    const membership = await this.businessService.ensureMember(businessId, userId);
    const employee = await this.employeeRepo.findOne({
      where: { businessId, userId, isActive: true },
    });

    return {
      membershipRole: membership.role,
      employee: employee
        ? {
            id: employee.id,
            name: employee.name,
            email: employee.email,
            phone: employee.phone,
          }
        : null,
      canUseProviderApp: Boolean(employee),
    };
  }

  private async resolveEmployee(businessId: string, userId: string): Promise<Employee> {
    const employee = await this.employeeRepo.findOne({
      where: { businessId, userId, isActive: true },
    });
    if (!employee) {
      throw new ForbiddenException('No provider profile linked to your account');
    }
    return employee;
  }

  async getTodayBookings(businessId: string, userId: string) {
    const employee = await this.resolveEmployee(businessId, userId);
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const dayEnd = new Date(today);
    dayEnd.setUTCHours(23, 59, 59, 999);

    const bookings = await this.bookingRepo.find({
      where: {
        businessId,
        employeeId: employee.id,
        startTime: Between(today, dayEnd),
        status: Not(In([BookingStatus.CANCELLED])),
      },
      relations: { service: true, customer: true },
      order: { startTime: 'ASC' },
    });

    return {
      date: today.toISOString().slice(0, 10),
      employee: { id: employee.id, name: employee.name },
      bookings: bookings.map((b) => this.toBookingSummary(b)),
    };
  }

  async getUpcomingBookings(businessId: string, userId: string, days = 7) {
    const employee = await this.resolveEmployee(businessId, userId);
    const start = new Date();
    start.setUTCHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setUTCDate(end.getUTCDate() + days);
    end.setUTCHours(23, 59, 59, 999);

    const bookings = await this.bookingRepo.find({
      where: {
        businessId,
        employeeId: employee.id,
        startTime: Between(start, end),
        status: In(ACTIVE_STATUSES),
      },
      relations: { service: true, customer: true },
      order: { startTime: 'ASC' },
    });

    return {
      from: start.toISOString().slice(0, 10),
      to: end.toISOString().slice(0, 10),
      bookings: bookings.map((b) => this.toBookingSummary(b)),
    };
  }

  async getScheduleSummary(businessId: string, userId: string, days = 14) {
    const employee = await this.resolveEmployee(businessId, userId);
    const start = new Date();
    start.setUTCHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setUTCDate(end.getUTCDate() + days);

    const slots = await this.slotRepo.find({
      where: {
        businessId,
        employeeId: employee.id,
        startTime: Between(start, end),
      },
      order: { startTime: 'ASC' },
      take: 500,
    });

    const byDay = new Map<string, { available: number; booked: number }>();
    for (const slot of slots) {
      const day = slot.startTime.toISOString().slice(0, 10);
      const entry = byDay.get(day) ?? { available: 0, booked: 0 };
      if (slot.status === 'available') entry.available += 1;
      if (slot.status === 'booked') entry.booked += 1;
      byDay.set(day, entry);
    }

    return {
      employee: { id: employee.id, name: employee.name },
      days: [...byDay.entries()].map(([date, counts]) => ({ date, ...counts })),
    };
  }

  async findEmployeeUserId(employeeId: string): Promise<string | null> {
    const employee = await this.employeeRepo.findOne({ where: { id: employeeId } });
    return employee?.userId ?? null;
  }

  async getBookingDetail(businessId: string, userId: string, bookingId: string) {
    const booking = await this.getOwnedBooking(businessId, userId, bookingId);
    return this.toBookingDetail(booking);
  }

  async updateBooking(
    businessId: string,
    userId: string,
    bookingId: string,
    dto: UpdateProviderBookingDto,
  ) {
    const booking = await this.getOwnedBooking(businessId, userId, bookingId);

    if (dto.status === BookingStatus.CANCELLED) {
      throw new BadRequestException('Use the cancel endpoint to cancel an appointment');
    }

    if (booking.status === BookingStatus.CANCELLED) {
      throw new BadRequestException('Cancelled appointments cannot be updated');
    }

    const updated = await this.bookingService.update(
      booking.id,
      {
        status: dto.status,
        paymentStatus: dto.paymentStatus,
        notes: dto.notes,
      },
      userId,
    );

    return this.toBookingDetail(updated);
  }

  async cancelBooking(
    businessId: string,
    userId: string,
    bookingId: string,
    dto: CancelProviderBookingDto,
  ) {
    await this.getOwnedBooking(businessId, userId, bookingId);
    const cancelled = await this.bookingService.cancel(
      bookingId,
      dto.reason?.trim() || 'Cancelled by provider',
      userId,
    );
    return this.toBookingDetail(cancelled);
  }

  async suggestCancelNote(
    businessId: string,
    userId: string,
    bookingId: string,
    dto: SuggestCancelNoteDto,
  ) {
    const booking = await this.getOwnedBooking(businessId, userId, bookingId);
    const customerName = booking.customer?.name ?? 'the customer';
    const serviceName = booking.service?.name ?? 'appointment';
    const when = booking.startTime.toISOString().slice(0, 16).replace('T', ' ');

    const userInput = dto.prompt?.trim() || dto.draft?.trim() || 'Need to cancel this appointment';
    const fallback = dto.draft?.trim()
      ? dto.draft.trim()
      : `${customerName} cancelled the ${serviceName} scheduled for ${when}.`;

    if (!this.llm.isAvailable) {
      return { suggestion: fallback, aiAvailable: false };
    }

    const result = await this.llm.completeJson<{ note: string }>(
      `You help service providers write short, professional appointment cancellation notes for their records.
Return JSON: { "note": "..." }
Rules: one or two sentences max, no greeting, no quotes, factual and polite.`,
      `Appointment: ${serviceName} with ${customerName} at ${when}.
Provider input: "${userInput}"
Write a cancellation note the provider can save.`,
      0.3,
    );

    return {
      suggestion: result?.note?.trim() || fallback,
      aiAvailable: true,
    };
  }

  private async getOwnedBooking(
    businessId: string,
    userId: string,
    bookingId: string,
  ): Promise<Booking> {
    const employee = await this.resolveEmployee(businessId, userId);
    const booking = await this.bookingRepo.findOne({
      where: { id: bookingId, businessId, employeeId: employee.id },
      relations: { service: true, customer: true, employee: true },
    });
    if (!booking) {
      throw new NotFoundException('Booking not found');
    }
    return booking;
  }

  private toBookingDetail(booking: Booking) {
    return {
      ...this.toBookingSummary(booking),
      paymentStatus: booking.paymentStatus,
      description: booking.description,
      cancellationReason: booking.cancellationReason,
    };
  }

  private toBookingSummary(booking: Booking) {
    return {
      id: booking.id,
      startTime: booking.startTime.toISOString(),
      endTime: booking.endTime.toISOString(),
      status: booking.status,
      notes: booking.notes,
      service: booking.service ? { id: booking.service.id, name: booking.service.name } : null,
      customer: booking.customer
        ? {
            id: booking.customer.id,
            name: booking.customer.name,
            phone: booking.customer.phone,
            email: booking.customer.email,
          }
        : null,
    };
  }
}
