import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Business } from '../business/entities/business.entity.js';
import { Customer } from '../customer/entities/customer.entity.js';
import { Booking } from '../booking/entities/booking.entity.js';
import { BusinessModule } from '../business/business.module.js';
import { CustomerModule } from '../customer/customer.module.js';
import { NotificationsModule } from '../notifications/notifications.module.js';
import { LoyaltyModule } from '../loyalty/loyalty.module.js';
import { MarketingAutomationLog } from './entities/marketing-automation-log.entity.js';
import { MarketingAutomationService } from './marketing-automation.service.js';
import { MarketingAutomationScheduler } from './marketing-automation.scheduler.js';
import { MarketingAutomationController } from './marketing-automation.controller.js';
import { AppEvent } from '../analytics/entities/app-event.entity.js';
import { Service } from '../service/entities/service.entity.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Business,
      Customer,
      Booking,
      MarketingAutomationLog,
      AppEvent,
      Service,
    ]),
    BusinessModule,
    NotificationsModule,
    CustomerModule,
    LoyaltyModule,
  ],
  controllers: [MarketingAutomationController],
  providers: [MarketingAutomationService, MarketingAutomationScheduler],
  exports: [MarketingAutomationService],
})
export class MarketingAutomationModule {}
