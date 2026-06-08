import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Business } from '../business/entities/business.entity.js';
import { Customer } from '../customer/entities/customer.entity.js';
import { Booking } from '../booking/entities/booking.entity.js';
import { LoyaltyModule } from '../loyalty/loyalty.module.js';
import { ReferralProgramService } from './referral-program.service.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([Business, Customer, Booking]),
    LoyaltyModule,
  ],
  providers: [ReferralProgramService],
  exports: [ReferralProgramService],
})
export class ReferralProgramModule {}
