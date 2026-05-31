import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Business } from '../business/entities/business.entity.js';
import { Customer } from '../customer/entities/customer.entity.js';
import { Booking } from '../booking/entities/booking.entity.js';
import { BusinessModule } from '../business/business.module.js';
import { NotificationsModule } from '../notifications/notifications.module.js';
import { MarketingAutomationLog } from './entities/marketing-automation-log.entity.js';
import { MarketingAutomationService } from './marketing-automation.service.js';
import { MarketingAutomationScheduler } from './marketing-automation.scheduler.js';
import { MarketingAutomationController } from './marketing-automation.controller.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([Business, Customer, Booking, MarketingAutomationLog]),
    BusinessModule,
    NotificationsModule,
  ],
  controllers: [MarketingAutomationController],
  providers: [MarketingAutomationService, MarketingAutomationScheduler],
  exports: [MarketingAutomationService],
})
export class MarketingAutomationModule {}
