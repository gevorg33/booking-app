/**
 * C1 / e2e-bug.379 — `compoundStep` and `surfaceHandlers`, derived and tabulated.
 *
 * §125 sized these as **609** and **16** values the specs cannot supply. The
 * first number is misleading in the same way `apiModule`'s 705 was (§159):
 * `compoundStep` is very nearly a property of the *handler*, not of each
 * command. Measured against the live registry:
 *
 *   | rule                        | mismatches |
 *   |-----------------------------|-----------:|
 *   | `mutating`                  |    325/705 |
 *   | `executionMode !== read_only` |  326/705 |
 *   | spec `risk !== 'T0'`        |    325/705 |
 *   | always `true`               |     96/705 |
 *   | **per-handler majority**    |  **20/705** |
 *   | per-domain majority         |     42/705 |
 *
 * So it is 68 handler defaults and **20 named commands**, not 609 spec edits.
 * The four semantic rules were each tried first — "a compound step is a
 * mutation" is the intuitive one and is wrong 46% of the time.
 *
 * `surfaceHandlers` is genuinely per-command, but there are only 16 and 13 are
 * the identical dashboard/provider pair. It is tabulated rather than reduced to
 * a rule with three exceptions: at this size the table *is* the clearer
 * statement, and a rule would hide that `mark_paid`, `list_my_package_visits`
 * and `set_retail_sales_lines` each route somewhere genuinely different.
 */
import type {
  CommandRegistryEntry,
  CommandSurface,
} from './ai-command-registry.types.js';

/** Whether a handler's commands are compound steps, where the handler agrees. */
export const HANDLER_COMPOUND_STEP: Readonly<Record<string, boolean>> = {
  AiAgentOpsService: true,
  AiBookingDepthService: true,
  AiBusinessComplianceService: true,
  AiBusinessCurrencyService: true,
  AiBusinessDateFormatService: true,
  AiBusinessHoursLocationService: true,
  AiBusinessLanguagesService: true,
  AiBusinessProfileService: true,
  AiBusinessTaxService: true,
  AiCatalogService: true,
  AiClinicBookingService: true,
  AiClinicLabBookingService: true,
  AiClinicPatientChartService: true,
  AiClinicPreVisitIntakeService: true,
  AiClinicQuestionnaireService: true,
  AiClinicServiceService: true,
  AiClinicTestCatalogService: true,
  AiClinicTestOrderService: true,
  AiClinicTestResultService: true,
  AiCommandService: true,
  AiConsumerAdoptionService: true,
  AiConsumerClinicTestResultsService: true,
  AiCustomerCrmService: true,
  AiExplainMultiServicePaymentReturnService: true,
  AiExplainRtlLayoutService: true,
  AiExplainSlotNoLongerAvailableService: true,
  AiExplainVoiceInputService: true,
  AiExternalDoctorsService: true,
  AiGiftFulfillmentService: true,
  AiGiveAiFeedbackService: true,
  AiGuestCheckoutFieldsService: true,
  AiIntegrationsService: true,
  // §224 — see the api-module table: same value as the service this command
  // used to be misattributed to, so nothing derived changes.
  AiOpenaiIntegrationService: true,
  AiLocationsService: true,
  AiMarketingGrowthService: true,
  AiOnboardingService: true,
  // e2e-bug.440 — see the note in `ai-command-api-module.derive.ts`; same
  // value as their sibling handlers, so derivation is unchanged.
  AiBookingCoreService: true,
  AiMetaOpsService: true,
  AiOperationsService: true,
  AiPackageLocalizedNamesService: true,
  AiPatientClinicalMutationsService: true,
  AiPayAtVenueFallbackService: true,
  AiPaymentsService: true,
  AiProductGuideEmptyStateService: true,
  AiProductGuideService: true,
  AiProviderBookingService: true,
  AiProviderClientContextService: false,
  AiProviderClinicCollectionService: false,
  AiProviderClinicTasksAndResultsService: false,
  AiProviderEarningsService: false,
  AiProviderExp2Service: false,
  AiProviderExp3Service: false,
  AiProviderOpenShiftsService: false,
  AiProviderPushSetupService: true,
  AiProviderSpecialtyService: true,
  AiProviderTimeOffService: true,
  AiPushNotificationsService: true,
  AiRecommendationProductService: true,
  AiReferralStaffTemplatesService: true,
  AiResumeBookingDraftService: true,
  AiResumePendingPaymentService: true,
  AiRetailFinanceService: true,
  AiRetryFailedNetworkActionService: true,
  AiScheduleHandlersService: true,
  AiScheduleResourcesService: true,
  AiSchedulingService: true,
  AiSelfServiceBookingService: true,
  AiSpeakAssistantReplyService: true,
  AiTourServiceService: true,
  ProviderAiCommandService: false,
  PublicBookingAssistantService: true,
};

/** The 20 commands that disagree with their handler's default. */
export const COMPOUND_STEP_EXCEPTIONS: Readonly<Record<string, boolean>> = {
  cancel_time_off_request: false,
  collect_cash_confirm: false,
  configure_provider_push_date_format: false,
  explain_assistant_confirm_swipe: false,
  explain_payment_status: false,
  explain_profile_settings: false,
  explain_provider_app_tabs: false,
  explain_provider_compound_steps: false,
  explain_provider_date_display: false,
  explain_provider_payment_currency: false,
  explain_provider_session_timeout: false,
  explain_push_setup: false,
  explain_staff_invite: false,
  explain_team_view_scope: false,
  list_booking_lab_summaries: true,
  list_my_time_off_requests: false,
  list_patient_pending_lab_requests: false,
  my_resource_assignments: false,
  notify_patient_book_lab: false,
  unknown: false,
};

/** The 16 commands routing to a different handler per surface. */
export const SURFACE_HANDLERS: Readonly<
  Record<string, Partial<Record<CommandSurface, string>>>
> = {
  block_schedule: {
    dashboard: 'AiCommandService',
    provider: 'ProviderAiCommandService',
  },
  cancel_bookings: {
    dashboard: 'AiCommandService',
    provider: 'ProviderAiCommandService',
  },
  check_availability: {
    dashboard: 'AiCommandService',
    provider: 'ProviderAiCommandService',
  },
  fill_unused_slots: {
    dashboard: 'AiCommandService',
    provider: 'ProviderAiCommandService',
  },
  list_bookings: {
    dashboard: 'AiCommandService',
    provider: 'ProviderAiCommandService',
  },
  list_my_package_visits: {
    customer: 'AiSelfServiceBookingService',
    provider: 'AiProviderBookingService',
  },
  list_schedule_gaps: {
    dashboard: 'AiCommandService',
    provider: 'ProviderAiCommandService',
  },
  mark_no_shows: {
    dashboard: 'AiCommandService',
    provider: 'ProviderAiCommandService',
  },
  mark_paid: {
    dashboard: 'AiBookingDepthService',
    provider: 'AiProviderBookingService',
  },
  payment_sweep: {
    dashboard: 'AiCommandService',
    provider: 'ProviderAiCommandService',
  },
  reschedule_booking: {
    dashboard: 'AiCommandService',
    provider: 'ProviderAiCommandService',
  },
  set_retail_sales_lines: {
    dashboard: 'AiRetailFinanceService',
    provider: 'AiProviderExp3Service',
  },
  show_appointments: {
    dashboard: 'AiCommandService',
    provider: 'ProviderAiCommandService',
  },
  summarize_day: {
    dashboard: 'AiCommandService',
    provider: 'ProviderAiCommandService',
  },
  summarize_utilization: {
    dashboard: 'AiCommandService',
    provider: 'ProviderAiCommandService',
  },
  update_bookings: {
    dashboard: 'AiCommandService',
    provider: 'ProviderAiCommandService',
  },
};

/**
 * May this command appear as a step inside a compound prompt?
 *
 * `undefined` when the handler is unknown — a new handler is a deliberate
 * addition, and the gate names it rather than defaulting to a guess.
 */
export function deriveCompoundStep(
  commandId: string,
  handler: string,
): boolean | undefined {
  const exception = COMPOUND_STEP_EXCEPTIONS[commandId];
  if (exception !== undefined) return exception;
  return HANDLER_COMPOUND_STEP[handler];
}

/** Per-surface handler overrides, or `undefined` when the command has none. */
export function deriveSurfaceHandlers(
  commandId: string,
): CommandRegistryEntry['surfaceHandlers'] {
  return SURFACE_HANDLERS[commandId];
}
