import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BusinessApiKey } from './entities/business-api-key.entity.js';
import { WebhookSubscription } from './entities/webhook-subscription.entity.js';
import { WebhookDelivery } from './entities/webhook-delivery.entity.js';
import { ApiKeyService } from './api-key.service.js';
import { WebhooksService } from './webhooks.service.js';
import { IntegrationsController } from './integrations.controller.js';
import { BusinessApiController } from './business-api.controller.js';
import { WebhookDispatcherListener } from './webhook-dispatcher.listener.js';
import { BusinessModule } from '../business/business.module.js';
import { BookingModule } from '../booking/booking.module.js';
import { CustomerModule } from '../customer/customer.module.js';
import { ServiceModule } from '../service/service.module.js';
import { ApiKeyGuard } from '../../common/guards/api-key.guard.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([BusinessApiKey, WebhookSubscription, WebhookDelivery]),
    BusinessModule,
    BookingModule,
    CustomerModule,
    ServiceModule,
  ],
  controllers: [IntegrationsController, BusinessApiController],
  providers: [ApiKeyService, WebhooksService, WebhookDispatcherListener, ApiKeyGuard],
  exports: [ApiKeyService, WebhooksService],
})
export class IntegrationsModule {}
