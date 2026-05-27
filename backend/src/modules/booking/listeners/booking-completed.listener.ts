import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventType } from '../../../events/event-types.js';
import { OperationalEvent } from '../../../events/store/event-store.entity.js';
import { Booking } from '../entities/booking.entity.js';
import { LoyaltyService } from '../../loyalty/loyalty.service.js';
import { InventoryService } from '../../inventory/inventory.service.js';
import { ReviewsService } from '../../reviews/reviews.service.js';
import { NotificationsService } from '../../notifications/notifications.service.js';

@Injectable()
export class BookingCompletedListener {
  private readonly logger = new Logger(BookingCompletedListener.name);

  constructor(
    @InjectRepository(Booking) private bookingRepo: Repository<Booking>,
    private loyaltyService: LoyaltyService,
    private inventoryService: InventoryService,
    private reviewsService: ReviewsService,
    private notificationsService: NotificationsService,
  ) {}

  @OnEvent(EventType.BOOKING_COMPLETED)
  async handle(event: OperationalEvent): Promise<void> {
    const booking = await this.bookingRepo.findOne({
      where: { id: event.aggregateId },
      relations: { service: true, customer: true, business: true },
    });
    if (!booking?.customerId) return;

    try {
      if (booking.service) {
        await this.loyaltyService.earn(
          booking.businessId,
          booking.customerId,
          Number(booking.service.price),
          booking.id,
        );
      }
      await this.inventoryService.deductForService(booking.serviceId);
      await this.reviewsService.ensureReviewToken(booking.id);
      await this.notificationsService.sendReviewRequest(booking.id);
      this.logger.log(`Post-completion hooks ran for booking ${booking.id}`);
    } catch (err) {
      this.logger.warn(`Post-completion hooks failed for ${booking.id}: ${err}`);
    }
  }
}
