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
import { PublicCustomerRescheduleBookingDto } from './dto/public-customer-booking.dto.js';
import type { PublicCustomerBookingItem } from './public-customer-auth.types.js';

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
}

@Injectable()
export class PublicCustomerBookingService {
  constructor(
    private businessService: BusinessService,
    private bookingService: BookingService,
    private notificationsService: NotificationsService,
    private configService: ConfigService,
    @InjectRepository(Booking) private bookingRepo: Repository<Booking>,
  ) {}

  enrichBookingItem(
    booking: Booking,
    settings: CustomerSelfServiceSettings,
    reviewBookingIds: Set<string>,
  ): PublicCustomerBookingItem {
    const cancelPolicy = evaluateCustomerBookingPolicy(booking, settings, 'cancel');
    const reschedulePolicy = evaluateCustomerBookingPolicy(booking, settings, 'reschedule');

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
        booking.status === BookingStatus.COMPLETED && !reviewBookingIds.has(booking.id),
      canCancel: cancelPolicy.allowed,
      canReschedule: reschedulePolicy.allowed,
      policyMessage: cancelPolicy.allowed
        ? reschedulePolicy.allowed
          ? null
          : reschedulePolicy.reason ?? null
        : cancelPolicy.reason ?? null,
      rescheduleCount: readRescheduleCount(booking.metadata),
      maxReschedules: settings.maxReschedulesPerBooking,
      allowProviderChangeOnReschedule: settings.allowProviderChangeOnReschedule,
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

  async getManageContext(slug: string, bookingId: string, token: string): Promise<PublicBookingManageContext> {
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
    const cancelPolicy = evaluateCustomerBookingPolicy(booking, settings, 'cancel');
    const reschedulePolicy = evaluateCustomerBookingPolicy(booking, settings, 'reschedule');
    const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';

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
      canCancel: cancelPolicy.allowed,
      canReschedule: reschedulePolicy.allowed,
      policyMessage:
        cancelPolicy.reason ?? reschedulePolicy.reason ?? null,
      manageUrl: buildBookingManageUrl(frontendUrl, slug, booking.id, token),
      allowProviderChangeOnReschedule: settings.allowProviderChangeOnReschedule,
      rescheduleCount: readRescheduleCount(booking.metadata),
      maxReschedules: settings.maxReschedulesPerBooking,
    };
  }

  private async cancelBookingInternal(
    slug: string,
    bookingId: string,
    auth: { customerId?: string; token?: string },
  ): Promise<{ booking: Booking }> {
    const { booking, settings } = await this.loadBookingForAction(slug, bookingId, auth);
    const policy = evaluateCustomerBookingPolicy(booking, settings, 'cancel');
    if (!policy.allowed) {
      throw new ForbiddenException(policy.reason ?? 'Cancellation is not allowed');
    }

    const actorId = this.actorUserId(booking, auth.customerId);
    const cancelled = await this.bookingService.cancel(
      booking.id,
      'Cancelled by customer',
      actorId,
    );

    await this.notificationsService.sendBookingCancellation(booking.id, 'Cancelled by customer');
    await this.notificationsService.sendBusinessCustomerBookingChange(booking.id, 'cancelled');

    return { booking: cancelled };
  }

  private async rescheduleBookingInternal(
    slug: string,
    bookingId: string,
    dto: PublicCustomerRescheduleBookingDto,
    auth: { customerId?: string; token?: string },
  ): Promise<{ booking: Booking; previousStartTime: string }> {
    const { booking, settings } = await this.loadBookingForAction(slug, bookingId, auth);
    const policy = evaluateCustomerBookingPolicy(booking, settings, 'reschedule');
    if (!policy.allowed) {
      throw new ForbiddenException(policy.reason ?? 'Rescheduling is not allowed');
    }

    const previousStartTime = booking.startTime.toISOString();
    const requestedEmployeeId = dto.employeeId ?? booking.employeeId;
    if (
      requestedEmployeeId !== booking.employeeId &&
      !settings.allowProviderChangeOnReschedule
    ) {
      throw new BadRequestException('Changing provider is not allowed for this booking');
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

    await this.notificationsService.sendBusinessCustomerBookingChange(booking.id, 'rescheduled', {
      previousStartTime,
      newStartTime: updated.startTime.toISOString(),
    });

    return { booking: updated, previousStartTime };
  }

  private async loadBookingForAction(
    slug: string,
    bookingId: string,
    auth: { customerId?: string; token?: string },
  ): Promise<{ booking: Booking; business: Business; settings: CustomerSelfServiceSettings }> {
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
