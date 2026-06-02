import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Booking } from '../booking/entities/booking.entity.js';
import { Business } from '../business/entities/business.entity.js';
import { BusinessModule } from '../business/business.module.js';
import { NotificationLog } from './entities/notification-log.entity.js';
import { NotificationsService } from './notifications.service.js';
import { EmailService } from './email.service.js';
import { SmsService } from './sms.service.js';
import { WhatsAppService } from './whatsapp.service.js';
import { WhatsAppIntegrationService } from './whatsapp-integration.service.js';
import { ReminderScheduler } from './reminder.scheduler.js';
import { BookingNotificationListener } from './listeners/booking-notification.listener.js';
import { NotificationsController } from './notifications.controller.js';
import { NotificationEmailTemplateService } from './notification-email-template.service.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([Booking, Business, NotificationLog]),
    BusinessModule,
  ],
  controllers: [NotificationsController],
  providers: [
    NotificationsService,
    EmailService,
    SmsService,
    WhatsAppService,
    WhatsAppIntegrationService,
    ReminderScheduler,
    BookingNotificationListener,
    NotificationEmailTemplateService,
  ],
  exports: [NotificationsService, EmailService, SmsService, WhatsAppService, WhatsAppIntegrationService, NotificationEmailTemplateService],
})
export class NotificationsModule {}
