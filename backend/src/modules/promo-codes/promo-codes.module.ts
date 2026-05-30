import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PromoCode } from './entities/promo-code.entity.js';
import { PromoCodesService } from './promo-codes.service.js';
import { PromoCodesController } from './promo-codes.controller.js';
import { CheckoutPricingService } from './checkout-pricing.service.js';
import { LoyaltyModule } from '../loyalty/loyalty.module.js';
import { GiftCardsModule } from '../gift-cards/gift-cards.module.js';
import { BusinessModule } from '../business/business.module.js';

@Module({
  imports: [TypeOrmModule.forFeature([PromoCode]), LoyaltyModule, GiftCardsModule, BusinessModule],
  controllers: [PromoCodesController],
  providers: [PromoCodesService, CheckoutPricingService],
  exports: [PromoCodesService, CheckoutPricingService],
})
export class PromoCodesModule {}
