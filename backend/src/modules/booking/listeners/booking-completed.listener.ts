import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventType } from '../../../events/event-types.js';
import { OperationalEvent } from '../../../events/store/event-store.entity.js';
import { Booking } from '../entities/booking.entity.js';
import { InventoryService } from '../../inventory/inventory.service.js';
import { ReviewsService } from '../../reviews/reviews.service.js';
import { NotificationsService } from '../../notifications/notifications.service.js';
import { ReferralProgramService } from '../../referral-program/referral-program.service.js';
import { CustomerRebookingCadenceService } from '../../customer/customer-rebooking-cadence.service.js';
import { AppEvent } from '../../analytics/entities/app-event.entity.js';
import { buildServerReferralConvertedEvent } from '../../../common/utils/referral-conversion-analytics.util.js';
import { REFERRAL_METADATA_CODE_USED } from '../../../common/utils/referral-program.fixtures.js';

@Injectable()
export class BookingCompletedListener {
  private readonly logger = new Logger(BookingCompletedListener.name);

  constructor(
    @InjectRepository(Booking) private bookingRepo: Repository<Booking>,
    @InjectRepository(AppEvent) private appEventRepo: Repository<AppEvent>,
    private inventoryService: InventoryService,
    private reviewsService: ReviewsService,
    private notificationsService: NotificationsService,
    private referralProgramService: ReferralProgramService,
    private customerRebookingCadenceService: CustomerRebookingCadenceService,
  ) {}

  @OnEvent(EventType.BOOKING_COMPLETED)
  async handle(event: OperationalEvent): Promise<void> {
    const booking = await this.bookingRepo.findOne({
      where: { id: event.aggregateId },
      relations: { service: true, business: true, customer: true },
    });
    if (!booking) return;

    try {
      await this.inventoryService.deductForService(booking.serviceId);
      await this.reviewsService.ensureReviewToken(booking.id);
      await this.notificationsService.sendReviewRequest(booking.id);
      this.logger.log(`Post-completion hooks ran for booking ${booking.id}`);
    } catch (err) {
      this.logger.warn(
        `Post-completion hooks failed for ${booking.id}: ${err}`,
      );
    }

    try {
      await this.customerRebookingCadenceService.persistLearnedCadenceForCompletedBooking(
        booking.id,
      );
    } catch (err) {
      this.logger.warn(
        `Rebooking cadence learning failed for ${booking.id}: ${err}`,
      );
    }

    try {
      const conversion = await this.referralProgramService.processBookingCompleted(
        booking.id,
      );
      if (!conversion.converted || !booking.business?.slug) return;

      const referralCode =
        typeof booking.customer?.metadata?.[REFERRAL_METADATA_CODE_USED] === 'string'
          ? booking.customer.metadata[REFERRAL_METADATA_CODE_USED]
          : undefined;

      const payload = buildServerReferralConvertedEvent({
        businessId: booking.businessId,
        tenantSlug: booking.business.slug,
        bookingId: booking.id,
        referrerCustomerId: conversion.referrerCustomerId!,
        refereeCustomerId: booking.customerId!,
        referralCode,
      });
      await this.appEventRepo.save(this.appEventRepo.create(payload));
    } catch (err) {
      this.logger.warn(
        `Referral conversion hook failed for ${booking.id}: ${err}`,
      );
    }
  }
}
