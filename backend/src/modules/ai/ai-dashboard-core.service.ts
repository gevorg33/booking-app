import { Injectable } from '@nestjs/common';
import type { CommandResult } from './command-completion.types.js';
import { AiCatalogService } from './ai-catalog.service.js';
import { AiPaymentsService } from './ai-payments.service.js';
import { AiMarketingGrowthService } from './ai-marketing-growth.service.js';
import { AiNotificationSettingsService } from './ai-notification-settings.service.js';
import { AiWhatsappIntegrationService } from './ai-whatsapp-integration.service.js';
import { AiPushNotificationsService } from './ai-push-notifications.service.js';
import { AiIntegrationsService } from './ai-integrations.service.js';
import { AiOperationsService } from './ai-operations.service.js';
import { AiBusinessCurrencyService } from './ai-business-currency.service.js';
import { AiBusinessTaxService } from './ai-business-tax.service.js';
import { AiBusinessComplianceService } from './ai-business-compliance.service.js';
import { AiBusinessLanguagesService } from './ai-business-languages.service.js';
import { AiBusinessDateFormatService } from './ai-business-date-format.service.js';
import {
  dispatchDashboardCoreIntent,
  type DashboardCoreDispatchContext,
  type DashboardCoreLogicDeps,
} from './ai-dashboard-core.logic.js';
import { isDashboardCoreDispatchIntent } from './ai-dashboard-core.util.js';

@Injectable()
export class AiDashboardCoreService {
  private readonly deps: DashboardCoreLogicDeps;

  constructor(
    private readonly catalog: AiCatalogService,
    private readonly payments: AiPaymentsService,
    private readonly marketingGrowth: AiMarketingGrowthService,
    private readonly notificationSettings: AiNotificationSettingsService,
    private readonly whatsappIntegration: AiWhatsappIntegrationService,
    private readonly pushNotifications: AiPushNotificationsService,
    private readonly integrations: AiIntegrationsService,
    private readonly operations: AiOperationsService,
    private readonly businessCurrency: AiBusinessCurrencyService,
    private readonly businessTax: AiBusinessTaxService,
    private readonly businessCompliance: AiBusinessComplianceService,
    private readonly businessLanguages: AiBusinessLanguagesService,
    private readonly businessDateFormat: AiBusinessDateFormatService,
  ) {
    this.deps = {
      catalog: this.catalog,
      payments: this.payments,
      marketingGrowth: this.marketingGrowth,
      notificationSettings: this.notificationSettings,
      whatsappIntegration: this.whatsappIntegration,
      pushNotifications: this.pushNotifications,
      integrations: this.integrations,
      operations: this.operations,
      businessCurrency: this.businessCurrency,
      businessTax: this.businessTax,
      businessCompliance: this.businessCompliance,
      businessLanguages: this.businessLanguages,
      businessDateFormat: this.businessDateFormat,
    };
  }

  async tryDispatch(
    ctx: DashboardCoreDispatchContext,
  ): Promise<CommandResult | null> {
    if (!isDashboardCoreDispatchIntent(ctx.action)) {
      return null;
    }
    return dispatchDashboardCoreIntent(this.deps, ctx);
  }
}
