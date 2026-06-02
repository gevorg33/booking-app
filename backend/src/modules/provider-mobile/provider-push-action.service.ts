import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Booking, BookingStatus, PaymentStatus } from '../booking/entities/booking.entity.js';
import { BookingService } from '../booking/booking.service.js';
import { ProviderMobileService } from './provider-mobile.service.js';
import { PushService } from './push.service.js';

export interface PushActionPayload {
  actionId: 'confirm' | 'mark_paid' | 'suggest_reschedule';
  bookingId: string;
  businessId: string;
}

@Injectable()
export class ProviderPushActionService {
  private readonly logger = new Logger(ProviderPushActionService.name);

  constructor(
    @InjectRepository(Booking) private bookingRepo: Repository<Booking>,
    private bookingService: BookingService,
    private providerMobile: ProviderMobileService,
    private pushService: PushService,
  ) {}

  async handleAction(
    businessId: string,
    userId: string,
    dto: PushActionPayload,
  ): Promise<{ success: boolean; summary: string }> {
    const access = await this.providerMobile.resolveMobileAccess(businessId, userId);
    const scopedEmployeeId = this.providerMobile.getScopedEmployeeId(access);

    const booking = await this.bookingRepo.findOne({
      where: { id: dto.bookingId, businessId },
      relations: { customer: true, service: true },
    });
    if (!booking) {
      throw new BadRequestException('Booking not found');
    }
    if (scopedEmployeeId && booking.employeeId !== scopedEmployeeId) {
      throw new BadRequestException('Not authorized for this appointment');
    }

    switch (dto.actionId) {
      case 'confirm':
        await this.bookingService.update(
          booking.id,
          { status: BookingStatus.CONFIRMED },
          userId,
        );
        return { success: true, summary: `Confirmed ${booking.customer?.name ?? 'appointment'}` };

      case 'mark_paid': {
        const isCashAtVenue =
          booking.metadata?.payAtVenue === true || booking.metadata?.paymentMethod === 'cash';
        await this.bookingService.update(
          booking.id,
          {
            paymentStatus: PaymentStatus.PAID,
            status: BookingStatus.COMPLETED,
            metadata: {
              ...(booking.metadata ?? {}),
              ...(isCashAtVenue
                ? {
                    paidVia: 'cash',
                    paidAt: new Date().toISOString(),
                    paidByUserId: userId,
                  }
                : {}),
            },
          },
          userId,
        );
        return { success: true, summary: `Marked paid — ${booking.customer?.name ?? 'appointment'}` };
      }

      case 'suggest_reschedule':
        return {
          success: true,
          summary: `Open AI to reschedule ${booking.customer?.name ?? 'appointment'}`,
        };

      default:
        throw new BadRequestException('Unknown push action');
    }
  }

  async notifyBookingActions(
    userId: string,
    businessId: string,
    bookingId: string,
    title: string,
    body: string,
  ): Promise<number> {
    return this.pushService.sendToUser(userId, businessId, {
      title,
      body,
      url: `/provider/today?bookingId=${bookingId}`,
      actions: [
        { id: 'confirm', label: 'Confirm' },
        { id: 'mark_paid', label: 'Mark paid' },
        { id: 'suggest_reschedule', label: 'Reschedule' },
      ],
      bookingId,
      businessId,
    });
  }
}
