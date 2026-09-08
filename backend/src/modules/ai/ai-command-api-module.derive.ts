/**
 * C1 / e2e-bug.379 — `apiModule`, derived rather than declared 705 times.
 *
 * The port's plan is to generate `COMMAND_REGISTRY` from `CommandSpec` and then
 * delete the hand-maintained lists. §125 sized `apiModule` as **705 values the
 * specs cannot supply**, which read as 705 spec edits.
 *
 * It is not. Measured against the live registry, `apiModule` is very nearly a
 * function of `handler`: **68 handlers**, of which 64 map to exactly one module,
 * and only **7 commands** in the whole registry disagree with their handler's
 * majority. So the data is 75 facts, not 705 — and the 7 are worth naming
 * individually, because each is a real crossing of a module boundary:
 *
 *   - `check_availability` is served by `AiCommandService` but belongs to
 *     public-booking, being the one availability read the public site makes;
 *   - `mark_paid` and `explain_visibility_block` are dashboard+provider commands
 *     owned by provider-mobile;
 *   - `explain_ai_settings`, `explain_app_feature`, `explain_current_screen` and
 *     `guide_user_flow` are the product-guide commands that stayed with
 *     ai-command while the rest of their handler moved to provider-mobile.
 *
 * Surface cannot substitute for the exception list: `explain_app_feature` and
 * `check_availability` are both on all four surfaces and land in different
 * modules. That was checked before settling on named exceptions.
 *
 * `ai-command-registry.derivable.spec.ts` asserts this reproduces all
 * 68 handlers and every registry row exactly, so the map cannot rot
 * silently as commands are added.
 */
import type { CommandApiModule } from './ai-command-registry.types.js';

/** The module each handler's commands belong to, where the handler is unanimous. */
export const HANDLER_API_MODULE: Readonly<Record<string, CommandApiModule>> = {
  AiAgentOpsService: 'agent-ops',
  AiBookingDepthService: 'booking',
  AiBusinessComplianceService: 'ai-command',
  AiBusinessCurrencyService: 'ai-command',
  AiBusinessDateFormatService: 'ai-command',
  AiBusinessHoursLocationService: 'ai-command',
  AiBusinessLanguagesService: 'ai-command',
  AiBusinessProfileService: 'business-profile',
  AiBusinessTaxService: 'ai-command',
  AiCatalogService: 'catalog',
  AiClinicBookingService: 'ai-command',
  AiClinicLabBookingService: 'clinic-test-results',
  AiClinicPatientChartService: 'patient-clinical-profiles',
  AiClinicPreVisitIntakeService: 'clinic-pre-visit-intake',
  AiClinicQuestionnaireService: 'clinic-questionnaires',
  AiClinicServiceService: 'ai-command',
  AiClinicTestCatalogService: 'clinic-test-results',
  AiClinicTestOrderService: 'clinic-test-results',
  AiClinicTestResultService: 'clinic-test-results',
  AiCommandService: 'ai-command',
  AiConsumerAdoptionService: 'consumer-adoption',
  AiConsumerClinicTestResultsService: 'clinic-test-results',
  AiCustomerCrmService: 'customer-crm',
  AiExplainMultiServicePaymentReturnService: 'ai-command',
  AiExplainRtlLayoutService: 'ai-command',
  AiExplainSlotNoLongerAvailableService: 'ai-command',
  AiExplainVoiceInputService: 'ai-command',
  AiExternalDoctorsService: 'ai-command',
  AiGiftFulfillmentService: 'gift-fulfillment',
  AiGiveAiFeedbackService: 'ai-command',
  AiGuestCheckoutFieldsService: 'ai-command',
  AiIntegrationsService: 'integrations',
  // §224 — `configure_openai_integration` is served by its own service, not
  // by `AiIntegrationsService`. Same module, so the derived value is
  // unchanged; only the handler name it is keyed from is now accurate.
  AiOpenaiIntegrationService: 'integrations',
  AiLocationsService: 'locations',
  AiMarketingGrowthService: 'marketing-growth',
  AiOnboardingService: 'onboarding',
  // e2e-bug.440 — these two serve commands whose specs used to name the service
  // holding the *switch case* rather than the one that reads the params. Both
  // resolve to `ai-command`, the same module their sibling handlers
  // (`AiCommandService`, `AiOperationsService`, `AiScheduleHandlersService`)
  // already map to — so pointing the specs at the truthful handler leaves every
  // derived registry entry byte-identical. Without an entry here the generator
  // throws `unknown handler`, which is why the ticket's "just fix the label"
  // framing does not work on its own.
  AiBookingCoreService: 'ai-command',
  AiMetaOpsService: 'ai-command',
  AiOperationsService: 'ai-command',
  AiPackageLocalizedNamesService: 'ai-command',
  AiPatientClinicalMutationsService: 'patient-clinical-profiles',
  AiPayAtVenueFallbackService: 'ai-command',
  AiPaymentsService: 'payments',
  AiProductGuideEmptyStateService: 'ai-command',
  AiProductGuideService: 'provider-mobile',
  AiProviderBookingService: 'provider-mobile',
  AiProviderClientContextService: 'provider-client-context',
  AiProviderClinicCollectionService: 'clinic-test-results',
  AiProviderClinicTasksAndResultsService: 'clinic-test-results',
  AiProviderEarningsService: 'provider-earnings',
  AiProviderExp2Service: 'provider-exp-2',
  AiProviderExp3Service: 'provider-exp-3',
  AiProviderOpenShiftsService: 'provider-open-shifts',
  AiProviderPushSetupService: 'provider-push-setup',
  AiProviderSpecialtyService: 'ai-command',
  AiProviderTimeOffService: 'provider-time-off',
  AiPushNotificationsService: 'push-notifications',
  AiRecommendationProductService: 'ai-command',
  AiReferralStaffTemplatesService: 'ai-command',
  AiResumeBookingDraftService: 'ai-command',
  AiResumePendingPaymentService: 'ai-command',
  AiRetailFinanceService: 'retail-finance',
  AiRetryFailedNetworkActionService: 'ai-command',
  AiScheduleHandlersService: 'ai-command',
  AiScheduleResourcesService: 'schedule-resources',
  AiSchedulingService: 'schedule',
  AiSelfServiceBookingService: 'public-booking',
  AiSpeakAssistantReplyService: 'ai-command',
  AiTourServiceService: 'ai-command',
  ProviderAiCommandService: 'provider-mobile',
  PublicBookingAssistantService: 'public-booking',
};

/** The 7 commands that cross their handler's module boundary. */
export const API_MODULE_EXCEPTIONS: Readonly<Record<string, CommandApiModule>> =
  {
    check_availability: 'public-booking',
    explain_ai_settings: 'ai-command',
    explain_app_feature: 'ai-command',
    explain_current_screen: 'ai-command',
    explain_visibility_block: 'provider-mobile',
    guide_user_flow: 'ai-command',
    mark_paid: 'provider-mobile',
  };

/**
 * The owning API module for a command.
 *
 * Returns `undefined` rather than guessing when the handler is unknown — a new
 * handler must be added to the map deliberately, and the gate will say so.
 */
export function deriveApiModule(
  commandId: string,
  handler: string,
): CommandApiModule | undefined {
  return API_MODULE_EXCEPTIONS[commandId] ?? HANDLER_API_MODULE[handler];
}
