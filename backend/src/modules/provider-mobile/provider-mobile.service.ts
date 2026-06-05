import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, Not, In } from 'typeorm';
import { Employee } from '../employee/entities/employee.entity.js';
import { BusinessMember } from '../business/entities/business-member.entity.js';
import { Booking, BookingStatus } from '../booking/entities/booking.entity.js';
import { resolveBookingPaymentSummary } from '../booking/booking-payment-summary.util.js';
import { BusinessService } from '../business/business.service.js';
import { BookingService } from '../booking/booking.service.js';
import { RetailPosService } from '../retail-pos/retail-pos.service.js';
import { SchedulingSlot } from '../schedule/entities/scheduling-slot.entity.js';
import { LlmService } from '../../engine/agent/llm.service.js';
import {
  isMobileManagerRole,
  MOBILE_MANAGER_ROLES,
  type MobileAccess,
  type MobileViewMode,
} from './provider-mobile-access.js';
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
    @InjectRepository(BusinessMember)
    private memberRepo: Repository<BusinessMember>,
    @InjectRepository(Booking) private bookingRepo: Repository<Booking>,
    @InjectRepository(SchedulingSlot)
    private slotRepo: Repository<SchedulingSlot>,
    private businessService: BusinessService,
    private bookingService: BookingService,
    private retailPosService: RetailPosService,
    private llm: LlmService,
  ) {}

  async getContext(businessId: string, userId: string) {
    const access = await this.resolveMobileAccess(businessId, userId);

    return {
      membershipRole: access.membershipRole,
      viewMode: access.viewMode,
      employee: access.employee
        ? {
            id: access.employee.id,
            name: access.employee.name,
            email: access.employee.email,
            phone: access.employee.phone,
          }
        : null,
      canUseProviderApp: true,
    };
  }

  async resolveMobileAccess(
    businessId: string,
    userId: string,
  ): Promise<MobileAccess> {
    const membership = await this.businessService.ensureMember(
      businessId,
      userId,
    );
    const employee = await this.employeeRepo.findOne({
      where: { businessId, userId, isActive: true },
    });

    if (isMobileManagerRole(membership.role)) {
      return {
        viewMode: 'team',
        membershipRole: membership.role,
        employee,
      };
    }

    if (employee) {
      return {
        viewMode: 'provider',
        membershipRole: membership.role,
        employee,
      };
    }

    throw new ForbiddenException(
      'No provider profile or admin access for this business',
    );
  }

  async getTodayBookings(businessId: string, userId: string) {
    const access = await this.resolveMobileAccess(businessId, userId);
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const dayEnd = new Date(today);
    dayEnd.setUTCHours(23, 59, 59, 999);

    const where: Record<string, unknown> = {
      businessId,
      startTime: Between(today, dayEnd),
      status: Not(In([BookingStatus.CANCELLED])),
    };
    if (access.viewMode === 'provider') {
      where.employeeId = access.employee!.id;
    }

    const bookings = await this.bookingRepo.find({
      where: where,
      relations: { service: true, customer: true, employee: true },
      order: { startTime: 'ASC' },
    });

    return {
      date: today.toISOString().slice(0, 10),
      viewMode: access.viewMode,
      employee: access.employee
        ? { id: access.employee.id, name: access.employee.name }
        : null,
      bookings: bookings.map((b) => this.toBookingSummary(b)),
    };
  }

  async getUpcomingBookings(businessId: string, userId: string, days = 7) {
    const access = await this.resolveMobileAccess(businessId, userId);
    const start = new Date();
    start.setUTCHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setUTCDate(end.getUTCDate() + days);
    end.setUTCHours(23, 59, 59, 999);

    const where: Record<string, unknown> = {
      businessId,
      startTime: Between(start, end),
      status: In(ACTIVE_STATUSES),
    };
    if (access.viewMode === 'provider') {
      where.employeeId = access.employee!.id;
    }

    const bookings = await this.bookingRepo.find({
      where: where,
      relations: { service: true, customer: true, employee: true },
      order: { startTime: 'ASC' },
    });

    return {
      viewMode: access.viewMode,
      from: start.toISOString().slice(0, 10),
      to: end.toISOString().slice(0, 10),
      bookings: bookings.map((b) => this.toBookingSummary(b)),
    };
  }

  async getScheduleSummary(businessId: string, userId: string, days = 14) {
    const access = await this.resolveMobileAccess(businessId, userId);
    const start = new Date();
    start.setUTCHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setUTCDate(end.getUTCDate() + days);

    const where: Record<string, unknown> = {
      businessId,
      startTime: Between(start, end),
    };
    if (access.viewMode === 'provider') {
      where.employeeId = access.employee!.id;
    }

    const slots = await this.slotRepo.find({
      where: where,
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
      viewMode: access.viewMode,
      employee: access.employee
        ? { id: access.employee.id, name: access.employee.name }
        : null,
      days: [...byDay.entries()].map(([date, counts]) => ({ date, ...counts })),
    };
  }

  async findEmployeeUserId(employeeId: string): Promise<string | null> {
    const employee = await this.employeeRepo.findOne({
      where: { id: employeeId },
    });
    return employee?.userId ?? null;
  }

  async findMobileManagerUserIds(businessId: string): Promise<string[]> {
    const members = await this.memberRepo.find({
      where: {
        businessId,
        role: In(MOBILE_MANAGER_ROLES),
      },
    });
    return members.map((m) => m.userId);
  }

  async getBookingDetail(
    businessId: string,
    userId: string,
    bookingId: string,
  ) {
    const booking = await this.getAccessibleBooking(
      businessId,
      userId,
      bookingId,
    );
    return this.toBookingDetail(booking, businessId);
  }

  async updateBooking(
    businessId: string,
    userId: string,
    bookingId: string,
    dto: UpdateProviderBookingDto,
  ) {
    const booking = await this.getAccessibleBooking(
      businessId,
      userId,
      bookingId,
    );

    if (dto.status === BookingStatus.CANCELLED) {
      throw new BadRequestException(
        'Use the cancel endpoint to cancel an appointment',
      );
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
        startTime: dto.startTime,
        employeeId: dto.employeeId,
        serviceId: dto.serviceId,
        expectedUpdatedAt: dto.expectedUpdatedAt,
      },
      userId,
    );

    return this.toBookingDetail(updated, businessId);
  }

  async cancelBooking(
    businessId: string,
    userId: string,
    bookingId: string,
    dto: CancelProviderBookingDto,
  ) {
    await this.getAccessibleBooking(businessId, userId, bookingId);
    const cancelled = await this.bookingService.cancel(
      bookingId,
      dto.reason?.trim() || 'Cancelled by provider',
      userId,
      dto.expectedUpdatedAt,
    );
    return this.toBookingDetail(cancelled, businessId);
  }

  async suggestCancelNote(
    businessId: string,
    userId: string,
    bookingId: string,
    dto: SuggestCancelNoteDto,
  ) {
    const booking = await this.getAccessibleBooking(
      businessId,
      userId,
      bookingId,
    );
    const customerName = booking.customer?.name ?? 'the customer';
    const serviceName = booking.service?.name ?? 'appointment';
    const when = booking.startTime.toISOString().slice(0, 16).replace('T', ' ');

    const userInput =
      dto.prompt?.trim() ||
      dto.draft?.trim() ||
      'Need to cancel this appointment';
    const fallback = dto.draft?.trim()
      ? dto.draft.trim()
      : `${customerName} cancelled the ${serviceName} scheduled for ${when}.`;

    if (!(await this.llm.isAvailableForBusiness(businessId))) {
      return { suggestion: fallback, aiAvailable: false };
    }

    const result = await this.llm.completeJson<{ note: string }>(
      businessId,
      `You help service providers write short, professional appointment cancellation notes for their records.
Return JSON: { "note": "..." }
Rules: one or two sentences max, no greeting, no quotes, factual and polite.`,
      `Appointment: ${serviceName} with ${customerName} at ${when}.
Provider input: "${userInput}"
Write a cancellation note the provider can save.`,
      {
        surface: 'provider_mobile',
        operation: 'suggest_cancel_note',
        actorType: 'provider',
        userId,
      },
      0.3,
    );

    return {
      suggestion: result?.note?.trim() || fallback,
      aiAvailable: true,
    };
  }

  getViewMode(access: MobileAccess): MobileViewMode {
    return access.viewMode;
  }

  getScopedEmployeeId(access: MobileAccess): string | undefined {
    return access.viewMode === 'provider' ? access.employee!.id : undefined;
  }

  private async getAccessibleBooking(
    businessId: string,
    userId: string,
    bookingId: string,
  ): Promise<Booking> {
    const access = await this.resolveMobileAccess(businessId, userId);
    const where: Record<string, unknown> = { id: bookingId, businessId };
    if (access.viewMode === 'provider') {
      where.employeeId = access.employee!.id;
    }

    const booking = await this.bookingRepo.findOne({
      where: where,
      relations: { service: true, customer: true, employee: true },
    });
    if (!booking) {
      throw new NotFoundException('Booking not found');
    }
    return booking;
  }

  private async toBookingDetail(booking: Booking, businessId: string) {
    const business = await this.businessService.findOne(businessId);
    const settings = business?.settings as Record<string, unknown> | undefined;
    const checkout = await this.retailPosService.getBookingRetailSales(
      businessId,
      booking.id,
    );
    const retailLines = checkout.lines.map((line) => ({
      productName: line.productName,
      quantity: line.quantity,
      unitPrice: line.unitPrice,
      lineTotal: line.lineTotal,
    }));

    return {
      ...this.toBookingSummary(booking),
      paymentStatus: booking.paymentStatus,
      description: booking.description,
      cancellationReason: booking.cancellationReason,
      paymentSummary: resolveBookingPaymentSummary(
        booking,
        retailLines,
        settings,
      ),
    };
  }

  private toBookingSummary(booking: Booking) {
    return {
      id: booking.id,
      startTime: booking.startTime.toISOString(),
      endTime: booking.endTime.toISOString(),
      status: booking.status,
      notes: booking.notes,
      updatedAt: booking.updatedAt.toISOString(),
      service: booking.service
        ? {
            id: booking.service.id,
            name: booking.service.name,
            price: Number(booking.service.price),
            currency: booking.service.currency,
          }
        : null,
      customer: booking.customer
        ? {
            id: booking.customer.id,
            name: booking.customer.name,
            phone: booking.customer.phone,
            email: booking.customer.email,
          }
        : null,
      employee: booking.employee
        ? { id: booking.employee.id, name: booking.employee.name }
        : null,
    };
  }
}
