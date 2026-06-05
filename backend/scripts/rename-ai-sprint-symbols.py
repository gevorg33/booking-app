#!/usr/bin/env python3
"""Update imports and symbols after ai-sprint* file renames."""
from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
BACKEND = ROOT / "backend"

# Order matters: longest keys first
PATH_REPLACEMENTS = [
    ("ai-sprint37-provider-booking", "ai-provider-booking"),
    ("ai-sprint36-customer-booking", "ai-self-service-booking"),
    ("ai-sprint35-push-notifications", "ai-push-notifications"),
    ("ai-sprint34-marketing-growth", "ai-marketing-growth"),
    ("ai-sprint33-retail-finance", "ai-retail-finance"),
    ("ai-sprint32-integrations", "ai-integrations"),
    ("ai-sprint31-gift-fulfillment", "ai-gift-fulfillment"),
    ("ai-sprint30-payments", "ai-payments"),
    ("ai-sprint29-schedule-resources", "ai-schedule-resources"),
    ("ai-sprint28-customer-crm", "ai-customer-crm"),
    ("ai-sprint27-catalog", "ai-catalog"),
    ("ai-sprint26-booking", "ai-booking-depth"),
    ("ai-sprint25-plan", "ai-platform-plan"),
    ("ai-sprint25", "ai-platform"),
    ("ai-sprint24-plan", "ai-operations-plan"),
    ("ai-sprint24-command-completion", "ai-operations-command-completion"),
    ("ai-sprint24", "ai-operations"),
    ("ai-sprint23-plan", "ai-scheduling-plan"),
    ("ai-sprint23-command-completion", "ai-scheduling-command-completion"),
    ("ai-sprint23", "ai-scheduling"),
    ("ai-sprint18-customer-metrics", "ai-customer-metrics"),
]

SYMBOL_REPLACEMENTS = [
    # Classes (longest first)
    ("AiSprint37ProviderBookingService", "AiProviderBookingService"),
    ("AiSprint36CustomerBookingService", "AiSelfServiceBookingService"),
    ("AiSprint35PushNotificationsService", "AiPushNotificationsService"),
    ("AiSprint34MarketingGrowthService", "AiMarketingGrowthService"),
    ("AiSprint33RetailFinanceService", "AiRetailFinanceService"),
    ("AiSprint32IntegrationsService", "AiIntegrationsService"),
    ("AiSprint31GiftFulfillmentService", "AiGiftFulfillmentService"),
    ("AiSprint30PaymentsService", "AiPaymentsService"),
    ("AiSprint29ScheduleResourcesService", "AiScheduleResourcesService"),
    ("AiSprint28CustomerCrmService", "AiCustomerCrmService"),
    ("AiSprint27CatalogService", "AiCatalogService"),
    ("AiSprint26BookingService", "AiBookingDepthService"),
    ("AiSprint25Scheduler", "AiPlatformScheduler"),
    ("AiSprint25Service", "AiPlatformService"),
    ("AiSprint24Service", "AiOperationsService"),
    ("AiSprint23Service", "AiSchedulingService"),
    # Types / intents (37 down to 23)
    ("SPRINT37_PROVIDER_BOOKING_INTENTS", "PROVIDER_BOOKING_INTENTS"),
    ("Sprint37ProviderBookingIntent", "ProviderBookingIntent"),
    ("isSprint37ProviderBookingIntent", "isProviderBookingIntent"),
    ("rescueSprint37ProviderBookingIntent", "rescueProviderBookingIntent"),
    ("tryRescueSprint37ProviderBooking", "tryRescueProviderBooking"),
    ("Sprint37ProviderBookingLogicDeps", "ProviderBookingLogicDeps"),
    ("SPRINT36_CUSTOMER_BOOKING_INTENTS", "SELF_SERVICE_BOOKING_INTENTS"),
    ("Sprint36CustomerBookingIntent", "SelfServiceBookingIntent"),
    ("isSprint36CustomerBookingIntent", "isSelfServiceBookingIntent"),
    ("rescueSprint36CustomerBookingIntent", "rescueSelfServiceBookingIntent"),
    ("tryRescueSprint36CustomerBooking", "tryRescueSelfServiceBooking"),
    ("Sprint36CustomerBookingLogicDeps", "SelfServiceBookingLogicDeps"),
    ("SPRINT35_PUSH_NOTIFICATIONS_INTENTS", "PUSH_NOTIFICATIONS_INTENTS"),
    ("Sprint35PushNotificationsIntent", "PushNotificationsIntent"),
    ("isSprint35PushNotificationsIntent", "isPushNotificationsIntent"),
    ("rescueSprint35PushNotificationsIntent", "rescuePushNotificationsIntent"),
    ("tryRescueSprint35PushNotifications", "tryRescuePushNotifications"),
    ("Sprint35PushNotificationsLogicDeps", "PushNotificationsLogicDeps"),
    ("SPRINT34_MARKETING_GROWTH_INTENTS", "MARKETING_GROWTH_INTENTS"),
    ("Sprint34MarketingGrowthIntent", "MarketingGrowthIntent"),
    ("isSprint34MarketingGrowthIntent", "isMarketingGrowthIntent"),
    ("rescueSprint34MarketingGrowthIntent", "rescueMarketingGrowthIntent"),
    ("tryRescueSprint34MarketingGrowth", "tryRescueMarketingGrowth"),
    ("Sprint34MarketingGrowthLogicDeps", "MarketingGrowthLogicDeps"),
    ("SPRINT33_RETAIL_FINANCE_INTENTS", "RETAIL_FINANCE_INTENTS"),
    ("Sprint33RetailFinanceIntent", "RetailFinanceIntent"),
    ("isSprint33RetailFinanceIntent", "isRetailFinanceIntent"),
    ("rescueSprint33RetailFinanceIntent", "rescueRetailFinanceIntent"),
    ("tryRescueSprint33RetailFinance", "tryRescueRetailFinance"),
    ("Sprint33RetailFinanceLogicDeps", "RetailFinanceLogicDeps"),
    ("SPRINT32_INTEGRATIONS_INTENTS", "INTEGRATIONS_INTENTS"),
    ("Sprint32IntegrationsIntent", "IntegrationsIntent"),
    ("isSprint32IntegrationsIntent", "isIntegrationsIntent"),
    ("rescueSprint32IntegrationsIntent", "rescueIntegrationsIntent"),
    ("tryRescueSprint32Integrations", "tryRescueIntegrations"),
    ("Sprint32IntegrationsLogicDeps", "IntegrationsLogicDeps"),
    ("SPRINT31_FULFILLMENT_INTENTS", "GIFT_FULFILLMENT_INTENTS"),
    ("Sprint31FulfillmentIntent", "GiftFulfillmentIntent"),
    ("isSprint31FulfillmentIntent", "isGiftFulfillmentIntent"),
    ("rescueSprint31FulfillmentIntent", "rescueGiftFulfillmentIntent"),
    ("tryRescueSprint31Fulfillment", "tryRescueGiftFulfillment"),
    ("Sprint31FulfillmentLogicDeps", "GiftFulfillmentLogicDeps"),
    ("SPRINT30_PAYMENTS_INTENTS", "PAYMENTS_INTENTS"),
    ("Sprint30PaymentsIntent", "PaymentsIntent"),
    ("isSprint30PaymentsIntent", "isPaymentsIntent"),
    ("rescueSprint30PaymentsIntent", "rescuePaymentsIntent"),
    ("tryRescueSprint30Payments", "tryRescuePayments"),
    ("Sprint30PaymentsLogicDeps", "PaymentsLogicDeps"),
    ("SPRINT29_SCHEDULE_RESOURCE_INTENTS", "SCHEDULE_RESOURCE_INTENTS"),
    ("Sprint29ScheduleResourceIntent", "ScheduleResourceIntent"),
    ("isSprint29ScheduleResourceIntent", "isScheduleResourceIntent"),
    ("rescueSprint29ScheduleResourceIntent", "rescueScheduleResourceIntent"),
    ("tryRescueSprint29ScheduleResources", "tryRescueScheduleResources"),
    ("Sprint29ScheduleResourcesLogicDeps", "ScheduleResourcesLogicDeps"),
    ("SPRINT28_CUSTOMER_CRM_INTENTS", "CUSTOMER_CRM_INTENTS"),
    ("Sprint28CustomerCrmIntent", "CustomerCrmIntent"),
    ("isSprint28CustomerCrmIntent", "isCustomerCrmIntent"),
    ("rescueSprint28CustomerCrmIntent", "rescueCustomerCrmIntent"),
    ("tryRescueSprint28CustomerCrm", "tryRescueCustomerCrm"),
    ("Sprint28CustomerCrmLogicDeps", "CustomerCrmLogicDeps"),
    ("SPRINT27_CATALOG_INTENTS", "CATALOG_INTENTS"),
    ("Sprint27CatalogIntent", "CatalogIntent"),
    ("isSprint27CatalogIntent", "isCatalogIntent"),
    ("rescueSprint27CatalogIntent", "rescueCatalogIntent"),
    ("tryRescueSprint27Catalog", "tryRescueCatalog"),
    ("Sprint27CatalogLogicDeps", "CatalogLogicDeps"),
    ("SPRINT26_BOOKING_INTENTS", "BOOKING_DEPTH_INTENTS"),
    ("Sprint26BookingIntent", "BookingDepthIntent"),
    ("isSprint26BookingIntent", "isBookingDepthIntent"),
    ("rescueSprint26BookingIntent", "rescueBookingDepthIntent"),
    ("tryRescueSprint26Booking", "tryRescueBookingDepth"),
    ("Sprint26BookingLogicDeps", "BookingDepthLogicDeps"),
    ("SPRINT25_", "PLATFORM_"),
    ("Sprint25", "Platform"),
    ("sprint25", "platform"),
    ("SPRINT24_", "OPERATIONS_"),
    ("Sprint24", "Operations"),
    ("sprint24", "operations"),
    ("SPRINT23_SCHEDULING_INTENTS", "SCHEDULING_INTENTS"),
    ("Sprint23SchedulingIntent", "SchedulingIntent"),
    ("rescueSprint23Intent", "rescueSchedulingIntent"),
    ("tryRescueSprint23", "tryRescueScheduling"),
    ("mapSprint23OrchestrationResult", "mapSchedulingOrchestrationResult"),
    ("Sprint23LogicDeps", "SchedulingLogicDeps"),
    ("mapSprint24OrchestrationResult", "mapOperationsOrchestrationResult"),
    ("shouldAutoExecuteSprint24", "shouldAutoExecuteOperations"),
    ("createAiGatewaySprint25Mocks", "createAiGatewayPlatformMocks"),
    ("ai-sprint25.integration", "ai-platform.service.integration"),
    ("ai-gateway-sprint22", "ai-gateway-platform"),
    ("ai-settings-sprint22", "ai-settings-platform"),
    # package.json test script names
    ("test:sprint37", "test:ai-provider-booking"),
    ("test:sprint36", "test:ai-self-service-booking"),
    ("test:sprint35", "test:ai-push-notifications"),
    ("test:sprint34", "test:ai-marketing-growth"),
    ("test:sprint33", "test:ai-retail-finance"),
    ("test:sprint32", "test:ai-integrations"),
    ("test:sprint31", "test:ai-gift-fulfillment"),
    ("test:sprint30", "test:ai-payments"),
    ("test:sprint29", "test:ai-schedule-resources"),
    ("test:sprint28", "test:ai-customer-crm"),
    ("test:sprint27", "test:ai-catalog"),
    ("test:sprint26", "test:ai-booking-depth"),
    ("test:sprint25", "test:ai-platform"),
    ("test:sprint24", "test:ai-operations"),
    ("test:sprint23", "test:ai-scheduling"),
    ("test:sprint18", "test:ai-customer-metrics"),
    # variable names in tests
    ("sprint37", "providerBooking"),
    ("sprint36", "selfServiceBooking"),
    ("sprint35", "pushNotifications"),
    ("sprint34", "marketingGrowth"),
    ("sprint33", "retailFinance"),
    ("sprint32", "integrations"),
    ("sprint31", "giftFulfillment"),
    ("sprint30", "payments"),
    ("sprint29", "scheduleResources"),
    ("sprint28", "customerCrm"),
    ("sprint27", "catalog"),
    ("sprint26", "bookingDepth"),
    # Remaining SPRINT{N}_ intent constant prefixes (longest / specific first)
    ("SPRINT37_PROVIDER_BOOKING_", "PROVIDER_BOOKING_"),
    ("SPRINT36_CUSTOMER_BOOKING_", "SELF_SERVICE_BOOKING_"),
    ("SPRINT26_BOOKING_", "BOOKING_DEPTH_"),
    ("SPRINT27_CATALOG_", "CATALOG_"),
    ("SPRINT28_DASHBOARD_CRM_", "DASHBOARD_CRM_"),
    ("SPRINT28_CUSTOMER_ACCOUNT_", "CUSTOMER_ACCOUNT_"),
    ("SPRINT28_DISCOVERY_", "DISCOVERY_"),
    ("SPRINT29_DASHBOARD_RESOURCE_", "DASHBOARD_RESOURCE_"),
    ("SPRINT29_PROVIDER_RESOURCE_", "PROVIDER_RESOURCE_"),
    ("SPRINT29_CUSTOMER_AVAILABILITY_", "CUSTOMER_AVAILABILITY_"),
    ("SPRINT30_DASHBOARD_PAYMENTS_", "DASHBOARD_PAYMENTS_"),
    ("SPRINT30_PROVIDER_PAYMENTS_", "PROVIDER_PAYMENTS_"),
    ("SPRINT30_CUSTOMER_PAYMENTS_", "CUSTOMER_PAYMENTS_"),
    ("SPRINT31_DASHBOARD_FULFILLMENT_", "DASHBOARD_GIFT_FULFILLMENT_"),
    ("SPRINT31_PROVIDER_FULFILLMENT_", "PROVIDER_GIFT_FULFILLMENT_"),
    ("SPRINT31_CUSTOMER_FULFILLMENT_", "CUSTOMER_GIFT_FULFILLMENT_"),
    ("SPRINT32_DASHBOARD_INTEGRATIONS_", "DASHBOARD_INTEGRATIONS_"),
    ("SPRINT32_CUSTOMER_INTEGRATIONS_", "CUSTOMER_INTEGRATIONS_"),
    ("SPRINT33_DASHBOARD_RETAIL_FINANCE_", "DASHBOARD_RETAIL_FINANCE_"),
    ("SPRINT33_PROVIDER_RETAIL_FINANCE_", "PROVIDER_RETAIL_FINANCE_"),
    ("SPRINT34_DASHBOARD_MARKETING_GROWTH_", "DASHBOARD_MARKETING_GROWTH_"),
    ("SPRINT34_CUSTOMER_MARKETING_GROWTH_", "CUSTOMER_MARKETING_GROWTH_"),
    ("SPRINT35_DASHBOARD_PUSH_NOTIFICATIONS_", "DASHBOARD_PUSH_NOTIFICATIONS_"),
    ("SPRINT35_PROVIDER_PUSH_NOTIFICATIONS_", "PROVIDER_PUSH_NOTIFICATIONS_"),
    ("SPRINT35_CUSTOMER_PUSH_NOTIFICATIONS_", "CUSTOMER_PUSH_NOTIFICATIONS_"),
    # Scheduling service injection + rescue metadata
    ("sprint23_scheduling", "scheduling_intent"),
    ("sprint: 'sprint23'", "sprint: 'scheduling'"),
    ("private sprint23:", "private scheduling:"),
    ("this.sprint23.", "this.scheduling."),
    ("const sprint23Unknown", "const schedulingUnknown"),
    ("const sprint23 =", "const scheduling ="),
    ("sprint23 as any", "scheduling as any"),
]

SKIP_DIRS = {"node_modules", "dist", ".git"}


def should_process(path: Path) -> bool:
    if any(part in SKIP_DIRS for part in path.parts):
        return False
    if path.suffix not in {".ts", ".tsx", ".js", ".json", ".md"}:
        return False
    if "rename-ai-sprint" in path.name:
        return False
    return path.is_relative_to(BACKEND)


def apply_replacements(content: str) -> str:
    for old, new in PATH_REPLACEMENTS:
        content = content.replace(old, new)
    for old, new in SYMBOL_REPLACEMENTS:
        content = content.replace(old, new)
    return content


def main() -> None:
    changed = 0
    for path in BACKEND.rglob("*"):
        if not should_process(path) or not path.is_file():
            continue
        text = path.read_text(encoding="utf-8")
        updated = apply_replacements(text)
        if updated != text:
            path.write_text(updated, encoding="utf-8")
            changed += 1
    print(f"Updated {changed} files")


if __name__ == "__main__":
    main()
