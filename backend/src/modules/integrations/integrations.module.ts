import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BusinessApiKey } from './entities/business-api-key.entity.js';
import { WebhookSubscription } from './entities/webhook-subscription.entity.js';
import { WebhookDelivery } from './entities/webhook-delivery.entity.js';
import { AiUsageLog } from './entities/ai-usage-log.entity.js';
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
import { OpenAiModule } from './openai/openai.module.js';
import { Business } from '../business/entities/business.entity.js';
import { Customer } from '../customer/entities/customer.entity.js';
import { Booking } from '../booking/entities/booking.entity.js';
import { Employee } from '../employee/entities/employee.entity.js';
import { Service } from '../service/entities/service.entity.js';
import { ZendeskModule } from './zendesk/zendesk.module.js';
import { ZendeskCustomerSyncListener } from './zendesk/zendesk-customer-sync.listener.js';
import { ZendeskReviewListener } from './zendesk/zendesk-review.listener.js';
import { DistributionIntegrationService } from './distribution/distribution-integration.service.js';
import { ZapierIntegrationService } from './zapier/zapier-integration.service.js';
import { AccountingIntegrationService } from './accounting/accounting-integration.service.js';
import { AccountingExportService } from './accounting/accounting-export.service.js';
import { IntegrationsDocsService } from './integrations-docs.service.js';
import { Expense } from '../expenses/entities/expense.entity.js';
import { CommissionRule } from '../commissions/entities/commission-rule.entity.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      BusinessApiKey,
      WebhookSubscription,
      WebhookDelivery,
      AiUsageLog,
      Business,
      Customer,
      Booking,
      Employee,
      Service,
      Expense,
      CommissionRule,
    ]),
    BusinessModule,
    forwardRef(() => BookingModule),
    CustomerModule,
    ServiceModule,
    OpenAiModule,
    ZendeskModule,
  ],
  controllers: [IntegrationsController, BusinessApiController],
  providers: [
    ApiKeyService,
    WebhooksService,
    WebhookDispatcherListener,
    ApiKeyGuard,
    ZendeskCustomerSyncListener,
    ZendeskReviewListener,
    DistributionIntegrationService,
    ZapierIntegrationService,
    AccountingExportService,
    AccountingIntegrationService,
    IntegrationsDocsService,
  ],
  exports: [ApiKeyService, WebhooksService, OpenAiModule, ZendeskModule, DistributionIntegrationService, ZapierIntegrationService, AccountingIntegrationService],
})
export class IntegrationsModule {}
