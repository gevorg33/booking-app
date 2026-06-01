import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GiftCard } from './entities/gift-card.entity.js';
import { GiftCardServiceCredit } from './entities/gift-card-service-credit.entity.js';
import { GiftCardRedemption } from './entities/gift-card-redemption.entity.js';
import { GiftCardsService } from './gift-cards.service.js';
import { GiftCardPurchaseService } from './gift-card-purchase.service.js';
import { GiftCardFulfillmentService } from './gift-card-fulfillment.service.js';
import { GiftCardDeliveryService } from './gift-card-delivery.service.js';
import { GiftCardsController, GiftCardProviderController } from './gift-cards.controller.js';
import { GiftCardPublicController } from './gift-card-public.controller.js';
import { BusinessModule } from '../business/business.module.js';
import { Business } from '../business/entities/business.entity.js';
import { Service } from '../service/entities/service.entity.js';
import { Employee } from '../employee/entities/employee.entity.js';
import { PublicBookingModule } from '../public-booking/public-booking.module.js';
import { BookingModule } from '../booking/booking.module.js';
import { NotificationsModule } from '../notifications/notifications.module.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      GiftCard,
      GiftCardServiceCredit,
      GiftCardRedemption,
      Business,
      Service,
      Employee,
    ]),
    BusinessModule,
    NotificationsModule,
    forwardRef(() => PublicBookingModule),
    forwardRef(() => BookingModule),
  ],
  controllers: [GiftCardsController, GiftCardProviderController, GiftCardPublicController],
  providers: [
    GiftCardsService,
    GiftCardPurchaseService,
    GiftCardFulfillmentService,
    GiftCardDeliveryService,
  ],
  exports: [GiftCardsService, GiftCardPurchaseService, GiftCardFulfillmentService, GiftCardDeliveryService],
})
export class GiftCardsModule {}
