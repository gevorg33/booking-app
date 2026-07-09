import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AiCommandService } from './ai-command.service.js';
import { AiCommandController } from './ai-command.controller.js';
import { CommandOrchestrationService } from './command-orchestration.service.js';
import { OperationalPlanBuilderService } from './operational-plan-builder.service.js';
import { AiScheduleHandlersService } from './ai-schedule-handlers.service.js';
import { AiSchedulingService } from './ai-scheduling.service.js';
import { AiOperationsService } from './ai-operations.service.js';
import { AiBusinessCurrencyService } from './ai-business-currency.service.js';
import { AiBusinessLanguagesService } from './ai-business-languages.service.js';
import { AiReferralStaffTemplatesService } from './ai-referral-staff-templates.service.js';
import { AiExternalDoctorsService } from './ai-external-doctors.service.js';
import { AiBusinessDateFormatService } from './ai-business-date-format.service.js';
import { AiBusinessHoursLocationService } from './ai-explain-business-hours-and-location.service.js';
import { AiProviderSpecialtyService } from './ai-explain-provider-specialty.service.js';
import { AiBusinessTaxService } from './ai-business-tax.service.js';
import { AiBusinessComplianceService } from './ai-business-compliance.service.js';
import { AiClinicTestOrderService } from './ai-clinic-test-order.service.js';
import { AiClinicTestResultService } from './ai-clinic-test-result.service.js';
import { AiClinicTestCatalogService } from './ai-clinic-test-catalog.service.js';
import { AiClinicPatientChartService } from './ai-clinic-patient-chart.service.js';
import { AiPatientClinicalMutationsService } from './ai-patient-clinical-mutations.service.js';
import { AiClinicQuestionnaireService } from './ai-clinic-questionnaire.service.js';
import { AiLocationsService } from './ai-locations.service.js';
import { AiProductGuideService } from './ai-product-guide.service.js';
import { AiProductGuideEmptyStateService } from './ai-product-guide-empty-state.service.js';
import { AiConsumerClinicTestResultsService } from './ai-consumer-clinic-test-results.service.js';
import { AiProviderClinicTasksAndResultsService } from './ai-provider-clinic-tasks-and-results.service.js';
import { AiPackageLocalizedNamesService } from './ai-package-localized-names.service.js';
import { AiTourServiceService } from './ai-tour-service.service.js';
import { AiRecommendationProductService } from './ai-recommendation-product.service.js';
import { AiPlatformService } from './ai-platform.service.js';
import { AiPlatformScheduler } from './ai-platform.scheduler.js';
import { AiBookingDepthService } from './ai-booking-depth.service.js';
import { AiCatalogService } from './ai-catalog.service.js';
import { AiDashboardCoreService } from './ai-dashboard-core.service.js';
import { AiCustomerCrmService } from './ai-customer-crm.service.js';
import { AiScheduleResourcesService } from './ai-schedule-resources.service.js';
import { AiAgentOpsService } from './ai-agent-ops.service.js';
import { AiBusinessProfileService } from './ai-business-profile.service.js';
import { AiOnboardingService } from './ai-onboarding.service.js';
import { AiClinicPreVisitIntakeService } from './ai-clinic-pre-visit-intake.service.js';
import { AiPaymentsService } from './ai-payments.service.js';
import { AiGiftFulfillmentService } from './ai-gift-fulfillment.service.js';
import { AiIntegrationsService } from './ai-integrations.service.js';
import { AiRetailFinanceService } from './ai-retail-finance.service.js';
import { AiMarketingGrowthService } from './ai-marketing-growth.service.js';
import { AiPushNotificationsService } from './ai-push-notifications.service.js';
import { AiNotificationSettingsService } from './ai-notification-settings.service.js';
import { AiWhatsappIntegrationService } from './ai-whatsapp-integration.service.js';
import { AiOpenaiIntegrationService } from './ai-openai-integration.service.js';
import { AiSelfServiceBookingService } from './ai-self-service-booking.service.js';
import { AiProviderBookingService } from './ai-provider-booking.service.js';
import { AiProviderClinicCollectionService } from './ai-provider-clinic-collection.service.js';
import { AiClinicLabBookingService } from './ai-clinic-lab-booking.service.js';
import { AiClinicBookingService } from './ai-clinic-booking.service.js';
import { AiGuestCheckoutFieldsService } from './ai-explain-guest-checkout-fields.service.js';
import { AiResumePendingPaymentService } from './ai-resume-pending-payment.service.js';
import { AiDiagnoseStripeCheckoutFailureService } from './ai-diagnose-stripe-checkout-failure.service.js';
import { AiPayAtVenueFallbackService } from './ai-pay-at-venue-fallback.service.js';
import { AiResumeBookingDraftService } from './ai-resume-booking-draft.service.js';
import { AiExplainSlotNoLongerAvailableService } from './ai-explain-slot-no-longer-available.service.js';
import { AiExplainMultiServicePaymentReturnService } from './ai-explain-multi-service-payment-return.service.js';
import { AiRetryFailedNetworkActionService } from './ai-retry-failed-network-action.service.js';
import { AiExplainVoiceInputService } from './ai-explain-voice-input.service.js';
import { AiSpeakAssistantReplyService } from './ai-speak-assistant-reply.service.js';
import { AiGiveAiFeedbackService } from './ai-give-ai-feedback.service.js';
import { AiExplainRtlLayoutService } from './ai-explain-rtl-layout.service.js';
import { AiConsumerAdoptionService } from './ai-consumer-adoption.service.js';
import { AiProviderPushSetupService } from './ai-provider-push-setup.service.js';
import { AiProviderEarningsService } from './ai-provider-earnings.service.js';
import { AiProviderClientContextService } from './ai-provider-client-context.service.js';
import { AiProviderExp2Service } from './ai-provider-exp-2.service.js';
import { AiProviderTimeOffService } from './ai-provider-time-off.service.js';
import { AiProviderOpenShiftsService } from './ai-provider-open-shifts.service.js';
import { AiProviderExp3Service } from './ai-provider-exp-3.service.js';
import { AiClinicServiceService } from './ai-clinic-service.service.js';
import { PublicBookingModule } from '../public-booking/public-booking.module.js';
import { ServiceModule } from '../service/service.module.js';
import { OnboardingModule } from '../onboarding/onboarding.module.js';
import { ClinicPreVisitIntakesModule } from '../clinic-pre-visit-intakes/clinic-pre-visit-intakes.module.js';
import { ClinicQuestionnairesModule } from '../clinic-questionnaires/clinic-questionnaires.module.js';
import { LocationsModule } from '../locations/locations.module.js';
import { GiftCardsModule } from '../gift-cards/gift-cards.module.js';
import { ZendeskModule } from '../integrations/zendesk/zendesk.module.js';
import { GiftCard } from '../gift-cards/entities/gift-card.entity.js';
import { GiftCardChangeRequest } from '../gift-cards/entities/gift-card-change-request.entity.js';
import { CustomerSubscription } from '../service-subscriptions/entities/subscription.entity.js';
import { AgentTask } from '../../engine/agent/agent-task.entity.js';
import { AiSuggestionsService } from './ai-suggestions.service.js';
import { CommandCompletionPipelineService } from './command-completion.pipeline.service.js';
import { Booking } from '../booking/entities/booking.entity.js';
import { BookingCheckoutDraft } from '../booking/entities/booking-checkout-draft.entity.js';
import { Employee } from '../employee/entities/employee.entity.js';
import { Service } from '../service/entities/service.entity.js';
import { ServiceCategory } from '../service/entities/service-category.entity.js';
import { Customer } from '../customer/entities/customer.entity.js';
import { SchedulingPeriod } from '../schedule/entities/scheduling-period.entity.js';
import { SchedulingSlot } from '../schedule/entities/scheduling-slot.entity.js';
import { ScheduleTemplate } from '../schedule/entities/schedule-template.entity.js';
import { BlockSchedule } from '../schedule/entities/block-schedule.entity.js';
import { Business } from '../business/entities/business.entity.js';
import { ServicePackage } from '../service-packages/entities/service-package.entity.js';
import { BookingModule } from '../booking/booking.module.js';
import { EmployeeModule } from '../employee/employee.module.js';
import { ScheduleModule } from '../schedule/schedule.module.js';
import { InvitationsModule } from '../invitations/invitations.module.js';
import { AgentModule } from '../../engine/agent/agent.module.js';
import { SchedulingEngineModule } from '../../engine/scheduling/scheduling-engine.module.js';
import { WebSocketModule } from '../../websocket/websocket.module.js';
import { AiEventsService } from './ai-events.service.js';
import { IntentDecompositionService } from './intent-decomposition.service.js';
import { AiSettingsService } from './ai-settings.service.js';
import { AiBriefingService } from './ai-briefing.service.js';
import { AiAuditService } from './ai-audit.service.js';
import { AiAutopilotScheduler } from './ai-autopilot.scheduler.js';
import { OpenAiModule } from '../integrations/openai/openai.module.js';
import { EventStoreModule } from '../../events/store/event-store.module.js';
import { CustomerModule } from '../customer/customer.module.js';
import { LangGraphModule } from '../../engine/langgraph/langgraph.module.js';
import { BookingCommandGraphService } from './booking-command-graph.service.js';
import { CompoundCommandGraphService } from './compound-command-graph.service.js';
import { CommandReasoningService } from './command-reasoning.service.js';
import { ReactResultCompilerService } from './react-result-compiler.service.js';
import { AiGatewayService } from './ai-gateway.service.js';
import { CustomerAiCommandService } from './customer-ai-command.service.js';
import { AiEntityMemoryService } from './ai-entity-memory.service.js';
import { AiConversationSummaryService } from './ai-conversation-summary.service.js';
import { AiRagService } from './ai-rag.service.js';
import { AiIntelligenceService } from './ai-intelligence.service.js';
import { AiWeeklyReportService } from './ai-weekly-report.service.js';
import { CommandComplexityRouterService } from './command-complexity-router.service.js';
import { AiIntentRescueService } from './ai-intent-rescue.service.js';
import { AiCommandRegistryService } from './ai-command-registry.service.js';
import { AiCommandEntityParamsService } from './ai-command-entity-params.service.js';
import { AiPromptSecurityService } from './ai-prompt-security.service.js';
import { AiPromptNormalizationService } from './ai-prompt-normalization.service.js';
import { AiSemanticIntentService } from './ai-semantic-intent.service.js';
import { CommandUnderstandingPipelineService } from './command-understanding-pipeline.service.js';
import { DashboardCommandUnderstandingAdapter } from './dashboard-command-understanding.adapter.js';
import { ProviderCommandUnderstandingAdapter } from './provider-command-understanding.adapter.js';
import { CustomerCommandUnderstandingAdapter } from './customer-command-understanding.adapter.js';
import { PublicCommandUnderstandingAdapter } from './public-command-understanding.adapter.js';
import { FastIntentHeuristicsService } from './fast-intent-heuristics.service.js';
import { ProviderMobileModule } from '../provider-mobile/provider-mobile.module.js';
import { PlanEntitlementsModule } from '../billing/plan-entitlements.module.js';
import { ServiceSubscriptionsModule } from '../service-subscriptions/service-subscriptions.module.js';
import { ServicePackagesModule } from '../service-packages/service-packages.module.js';
import { MultiServiceBookingsModule } from '../multi-service-bookings/multi-service-bookings.module.js';
import { ResourcesModule } from '../resources/resources.module.js';
import { SchedulingResource } from '../resources/entities/scheduling-resource.entity.js';
import { IntegrationsModule } from '../integrations/integrations.module.js';
import { CommissionsModule } from '../commissions/commissions.module.js';
import { InventoryModule } from '../inventory/inventory.module.js';
import { RetailPosModule } from '../retail-pos/retail-pos.module.js';
import { ExpensesModule } from '../expenses/expenses.module.js';
import { AnalyticsModule } from '../analytics/analytics.module.js';
import { BusinessModule } from '../business/business.module.js';
import {
  CategoryRecommendedProduct,
  Product,
  ServiceRecommendedProduct,
} from '../inventory/entities/inventory.entity.js';
import { MarketingAutomationModule } from '../marketing-automation/marketing-automation.module.js';
import { BillingModule } from '../billing/billing.module.js';
import { LoyaltyModule } from '../loyalty/loyalty.module.js';
import { PromoCodesModule } from '../promo-codes/promo-codes.module.js';
import { NotificationsModule } from '../notifications/notifications.module.js';
import { NotificationLog } from '../notifications/entities/notification-log.entity.js';
import { ClinicTestResult } from '../clinic-test-results/entities/clinic-test-result.entity.js';
import { ClinicTestOrder } from '../clinic-test-results/entities/clinic-test-order.entity.js';
import { ClinicTestType } from '../clinic-test-results/entities/clinic-test-type.entity.js';
import { ClinicTestPanel } from '../clinic-test-results/entities/clinic-test-panel.entity.js';
import { ClinicTestResultsModule } from '../clinic-test-results/clinic-test-results.module.js';
import { PatientClinicalProfilesModule } from '../patient-clinical-profiles/patient-clinical-profiles.module.js';
import { ComplianceModule } from '../compliance/compliance.module.js';
import { ReviewsModule } from '../reviews/reviews.module.js';
import { EnterpriseTrustModule } from '../enterprise-trust/enterprise-trust.module.js';
import { StrategyEvalModule } from '../strategy-eval/strategy-eval.module.js';
import { ExternalDoctorsModule } from '../external-doctors/external-doctors.module.js';
import { AiCommandTrace } from './entities/ai-command-trace.entity.js';
import { AiCommandTraceService } from './ai-command-trace.service.js';
import { AiGuideTelemetry } from './entities/ai-guide-telemetry.entity.js';
import { GuideTelemetryService } from './guide-telemetry.service.js';

@Module({
  imports: [
    PlanEntitlementsModule,
    TypeOrmModule.forFeature([
      Booking,
      BookingCheckoutDraft,
      Employee,
      Service,
      ServiceCategory,
      Customer,
      SchedulingPeriod,
      SchedulingSlot,
      ScheduleTemplate,
      BlockSchedule,
      Business,
      ServicePackage,
      CustomerSubscription,
      GiftCard,
      GiftCardChangeRequest,
      SchedulingResource,
      AgentTask,
      Product,
      ServiceRecommendedProduct,
      CategoryRecommendedProduct,
      NotificationLog,
      ClinicTestResult,
      ClinicTestOrder,
      ClinicTestType,
      ClinicTestPanel,
      AiCommandTrace,
      AiGuideTelemetry,
    ]),
    forwardRef(() => BookingModule),
    EmployeeModule,
    ScheduleModule,
    InvitationsModule,
    forwardRef(() => AgentModule),
    SchedulingEngineModule,
    OpenAiModule,
    WebSocketModule,
    EventStoreModule,
    CustomerModule,
    forwardRef(() => LangGraphModule),
    forwardRef(() => ProviderMobileModule),
    ServiceSubscriptionsModule,
    ServicePackagesModule,
    MultiServiceBookingsModule,
    ResourcesModule,
    IntegrationsModule,
    CommissionsModule,
    InventoryModule,
    RetailPosModule,
    ExpensesModule,
    AnalyticsModule,
    BusinessModule,
    MarketingAutomationModule,
    BillingModule,
    LoyaltyModule,
    forwardRef(() => PromoCodesModule),
    NotificationsModule,
    ComplianceModule,
    ReviewsModule,
    EnterpriseTrustModule,
    StrategyEvalModule,
    ExternalDoctorsModule,
    ClinicTestResultsModule,
    PatientClinicalProfilesModule,
    forwardRef(() => PublicBookingModule),
    ServiceModule,
    OnboardingModule,
    ClinicPreVisitIntakesModule,
    ClinicQuestionnairesModule,
    LocationsModule,
    forwardRef(() => GiftCardsModule),
    ZendeskModule,
  ],
  controllers: [AiCommandController],
  providers: [
    AiCommandService,
    CommandOrchestrationService,
    OperationalPlanBuilderService,
    AiScheduleHandlersService,
    AiSchedulingService,
    AiOperationsService,
    AiBusinessCurrencyService,
    AiBusinessLanguagesService,
    AiReferralStaffTemplatesService,
    AiExternalDoctorsService,
    AiBusinessDateFormatService,
    AiBusinessHoursLocationService,
    AiProviderSpecialtyService,
    AiBusinessTaxService,
    AiBusinessComplianceService,
    AiClinicTestOrderService,
    AiClinicTestResultService,
    AiClinicTestCatalogService,
    AiClinicPatientChartService,
    AiPatientClinicalMutationsService,
    AiClinicQuestionnaireService,
    AiLocationsService,
    AiProductGuideService,
    AiProductGuideEmptyStateService,
    GuideTelemetryService,
    AiConsumerClinicTestResultsService,
    AiProviderClinicTasksAndResultsService,
    AiPackageLocalizedNamesService,
    AiTourServiceService,
    AiRecommendationProductService,
    AiPlatformService,
    AiPlatformScheduler,
    AiBookingDepthService,
    AiCatalogService,
    AiDashboardCoreService,
    AiCustomerCrmService,
    AiScheduleResourcesService,
    AiAgentOpsService,
    AiBusinessProfileService,
    AiOnboardingService,
    AiClinicPreVisitIntakeService,
    AiPaymentsService,
    AiGiftFulfillmentService,
    AiIntegrationsService,
    AiRetailFinanceService,
    AiMarketingGrowthService,
    AiPushNotificationsService,
    AiNotificationSettingsService,
    AiWhatsappIntegrationService,
    AiOpenaiIntegrationService,
    AiSelfServiceBookingService,
    AiProviderBookingService,
    AiProviderClinicCollectionService,
    AiClinicLabBookingService,
    AiClinicBookingService,
    AiGuestCheckoutFieldsService,
    AiResumePendingPaymentService,
    AiDiagnoseStripeCheckoutFailureService,
    AiPayAtVenueFallbackService,
    AiResumeBookingDraftService,
    AiExplainSlotNoLongerAvailableService,
    AiExplainMultiServicePaymentReturnService,
    AiRetryFailedNetworkActionService,
    AiExplainVoiceInputService,
    AiSpeakAssistantReplyService,
    AiGiveAiFeedbackService,
    AiExplainRtlLayoutService,
    AiConsumerAdoptionService,
    AiProviderPushSetupService,
    AiProviderEarningsService,
    AiProviderClientContextService,
    AiProviderExp2Service,
    AiProviderTimeOffService,
    AiProviderOpenShiftsService,
    AiProviderExp3Service,
    AiClinicServiceService,
    AiSuggestionsService,
    CommandCompletionPipelineService,
    AiEventsService,
    IntentDecompositionService,
    AiSettingsService,
    AiBriefingService,
    AiAuditService,
    AiAutopilotScheduler,
    BookingCommandGraphService,
    CompoundCommandGraphService,
    CommandReasoningService,
    ReactResultCompilerService,
    AiGatewayService,
    CustomerAiCommandService,
    AiEntityMemoryService,
    AiConversationSummaryService,
    AiRagService,
    AiIntelligenceService,
    AiWeeklyReportService,
    CommandComplexityRouterService,
    AiIntentRescueService,
    AiCommandRegistryService,
    AiCommandEntityParamsService,
    AiPromptSecurityService,
    AiPromptNormalizationService,
    AiSemanticIntentService,
    FastIntentHeuristicsService,
    CommandUnderstandingPipelineService,
    DashboardCommandUnderstandingAdapter,
    ProviderCommandUnderstandingAdapter,
    CustomerCommandUnderstandingAdapter,
    PublicCommandUnderstandingAdapter,
    AiCommandTraceService,
  ],
  exports: [
    AiPlatformService,
    AiPushNotificationsService,
    AiGiftFulfillmentService,
    AiRetailFinanceService,
    AiProviderBookingService,
    AiProviderClinicCollectionService,
    AiClinicLabBookingService,
    AiClinicBookingService,
    CommandCompletionPipelineService,
    AiEventsService,
    AiSuggestionsService,
    AiScheduleHandlersService,
    AiScheduleResourcesService,
    OperationalPlanBuilderService,
    CommandOrchestrationService,
    AiSettingsService,
    AiGatewayService,
    CustomerAiCommandService,
    AiBusinessCurrencyService,
    AiBusinessLanguagesService,
    AiReferralStaffTemplatesService,
    AiExternalDoctorsService,
    AiBusinessDateFormatService,
    AiBusinessHoursLocationService,
    AiProviderSpecialtyService,
    AiBusinessTaxService,
    AiBusinessComplianceService,
    AiConsumerClinicTestResultsService,
    AiProviderClinicTasksAndResultsService,
    AiConsumerAdoptionService,
    AiProviderPushSetupService,
    AiProviderEarningsService,
    AiProviderClientContextService,
    AiProviderExp2Service,
    AiProviderTimeOffService,
    AiProviderOpenShiftsService,
    AiProviderExp3Service,
    AiRecommendationProductService,
    AiPackageLocalizedNamesService,
    AiTourServiceService,
    AiIntelligenceService,
    CommandComplexityRouterService,
    AiIntentRescueService,
    AiCommandRegistryService,
    AiCommandEntityParamsService,
    AiPromptSecurityService,
    AiPromptNormalizationService,
    AiSemanticIntentService,
    FastIntentHeuristicsService,
    CommandUnderstandingPipelineService,
    DashboardCommandUnderstandingAdapter,
    ProviderCommandUnderstandingAdapter,
    CustomerCommandUnderstandingAdapter,
    PublicCommandUnderstandingAdapter,
    AiProductGuideService,
    AiProductGuideEmptyStateService,
    AiPaymentsService,
    AiSelfServiceBookingService,
    AiMarketingGrowthService,
    AiGuestCheckoutFieldsService,
    AiDiagnoseStripeCheckoutFailureService,
    AiPayAtVenueFallbackService,
    AiResumeBookingDraftService,
    AiExplainSlotNoLongerAvailableService,
    AiExplainVoiceInputService,
    AiSpeakAssistantReplyService,
    AiGiveAiFeedbackService,
    AiExplainRtlLayoutService,
    GuideTelemetryService,
    AiCommandTraceService,
  ],
})
export class AiModule {}
