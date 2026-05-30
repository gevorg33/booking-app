import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LoyaltyAccount, LoyaltyTransaction } from './entities/loyalty-account.entity.js';
import { LoyaltyService } from './loyalty.service.js';
import { LoyaltyController } from './loyalty.controller.js';
import { LoyaltyAwardService } from './loyalty-award.service.js';
import { LoyaltyCustomerMatcherService } from './loyalty-customer-matcher.service.js';
import { BusinessModule } from '../business/business.module.js';
import { Booking } from '../booking/entities/booking.entity.js';
import { Customer } from '../customer/entities/customer.entity.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      LoyaltyAccount,
      LoyaltyTransaction,
      Booking,
      Customer,
    ]),
    BusinessModule,
  ],
  controllers: [LoyaltyController],
  providers: [LoyaltyService, LoyaltyAwardService, LoyaltyCustomerMatcherService],
  exports: [LoyaltyService, LoyaltyAwardService, LoyaltyCustomerMatcherService],
})
export class LoyaltyModule {}
