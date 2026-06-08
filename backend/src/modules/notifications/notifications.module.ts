import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Booking } from '../booking/entities/booking.entity.js';
import { Business } from '../business/entities/business.entity.js';
import { Customer } from '../customer/entities/customer.entity.js';
import { BusinessModule } from '../business/business.module.js';
import { ClinicTestResult } from '../clinic-test-results/entities/clinic-test-result.entity.js';
import { FirebaseAdminModule } from '../../common/firebase/firebase-admin.module.js';
import { NotificationLog } from './entities/notification-log.entity.js';
import { ConsumerNativePushToken } from './entities/consumer-native-push-token.entity.js';
import { NotificationsService } from './notifications.service.js';
import { EmailService } from './email.service.js';
import { SmsService } from './sms.service.js';
import { WhatsAppService } from './whatsapp.service.js';
import { WhatsAppIntegrationService } from './whatsapp-integration.service.js';
import { ReminderScheduler } from './reminder.scheduler.js';
import { BookingNotificationListener } from './listeners/booking-notification.listener.js';
import { MarketingCustomerRegistrationListener } from './marketing-customer-registration.listener.js';
import { NotificationsController } from './notifications.controller.js';
import { NotificationEmailTemplateService } from './notification-email-template.service.js';
import { ConsumerPushTokenService } from './consumer-push-token.service.js';
import { ConsumerPushDispatchService } from './consumer-push-dispatch.service.js';
import { ConsumerPushDeliverabilityScheduler } from './consumer-push-deliverability.scheduler.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Booking,
      Business,
      Customer,
      NotificationLog,
      ClinicTestResult,
      ConsumerNativePushToken,
    ]),
    BusinessModule,
    FirebaseAdminModule,
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
    MarketingCustomerRegistrationListener,
    NotificationEmailTemplateService,
    ConsumerPushTokenService,
    ConsumerPushDispatchService,
    ConsumerPushDeliverabilityScheduler,
  ],
  exports: [
    NotificationsService,
    EmailService,
    SmsService,
    WhatsAppService,
    WhatsAppIntegrationService,
    NotificationEmailTemplateService,
    ConsumerPushTokenService,
    ConsumerPushDispatchService,
  ],
})
export class NotificationsModule {}
