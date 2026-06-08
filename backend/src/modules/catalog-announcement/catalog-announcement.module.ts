import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Business } from '../business/entities/business.entity.js';
import { Customer } from '../customer/entities/customer.entity.js';
import { NotificationsModule } from '../notifications/notifications.module.js';
import { MarketingAutomationLog } from '../marketing-automation/entities/marketing-automation-log.entity.js';
import { CatalogAnnouncementService } from './catalog-announcement.service.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([Business, Customer, MarketingAutomationLog]),
    NotificationsModule,
  ],
  providers: [CatalogAnnouncementService],
  exports: [CatalogAnnouncementService],
})
export class CatalogAnnouncementModule {}
