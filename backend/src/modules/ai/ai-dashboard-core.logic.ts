import type { Customer } from '../customer/entities/customer.entity.js';
import type { Service } from '../service/entities/service.entity.js';
import type { CommandResult } from './command-completion.types.js';
import type { AiCatalogService } from './ai-catalog.service.js';
import type { AiPaymentsService } from './ai-payments.service.js';
import type { AiMarketingGrowthService } from './ai-marketing-growth.service.js';
import type { AiNotificationSettingsService } from './ai-notification-settings.service.js';
import type { AiWhatsappIntegrationService } from './ai-whatsapp-integration.service.js';
import type { AiPushNotificationsService } from './ai-push-notifications.service.js';
import type { AiIntegrationsService } from './ai-integrations.service.js';
import type { AiOperationsService } from './ai-operations.service.js';
import type { AiBusinessCurrencyService } from './ai-business-currency.service.js';
import type { AiBusinessTaxService } from './ai-business-tax.service.js';
import type { AiBusinessComplianceService } from './ai-business-compliance.service.js';
import type { AiBusinessLanguagesService } from './ai-business-languages.service.js';
import type { AiBusinessDateFormatService } from './ai-business-date-format.service.js';
import { enrichDeactivateServiceCategoryScopeParamsFromPrompt } from './ai-deactivate-service-category-scope.util.js';
import { parseUpdateServiceDurationBufferFromPrompt } from './ai-service-duration-buffer.util.js';
import { parseCurrencyFromPrompt } from './ai-business-currency.util.js';
import {
  parseBusinessTaxFromPrompt,
  parseSetServiceTaxRateFromPrompt,
} from './ai-business-tax.util.js';
import {
  parseConfigureGranularConsentFromPrompt,
  parseConfigurePrivacyRetentionFromPrompt,
  parseConfigureHipaaSessionTimeoutFromPrompt,
  parseEnableHipaaModeFromPrompt,
} from './ai-business-compliance.util.js';
import { parseConfigureStackedTaxRulesFromPrompt } from './ai-stacked-tax.util.js';
import { parseBusinessLanguagesFromPrompt } from './ai-business-languages.util.js';
import { parseBusinessDateFormatFromPrompt } from './ai-business-date-format.util.js';
import {
  isDashboardCoreDispatchIntent,
  isDashboardPaymentsDispatchIntent,
} from './ai-dashboard-core.util.js';

export interface CommandSessionOptions {
  history?: Array<{ role: 'user' | 'assistant'; content: string }>;
  context?: Record<string, unknown>;
  confirmed?: boolean;
}

export type DashboardCoreDispatchContext = {
  businessId: string;
  action: string;
  params: Record<string, unknown>;
  effectivePrompt: string;
  userId?: string;
  services: Service[];
  customers: Customer[];
  session?: CommandSessionOptions;
  resolveCustomer: (list: Customer[], name: string) => Customer | undefined;
  isExecutionConfirmed: (session?: CommandSessionOptions) => boolean;
};

export interface DashboardCoreLogicDeps {
  catalog: AiCatalogService;
  payments: AiPaymentsService;
  marketingGrowth: AiMarketingGrowthService;
  notificationSettings: AiNotificationSettingsService;
  whatsappIntegration: AiWhatsappIntegrationService;
  pushNotifications: AiPushNotificationsService;
  integrations: AiIntegrationsService;
  operations: AiOperationsService;
  businessCurrency: AiBusinessCurrencyService;
  businessTax: AiBusinessTaxService;
  businessCompliance: AiBusinessComplianceService;
  businessLanguages: AiBusinessLanguagesService;
  businessDateFormat: AiBusinessDateFormatService;
}

export async function dispatchDashboardCoreIntent(
  deps: DashboardCoreLogicDeps,
  ctx: DashboardCoreDispatchContext,
): Promise<CommandResult | null> {
  const {
    businessId,
    action,
    params,
    effectivePrompt,
    userId,
    services,
    customers,
    session,
    resolveCustomer,
    isExecutionConfirmed,
  } = ctx;

  if (!isDashboardCoreDispatchIntent(action)) {
    return null;
  }

  if (isDashboardPaymentsDispatchIntent(action)) {
    return deps.payments.dispatchIntent({
      businessId,
      action,
      params,
      prompt: effectivePrompt,
      userId,
      catalogServices: services,
    });
  }

  switch (action) {
    case 'create_service_category':
      return deps.catalog.handleCreateServiceCategory(businessId, params);
    case 'bulk_create_catalog':
      return deps.catalog.handleBulkCreateCatalog(
        businessId,
        effectivePrompt,
        params,
      );
    case 'update_service':
      return deps.catalog.handleUpdateService(
        businessId,
        params,
        services,
        effectivePrompt,
      );
    case 'update_service_duration_buffer': {
      const parsedDurationBuffer = parseUpdateServiceDurationBufferFromPrompt(
        effectivePrompt,
        params,
      );
      return deps.catalog.handleUpdateServiceDurationBuffer(
        businessId,
        parsedDurationBuffer
          ? {
              ...params,
              ...(parsedDurationBuffer.durationMinutes !== undefined
                ? { durationMinutes: parsedDurationBuffer.durationMinutes }
                : {}),
              ...(parsedDurationBuffer.bufferMinutes !== undefined
                ? { bufferMinutes: parsedDurationBuffer.bufferMinutes }
                : {}),
              ...(parsedDurationBuffer.allServices
                ? { allServices: true }
                : {}),
              ...(parsedDurationBuffer.serviceName
                ? { serviceName: parsedDurationBuffer.serviceName }
                : {}),
              ...(parsedDurationBuffer.serviceNames
                ? { serviceNames: parsedDurationBuffer.serviceNames }
                : {}),
              ...(parsedDurationBuffer.categoryName
                ? { categoryName: parsedDurationBuffer.categoryName }
                : {}),
            }
          : params,
        services,
        effectivePrompt,
        userId,
      );
    }
    case 'deactivate_service':
      return deps.catalog.handleDeactivateService(
        businessId,
        enrichDeactivateServiceCategoryScopeParamsFromPrompt(
          params,
          effectivePrompt,
        ),
        services,
        effectivePrompt,
      );
    case 'list_packages':
      return deps.catalog.handleListPackages(businessId);
    case 'create_package':
      return deps.catalog.handleCreatePackage(businessId, params, services);
    case 'update_package':
      return deps.catalog.handleUpdatePackage(businessId, params);
    case 'deactivate_package':
      return deps.catalog.handleDeactivatePackage(businessId, params);
    case 'duplicate_package':
      return deps.catalog.handleDuplicatePackage(businessId, params);
    case 'list_subscription_plans':
      return deps.catalog.handleListSubscriptionPlans(
        businessId,
        params,
        services,
      );
    case 'create_subscription_plan':
      return deps.catalog.handleCreateSubscriptionPlan(
        businessId,
        params,
        services,
      );
    case 'update_subscription_plan':
      return deps.catalog.handleUpdateSubscriptionPlan(businessId, params);
    case 'deactivate_subscription_plan':
      return deps.catalog.handleDeactivateSubscriptionPlan(businessId, params);
    case 'assign_subscription_to_customer':
      return deps.catalog.handleAssignSubscription(
        businessId,
        params,
        services,
        customers,
        resolveCustomer,
      );
    case 'configure_gift_card_products':
      return deps.catalog.handleConfigureGiftCardProducts(
        businessId,
        params,
        services,
      );
    case 'create_gift_card_bundle':
      return deps.catalog.handleCreateGiftCardBundle(
        businessId,
        params,
        services,
      );
    case 'configure_multi_service_settings':
      return deps.catalog.handleConfigureMultiServiceSettings(
        businessId,
        params,
      );
    case 'configure_service_featured':
      return deps.catalog.handleConfigureServiceFeatured(
        businessId,
        params,
        services,
        effectivePrompt,
        userId,
      );
    case 'bulk_assign_services_category':
      return deps.catalog.handleBulkAssignServicesCategory(
        businessId,
        params,
        services,
        effectivePrompt,
        userId,
      );
    case 'configure_package_online_payment':
      return deps.catalog.handleConfigurePackageOnlinePayment(
        businessId,
        params,
        services,
        effectivePrompt,
        userId,
      );
    case 'set_service_compatibility':
      return deps.catalog.handleSetServiceCompatibility(
        businessId,
        params,
        services,
      );
    case 'configure_marketing_automation':
      return deps.marketingGrowth.handleConfigureMarketingAutomation(
        businessId,
        params,
        effectivePrompt,
      );
    case 'configure_stripe_connect':
      return deps.marketingGrowth.handleConfigureStripeConnect(
        businessId,
        params,
        effectivePrompt,
      );
    case 'configure_loyalty_settings':
      return deps.marketingGrowth.handleConfigureLoyaltySettings(
        businessId,
        params,
        effectivePrompt,
      );
    case 'configure_push_recipients':
      return deps.pushNotifications.handleConfigurePushRecipients(
        businessId,
        params,
        effectivePrompt,
      );
    case 'configure_notification_settings':
      return deps.notificationSettings.handleConfigureNotificationSettings(
        businessId,
        params,
        effectivePrompt,
      );
    case 'configure_whatsapp_integration':
      return deps.whatsappIntegration.handleConfigureWhatsappIntegration(
        businessId,
        params,
        effectivePrompt,
      );
    case 'configure_marketing_registration_email':
      return deps.integrations.handleConfigureMarketingRegistrationEmail(
        businessId,
        params,
        effectivePrompt,
      );
    case 'configure_online_booking':
      return deps.operations.handleConfigureOnlineBooking(
        businessId,
        params,
        effectivePrompt,
      );
    case 'configure_business_currency': {
      const currencyCode =
        parseCurrencyFromPrompt(effectivePrompt, params) ??
        (params.currencyCode as string | undefined);
      return deps.businessCurrency.handleConfigureBusinessCurrency(
        businessId,
        { ...params, currencyCode },
        effectivePrompt,
      );
    }
    case 'configure_business_tax': {
      const parsedTax = parseBusinessTaxFromPrompt(effectivePrompt, params);
      return deps.businessTax.handleConfigureBusinessTax(
        businessId,
        parsedTax
          ? { ...params, ...parsedTax, _prompt: effectivePrompt }
          : params,
        effectivePrompt,
      );
    }
    case 'configure_privacy_retention': {
      const parsedPrivacy = parseConfigurePrivacyRetentionFromPrompt(
        effectivePrompt,
        params,
      );
      return deps.businessCompliance.handleConfigurePrivacyRetention(
        businessId,
        parsedPrivacy
          ? { ...params, ...parsedPrivacy, _prompt: effectivePrompt }
          : params,
        effectivePrompt,
      );
    }
    case 'configure_granular_consent': {
      const parsedConsent = parseConfigureGranularConsentFromPrompt(
        effectivePrompt,
        params,
      );
      return deps.businessCompliance.handleConfigureGranularConsent(
        businessId,
        parsedConsent
          ? { ...params, ...parsedConsent, _prompt: effectivePrompt }
          : params,
        effectivePrompt,
      );
    }
    case 'enable_hipaa_mode': {
      const parsedHipaa = parseEnableHipaaModeFromPrompt(
        effectivePrompt,
        params,
      );
      return deps.businessCompliance.handleEnableHipaaMode(
        businessId,
        parsedHipaa
          ? { ...params, ...parsedHipaa, _prompt: effectivePrompt }
          : params,
        effectivePrompt,
      );
    }
    case 'configure_hipaa_session_timeout': {
      const parsedHipaaTimeout = parseConfigureHipaaSessionTimeoutFromPrompt(
        effectivePrompt,
        params,
      );
      return deps.businessCompliance.handleConfigureHipaaSessionTimeout(
        businessId,
        parsedHipaaTimeout
          ? {
              ...params,
              ...parsedHipaaTimeout,
              _prompt: effectivePrompt,
            }
          : params,
        effectivePrompt,
      );
    }
    case 'set_service_tax_rate': {
      const parsedServiceTax = parseSetServiceTaxRateFromPrompt(
        effectivePrompt,
        params,
      );
      return deps.businessTax.handleSetServiceTaxRate(
        businessId,
        parsedServiceTax
          ? { ...params, ...parsedServiceTax, _prompt: effectivePrompt }
          : params,
        effectivePrompt,
        isExecutionConfirmed(session),
      );
    }
    case 'configure_stacked_tax_rules': {
      const parsedStackedTax = parseConfigureStackedTaxRulesFromPrompt(
        effectivePrompt,
        params,
      );
      return deps.businessTax.handleConfigureStackedTaxRules(
        businessId,
        parsedStackedTax
          ? { ...params, ...parsedStackedTax, _prompt: effectivePrompt }
          : params,
        effectivePrompt,
      );
    }
    case 'bulk_strip_disabled_locale_translations':
      return deps.businessLanguages.handleBulkStripDisabledLocaleTranslations(
        businessId,
        { ...params, _prompt: effectivePrompt },
        effectivePrompt,
        isExecutionConfirmed(session),
      );
    case 'configure_business_languages': {
      const parsedLanguages = parseBusinessLanguagesFromPrompt(
        effectivePrompt,
        params,
      );
      return deps.businessLanguages.handleConfigureBusinessLanguages(
        businessId,
        parsedLanguages
          ? {
              ...params,
              operation: parsedLanguages.operation,
              locales: parsedLanguages.locales,
              defaultLocale:
                parsedLanguages.operation === 'set_default'
                  ? parsedLanguages.locales[0]
                  : params.defaultLocale,
            }
          : params,
        effectivePrompt,
      );
    }
    case 'migrate_dashboard_date_display':
      return deps.businessDateFormat.handleMigrateDashboardDateDisplay(
        businessId,
        { ...params, _prompt: effectivePrompt },
        effectivePrompt,
        isExecutionConfirmed(session),
      );
    case 'configure_business_date_format': {
      const parsedDateFormat = parseBusinessDateFormatFromPrompt(
        effectivePrompt,
        params,
      );
      return deps.businessDateFormat.handleConfigureBusinessDateFormat(
        businessId,
        parsedDateFormat
          ? {
              ...params,
              ...(parsedDateFormat.dateFormat
                ? { dateFormat: parsedDateFormat.dateFormat }
                : {}),
              ...(parsedDateFormat.timeFormat
                ? { timeFormat: parsedDateFormat.timeFormat }
                : {}),
            }
          : params,
        effectivePrompt,
      );
    }
    default:
      return null;
  }
}
