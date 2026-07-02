import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Booking, BookingStatus } from '../booking/entities/booking.entity.js';
import { Business } from '../business/entities/business.entity.js';
import { BookingService } from '../booking/booking.service.js';
import { BusinessService } from '../business/business.service.js';
import { NotificationsService } from '../notifications/notifications.service.js';
import {
  evaluateCustomerBookingPolicy,
  readRescheduleCount,
  resolveCustomerSelfServiceSettings,
  type CustomerSelfServiceSettings,
} from '../../common/utils/customer-self-service.util.js';
import {
  buildBookingManageUrl,
  validateBookingManageToken,
} from '../../common/utils/booking-manage-token.util.js';
import {
  buildBookingCalendarEventInput,
  buildIcsEventContent,
} from '../../common/utils/booking-calendar.util.js';
import { PublicCustomerRescheduleBookingDto } from './dto/public-customer-booking.dto.js';
import { PublicCustomerReschedulePackageVisitDto } from './dto/public-customer-package-visit.dto.js';
import type {
  PublicCustomerBookingItem,
  PublicPackageVisitSummary,
} from './public-customer-auth.types.js';
import { MultiServiceBookingsService } from '../multi-service-bookings/multi-service-bookings.service.js';
import { validatePackageSameDayBlock } from '../../common/utils/package-booking.util.js';
import { buildSequentialAppointments } from '../../common/utils/multi-service-booking.util.js';
import {
  evaluatePackageVisitPolicy,
  isPackageVisitBooking,
  PACKAGE_VISIT_ACTIVE_STATUSES,
  readPackageIdFromMetadata,
  readPackageNameFromMetadata,
  sortPackageVisitBookings,
  toPackageLineInputs,
  toPackageServiceLines,
} from './public-customer-package-visit.util.js';
import {
  applyCustomerRunningLateToMetadata,
  buildCustomerRunningLateEligibility,
  buildCustomerRunningLateSnapshot,
  normalizeCustomerRunningLateMinutes,
  readCustomerRunningLate,
} from '../../common/utils/customer-running-late.util.js';
import type { PublicCustomerNotifyRunningLateDto } from './dto/public-customer-running-late.dto.js';

export interface PublicBookingManageContext {
  bookingId: string;
  startTime: string;
  endTime: string;
  status: string;
  paymentStatus: string;
  serviceName: string;
  employeeName: string;
  employeeId: string;
  serviceId: string;
  customerEmail: string | null;
  canCancel: boolean;
  canReschedule: boolean;
  policyMessage: string | null;
  manageUrl: string;
  allowProviderChangeOnReschedule: boolean;
  rescheduleCount: number;
  maxReschedules: number;
  packageVisit?: PublicPackageVisitSummary;
}

@Injectable()
export class PublicCustomerBookingService {
  constructor(
    private businessService: BusinessService,
    private bookingService: BookingService,
    private notificationsService: NotificationsService,
    private configService: ConfigService,
    private multiServiceBookingsService: MultiServiceBookingsService,
    @InjectRepository(Booking) private bookingRepo: Repository<Booking>,
  ) {}

  enrichBookingItem(
    booking: Booking,
    settings: CustomerSelfServiceSettings,
    reviewBookingIds: Set<string>,
  ): PublicCustomerBookingItem {
    const cancelPolicy = evaluateCustomerBookingPolicy(
      booking,
      settings,
      'cancel',
    );
    const reschedulePolicy = evaluateCustomerBookingPolicy(
      booking,
      settings,
      'reschedule',
    );

    return {
      id: booking.id,
      startTime: booking.startTime.toISOString(),
      endTime: booking.endTime.toISOString(),
      status: booking.status,
      paymentStatus: booking.paymentStatus,
      serviceName: booking.service?.name ?? 'Service',
      employeeName: booking.employee?.name ?? 'Specialist',
      employeeId: booking.employeeId,
      serviceId: booking.serviceId,
      canReview:
        booking.status === BookingStatus.COMPLETED &&
        !reviewBookingIds.has(booking.id),
      canCancel: cancelPolicy.allowed,
      canReschedule: reschedulePolicy.allowed,
      policyMessage: cancelPolicy.allowed
        ? reschedulePolicy.allowed
          ? null
          : (reschedulePolicy.reason ?? null)
        : (cancelPolicy.reason ?? null),
      rescheduleCount: readRescheduleCount(booking.metadata),
      maxReschedules: settings.maxReschedulesPerBooking,
      allowProviderChangeOnReschedule: settings.allowProviderChangeOnReschedule,
      packagePurchaseId: booking.packagePurchaseId,
      packageId: readPackageIdFromMetadata(booking.metadata),
      packageName: readPackageNameFromMetadata(booking.metadata),
    };
  }

  async cancelBooking(
    slug: string,
    customerId: string,
    bookingId: string,
  ): Promise<{ booking: Booking }> {
    return this.cancelBookingInternal(slug, bookingId, { customerId });
  }

  async cancelBookingWithToken(
    slug: string,
    bookingId: string,
    token: string,
  ): Promise<{ booking: Booking }> {
    return this.cancelBookingInternal(slug, bookingId, { token });
  }

  async rescheduleBooking(
    slug: string,
    customerId: string,
    bookingId: string,
    dto: PublicCustomerRescheduleBookingDto,
  ): Promise<{ booking: Booking; previousStartTime: string }> {
    return this.rescheduleBookingInternal(slug, bookingId, dto, { customerId });
  }

  async rescheduleBookingWithToken(
    slug: string,
    bookingId: string,
    token: string,
    dto: PublicCustomerRescheduleBookingDto,
  ): Promise<{ booking: Booking; previousStartTime: string }> {
    return this.rescheduleBookingInternal(slug, bookingId, dto, { token });
  }

  async cancelPackageVisit(
    slug: string,
    customerId: string,
    bookingId: string,
  ): Promise<{ bookings: Booking[] }> {
    return this.cancelPackageVisitInternal(slug, bookingId, { customerId });
  }

  async cancelPackageVisitWithToken(
    slug: string,
    bookingId: string,
    token: string,
  ): Promise<{ bookings: Booking[] }> {
    return this.cancelPackageVisitInternal(slug, bookingId, { token });
  }

  async reschedulePackageVisit(
    slug: string,
    customerId: string,
    bookingId: string,
    dto: PublicCustomerReschedulePackageVisitDto,
  ): Promise<{ bookings: Booking[]; previousStartTime: string }> {
    return this.reschedulePackageVisitInternal(slug, bookingId, dto, {
      customerId,
    });
  }

  async reschedulePackageVisitWithToken(
    slug: string,
    bookingId: string,
    token: string,
    dto: PublicCustomerReschedulePackageVisitDto,
  ): Promise<{ bookings: Booking[]; previousStartTime: string }> {
    return this.reschedulePackageVisitInternal(slug, bookingId, dto, { token });
  }

  async notifyRunningLate(
    slug: string,
    customerId: string,
    bookingId: string,
    dto: PublicCustomerNotifyRunningLateDto = {},
  ): Promise<{
    bookingId: string;
    minutesLate: number;
    notifiedAt: string;
    staffNotified: boolean;
    customerRunningLate: ReturnType<typeof readCustomerRunningLate>;
  }> {
    const { booking } = await this.loadBookingForAction(slug, bookingId, {
      customerId,
    });
    const eligibility = buildCustomerRunningLateEligibility(booking);
    if (!eligibility.allowed) {
      throw new ForbiddenException(
        eligibility.reason ?? 'Running-late alert is not available',
      );
    }

    const minutesLate = normalizeCustomerRunningLateMinutes(dto.minutesLate);
    const snapshot = buildCustomerRunningLateSnapshot({
      minutesLate,
      customerId,
    });
    booking.metadata = applyCustomerRunningLateToMetadata(
      booking.metadata,
      snapshot,
    );
    await this.bookingRepo.save(booking);

    const staffNotification =
      await this.notificationsService.sendBusinessCustomerRunningLate(
        booking.id,
        minutesLate,
      );

    return {
      bookingId: booking.id,
      minutesLate,
      notifiedAt: snapshot.notifiedAt,
      staffNotified: staffNotification.emailSent,
      customerRunningLate: readCustomerRunningLate(booking.metadata),
    };
  }

  async getPackageVisitSummary(
    slug: string,
    bookingId: string,
    auth: { customerId?: string; token?: string },
  ): Promise<PublicPackageVisitSummary> {
    const { booking, settings } = await this.loadBookingForAction(
      slug,
      bookingId,
      auth,
    );
    const visit = await this.loadPackageVisitBookings(booking);
    return this.buildPackageVisitSummary(visit, settings);
  }

  async getManageContext(
    slug: string,
    bookingId: string,
    token: string,
  ): Promise<PublicBookingManageContext> {
    const business = await this.resolveBusiness(slug);
    const booking = await this.bookingRepo.findOne({
      where: { id: bookingId, businessId: business.id },
      relations: { employee: true, service: true, customer: true },
    });
    if (!booking) throw new NotFoundException('Booking not found');
    if (!validateBookingManageToken(booking, token)) {
      throw new ForbiddenException('Invalid or expired manage link');
    }

    const settings = resolveCustomerSelfServiceSettings(business.settings);
    const cancelPolicy = evaluateCustomerBookingPolicy(
      booking,
      settings,
      'cancel',
    );
    const reschedulePolicy = evaluateCustomerBookingPolicy(
      booking,
      settings,
      'reschedule',
    );
    const frontendUrl =
      this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';
    const packageVisit = isPackageVisitBooking(booking)
      ? this.buildPackageVisitSummary(
          await this.loadPackageVisitBookings(booking),
          settings,
        )
      : undefined;

    return {
      bookingId: booking.id,
      startTime: booking.startTime.toISOString(),
      endTime: booking.endTime.toISOString(),
      status: booking.status,
      paymentStatus: booking.paymentStatus,
      serviceName: booking.service?.name ?? 'Service',
      employeeName: booking.employee?.name ?? 'Specialist',
      employeeId: booking.employeeId,
      serviceId: booking.serviceId,
      customerEmail: booking.customer?.email ?? null,
      canCancel: packageVisit?.canCancelAll ?? cancelPolicy.allowed,
      canReschedule: packageVisit?.canRescheduleAll ?? reschedulePolicy.allowed,
      policyMessage:
        packageVisit?.policyMessage ??
        cancelPolicy.reason ??
        reschedulePolicy.reason ??
        null,
      manageUrl: buildBookingManageUrl(frontendUrl, slug, booking.id, token),
      allowProviderChangeOnReschedule: settings.allowProviderChangeOnReschedule,
      rescheduleCount: readRescheduleCount(booking.metadata),
      maxReschedules: settings.maxReschedulesPerBooking,
      packageVisit,
    };
  }

  async getCalendarIcs(
    slug: string,
    bookingId: string,
    token: string,
  ): Promise<{ filename: string; content: string }> {
    const business = await this.resolveBusiness(slug);
    const booking = await this.bookingRepo.findOne({
      where: { id: bookingId, businessId: business.id },
      relations: { employee: true, service: true },
    });
    if (!booking) throw new NotFoundException('Booking not found');
    if (!validateBookingManageToken(booking, token)) {
      throw new ForbiddenException('Invalid or expired manage link');
    }

    const event = buildBookingCalendarEventInput({
      bookingId: booking.id,
      serviceName: booking.service?.name ?? 'Appointment',
      providerName: booking.employee?.name ?? null,
      businessName: business.name ?? null,
      businessAddress: business.address ?? null,
      startTime: booking.startTime,
      endTime: booking.endTime,
    });

    return {
      filename: `booking-${booking.id}.ics`,
      content: buildIcsEventContent(event),
    };
  }

  private async cancelBookingInternal(
    slug: string,
    bookingId: string,
    auth: { customerId?: string; token?: string },
  ): Promise<{ booking: Booking }> {
    const { booking, settings } = await this.loadBookingForAction(
      slug,
      bookingId,
      auth,
    );
    const policy = evaluateCustomerBookingPolicy(booking, settings, 'cancel');
    if (!policy.allowed) {
      throw new ForbiddenException(
        policy.reason ?? 'Cancellation is not allowed',
      );
    }

    const actorId = this.actorUserId(booking, auth.customerId);
    const cancelled = await this.bookingService.cancel(
      booking.id,
      'Cancelled by customer',
      actorId,
    );

    await this.notificationsService.sendBookingCancellation(
      booking.id,
      'Cancelled by customer',
    );
    await this.notificationsService.sendBusinessCustomerBookingChange(
      booking.id,
      'cancelled',
    );

    return { booking: cancelled };
  }

  private async rescheduleBookingInternal(
    slug: string,
    bookingId: string,
    dto: PublicCustomerRescheduleBookingDto,
    auth: { customerId?: string; token?: string },
  ): Promise<{ booking: Booking; previousStartTime: string }> {
    const { booking, settings } = await this.loadBookingForAction(
      slug,
      bookingId,
      auth,
    );
    const policy = evaluateCustomerBookingPolicy(
      booking,
      settings,
      'reschedule',
    );
    if (!policy.allowed) {
      throw new ForbiddenException(
        policy.reason ?? 'Rescheduling is not allowed',
      );
    }

    const previousStartTime = booking.startTime.toISOString();
    const requestedEmployeeId = dto.employeeId ?? booking.employeeId;
    if (
      requestedEmployeeId !== booking.employeeId &&
      !settings.allowProviderChangeOnReschedule
    ) {
      throw new BadRequestException(
        'Changing provider is not allowed for this booking',
      );
    }

    const actorId = this.actorUserId(booking, auth.customerId);
    const updated = await this.bookingService.update(
      booking.id,
      {
        startTime: dto.startTime,
        employeeId: requestedEmployeeId,
        metadata: {
          customerRescheduleCount: readRescheduleCount(booking.metadata) + 1,
          lastCustomerRescheduleAt: new Date().toISOString(),
        },
      },
      actorId,
    );

    await this.notificationsService.sendBusinessCustomerBookingChange(
      booking.id,
      'rescheduled',
      {
        previousStartTime,
        newStartTime: updated.startTime.toISOString(),
      },
    );

    return { booking: updated, previousStartTime };
  }

  private async cancelPackageVisitInternal(
    slug: string,
    bookingId: string,
    auth: { customerId?: string; token?: string },
  ): Promise<{ bookings: Booking[] }> {
    const { booking, settings } = await this.loadBookingForAction(
      slug,
      bookingId,
      auth,
    );
    const visit = await this.loadPackageVisitBookings(booking);
    const policy = evaluatePackageVisitPolicy(visit, settings);
    if (!policy.canCancelAll) {
      throw new ForbiddenException(
        policy.policyMessage ?? 'Cancellation is not allowed for this visit',
      );
    }

    const actorId = this.actorUserId(booking, auth.customerId);
    const cancelled: Booking[] = [];
    for (const item of visit.filter((b) =>
      PACKAGE_VISIT_ACTIVE_STATUSES.includes(b.status),
    )) {
      const result = await this.bookingService.cancel(
        item.id,
        'Cancelled by customer (package visit)',
        actorId,
      );
      await this.notificationsService.sendBookingCancellation(
        item.id,
        'Cancelled by customer (package visit)',
      );
      await this.notificationsService.sendBusinessCustomerBookingChange(
        item.id,
        'cancelled',
      );
      cancelled.push(result);
    }

    return { bookings: cancelled };
  }

  private async reschedulePackageVisitInternal(
    slug: string,
    bookingId: string,
    dto: PublicCustomerReschedulePackageVisitDto,
    auth: { customerId?: string; token?: string },
  ): Promise<{ bookings: Booking[]; previousStartTime: string }> {
    const { booking, business, settings } = await this.loadBookingForAction(
      slug,
      bookingId,
      auth,
    );
    const visit = await this.loadPackageVisitBookings(booking);
    const active = visit.filter((b) =>
      PACKAGE_VISIT_ACTIVE_STATUSES.includes(b.status),
    );
    const policy = evaluatePackageVisitPolicy(visit, settings);
    if (!policy.canRescheduleAll) {
      throw new ForbiddenException(
        policy.policyMessage ?? 'Rescheduling is not allowed for this visit',
      );
    }

    if (dto.lines.length !== active.length) {
      throw new BadRequestException(
        'Provide a new time for each appointment in this package visit',
      );
    }

    const msSettings =
      this.multiServiceBookingsService.resolveSettingsFromBusiness(business);
    const orderedServices = toPackageServiceLines(active);
    let lineInputs;
    try {
      lineInputs = toPackageLineInputs(active, dto.lines);
      validatePackageSameDayBlock(
        orderedServices,
        lineInputs,
        msSettings.turnoverBufferMinutes,
      );
    } catch (err) {
      throw new BadRequestException((err as Error).message);
    }

    const primaryEmployeeId = lineInputs[0].employeeId;
    if (!primaryEmployeeId) {
      throw new BadRequestException('Provider is required for the visit');
    }
    for (const line of lineInputs) {
      line.employeeId = primaryEmployeeId;
    }

    const previousStartTime = active[0].startTime.toISOString();
    const actorId = this.actorUserId(booking, auth.customerId);
    const excludeBookingIds = active.map((item) => item.id);
    const sequential = buildSequentialAppointments(
      orderedServices,
      new Date(lineInputs[0].startTime),
      msSettings.turnoverBufferMinutes,
    );
    if (sequential.length !== active.length) {
      throw new BadRequestException(
        'Could not build the package visit schedule for this time',
      );
    }
    const blockEnd = sequential[sequential.length - 1].endTime;
    await this.bookingService.validateMultiServiceBlockFits(
      business.id,
      primaryEmployeeId,
      sequential[0].startTime,
      blockEnd,
      orderedServices.map((svc) => svc.serviceId),
      excludeBookingIds,
    );

    for (let i = 0; i < active.length; i++) {
      const item = active[i];
      const line = lineInputs[i];
      const requestedEmployeeId = line.employeeId ?? item.employeeId;
      if (
        requestedEmployeeId !== item.employeeId &&
        !settings.allowProviderChangeOnReschedule
      ) {
        throw new BadRequestException(
          'Changing provider is not allowed for this booking',
        );
      }
    }

    const updated = await this.bookingService.rescheduleSameVisitBlock(
      active.map((item, i) => ({
        bookingId: item.id,
        startTime: lineInputs[i].startTime,
        employeeId: primaryEmployeeId,
        metadata: {
          customerRescheduleCount: readRescheduleCount(item.metadata) + 1,
          lastCustomerRescheduleAt: new Date().toISOString(),
          packageVisitRescheduledAt: new Date().toISOString(),
        },
      })),
      actorId,
    );

    await this.notificationsService.sendBusinessCustomerBookingChange(
      booking.id,
      'rescheduled',
      {
        previousStartTime,
        newStartTime: updated[0]?.startTime.toISOString(),
      },
    );

    return { bookings: updated, previousStartTime };
  }

  private async loadPackageVisitBookings(anchor: Booking): Promise<Booking[]> {
    if (!anchor.packagePurchaseId) return [anchor];
    const bookings = await this.bookingRepo.find({
      where: {
        businessId: anchor.businessId,
        packagePurchaseId: anchor.packagePurchaseId,
      },
      relations: { employee: true, service: true },
      order: { startTime: 'ASC' },
    });
    return bookings.length ? sortPackageVisitBookings(bookings) : [anchor];
  }

  private buildPackageVisitSummary(
    visit: Booking[],
    settings: CustomerSelfServiceSettings,
  ): PublicPackageVisitSummary {
    const anchor = visit[0];
    const policy = evaluatePackageVisitPolicy(visit, settings);

    return {
      packagePurchaseId: anchor.packagePurchaseId!,
      packageId: readPackageIdFromMetadata(anchor.metadata),
      packageName:
        readPackageNameFromMetadata(anchor.metadata) ?? 'Package visit',
      appointments: visit.map((booking) => {
        const cancelPolicy = evaluateCustomerBookingPolicy(
          booking,
          settings,
          'cancel',
        );
        const reschedulePolicy = evaluateCustomerBookingPolicy(
          booking,
          settings,
          'reschedule',
        );
        return {
          bookingId: booking.id,
          serviceId: booking.serviceId,
          serviceName: booking.service?.name ?? 'Service',
          startTime: booking.startTime.toISOString(),
          endTime: booking.endTime.toISOString(),
          employeeId: booking.employeeId,
          employeeName: booking.employee?.name ?? 'Specialist',
          status: booking.status,
          canCancel: cancelPolicy.allowed,
          canReschedule: reschedulePolicy.allowed,
          rescheduleCount: readRescheduleCount(booking.metadata),
          maxReschedules: settings.maxReschedulesPerBooking,
        };
      }),
      canCancelAll: policy.canCancelAll,
      canRescheduleAll: policy.canRescheduleAll,
      policyMessage: policy.policyMessage,
      allowProviderChangeOnReschedule: settings.allowProviderChangeOnReschedule,
    };
  }

  private async loadBookingForAction(
    slug: string,
    bookingId: string,
    auth: { customerId?: string; token?: string },
  ): Promise<{
    booking: Booking;
    business: Business;
    settings: CustomerSelfServiceSettings;
  }> {
    const business = await this.resolveBusiness(slug);
    const booking = await this.bookingRepo.findOne({
      where: { id: bookingId, businessId: business.id },
      relations: { employee: true, service: true, customer: true },
    });
    if (!booking) throw new NotFoundException('Booking not found');

    if (auth.customerId) {
      if (booking.customerId !== auth.customerId) {
        throw new NotFoundException('Booking not found');
      }
    } else if (auth.token) {
      if (!validateBookingManageToken(booking, auth.token)) {
        throw new ForbiddenException('Invalid or expired manage link');
      }
    } else {
      throw new ForbiddenException('Authentication required');
    }

    const settings = resolveCustomerSelfServiceSettings(business.settings);
    return { booking, business, settings };
  }

  private actorUserId(booking: Booking, customerId?: string): string {
    return `customer:${customerId ?? booking.customerId}`;
  }

  private async resolveBusiness(slug: string): Promise<Business> {
    const business = await this.businessService.findBySlug(slug);
    if (!business.isActive) {
      throw new NotFoundException('Business not found');
    }
    return business;
  }
}
