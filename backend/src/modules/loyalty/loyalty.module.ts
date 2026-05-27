import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LoyaltyAccount, LoyaltyTransaction } from './entities/loyalty-account.entity.js';
import { LoyaltyService } from './loyalty.service.js';
import { LoyaltyController } from './loyalty.controller.js';
import { BusinessModule } from '../business/business.module.js';

@Module({
  imports: [TypeOrmModule.forFeature([LoyaltyAccount, LoyaltyTransaction]), BusinessModule],
  controllers: [LoyaltyController],
  providers: [LoyaltyService],
  exports: [LoyaltyService],
})
export class LoyaltyModule {}
