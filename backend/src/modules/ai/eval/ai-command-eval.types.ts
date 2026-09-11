import type { CommandSurface } from '../ai-command-registry.types.js';
import type { ComplexityRoute } from '../command-complexity-router.service.js';
import type { DecompositionSource } from '../intent-decomposition.types.js';

export type AiEvalLocale = 'en' | 'hy' | 'ru' | 'translit';

export interface CompoundStepParamExpectation {
  stepIndex: number;
  paramsPartial?: Record<string, unknown>;
}

export interface AiCommandEvalExpectation {
  /** Expected intent action when classify output is simulated or skipped */
  action?: string;
  /** Subset match on params after heuristic finalize */
  paramsPartial?: Record<string, unknown>;
  /** Deterministic complexity route tier */
  routeTier?: ComplexityRoute['tier'];
  /** Mutate (M) vs read (R) access tier for dashboard clinic ext intents (ai-cmd-clinic-6-gap-2.2). */
  accessTier?: 'M' | 'R';
  /** Parsed destination time (24h) for reschedule prompts */
  rescheduleTimeSlot?: string;
  /** Parsed source time for reschedule prompts */
  rescheduleFromTimeSlot?: string;
  /** Whether multilingual classifier hint should apply */
  needsMultilingual?: boolean;
  /** Intent rescue should change unknown → this action */
  rescuedAction?: string;
  /** Input action for disambiguation rescue (defaults to unknown). */
  rescueFromAction?: string;
  /** When true, eval uses surface-scoped self-service rescue (customer cancel/reschedule i18n). */
  useSurfaceSelfServiceRescue?: boolean;
  /** When true, eval uses customer membership/subscription rescue (use_subscription_credit + my_subscriptions). */
  useSurfaceMembershipCustomerRescue?: boolean;
  /** When true, eval uses customer CRM rescue directly (subscription_usage raw usage ledger). */
  useSurfaceCustomerCrmRescue?: boolean;
  /** When true, eval uses customer GDPR self-service rescue (privacy_export + privacy_delete). */
  useSurfacePrivacyGdprCustomerRescue?: boolean;
  /** When true, eval uses customer gift card cancel-request rescue (request_gift_card_cancel). */
  useSurfaceGiftCardCancelCustomerRescue?: boolean;
  /** When true, eval uses customer gift card account claim rescue (claim_gift_card_balance). */
  useSurfaceClaimGiftCardBalanceCustomerRescue?: boolean;
  /** When true, eval uses customer physical gift card delivery tracking rescue (track_physical_gift_card_order). */
  useSurfaceTrackPhysicalGiftCardOrderRescue?: boolean;
  /** When true, eval uses customer cancel package visit rescue (cancel_package_visit_self). */
  useSurfaceCancelPackageVisitSelfRescue?: boolean;
  /** When true, eval uses customer reschedule package visit rescue (reschedule_package_visit_self). */
  useSurfaceReschedulePackageVisitSelfRescue?: boolean;
  /** When true, eval uses customer package visit self-service rescue (cancel/reschedule_package_visit_self). */
  useSurfacePackageVisitSelfCustomerRescue?: boolean;
  /** When true, eval uses customer package visit list rescue (list_my_package_visits). */
  useSurfaceListMyPackageVisitsCustomerRescue?: boolean;
  /** When true, eval uses customer/public tour booking, day slots, and capacity rescue. */
  useSurfaceTourCustomerPublicRescue?: boolean;
  /** When true, eval uses customer/public checkout success product-card rescue. */
  useSurfaceCheckoutRecommendationsCustomerPublicRescue?: boolean;
  /** When true, eval uses customer dismiss checkout recommendations rescue (ai-cmd-customer-4.16.2). */
  useSurfaceDismissRecommendationsRescue?: boolean;
  /** When true, eval uses customer growth loops rescue (refer_a_friend / share_salon_link). */
  useSurfaceGrowthLoopsCustomerRescue?: boolean;
  /** When true, eval uses consumer adoption rescue (explain_my_notifications, rebook, etc.). */
  useSurfaceConsumerAdoptionRescue?: boolean;
  /** When true, eval uses customer share my booking rescue (ai-cmd-customer-4.3.7). */
  useSurfaceShareMyBookingRescue?: boolean;
  /** When true, eval uses customer list upcoming appointments rescue (ai-cmd-customer-4.4.1). */
  useSurfaceListMyUpcomingAppointmentsRescue?: boolean;
  /** When true, eval uses customer explain cancel policy rescue (ai-cmd-customer-4.4.4). */
  useSurfaceExplainCancelPolicyRescue?: boolean;
  /** When true, eval uses customer/public deposit forfeiture rescue. */
  useSurfaceExplainDepositForfeitureRescue?: boolean;
  /** When true, eval uses customer/public budget discover chip rescue (ai-cmd-customer-4.20.3). */
  useSurfaceFindServicesUnderBudgetRescue?: boolean;
  /** When true, eval uses customer/public evening/weekend discover chip rescue (ai-cmd-customer-4.20.4). */
  useSurfaceFindEveningWeekendSlotsRescue?: boolean;
  /** When true, eval uses customer explain package visit rules rescue (ai-cmd-customer-4.15.4). */
  useSurfaceExplainPackageVisitRulesRescue?: boolean;
  useSurfaceExplainLoyaltyPointsRescue?: boolean;
  useSurfaceExplainMySubscriptionRescue?: boolean;
  /** When true, eval uses customer update my profile rescue (ai-cmd-customer-4.5.6). */
  useSurfaceUpdateMyProfileRescue?: boolean;
  /** When true, eval uses customer get manage link rescue (ai-cmd-customer-4.4.5). */
  useSurfaceGetManageLinkRescue?: boolean;
  /** When true, eval uses customer/public recover lost manage link rescue (ai-cmd-customer-4.17.3). */
  useSurfaceRecoverLostManageLinkRescue?: boolean;
  /** When true, eval uses customer notify running late rescue (ai-cmd-customer-4.4.6). */
  useSurfaceNotifyRunningLateRescue?: boolean;
  useSurfaceLeaveVisitReviewRescue?: boolean;
  useSurfaceExplainPostVisitReviewPromptRescue?: boolean;
  useSurfaceReportBookingProblemRescue?: boolean;
  useSurfaceExplainShareRewardRescue?: boolean;
  useSurfaceSignInAfterBookingRescue?: boolean;
  /** When true, eval uses customer/public waitlist join+status rescue (ai-cmd-customer-4.4.7). */
  useSurfaceCustomerWaitlistRescue?: boolean;
  /** When true, eval uses customer rebook last appointment rescue (ai-cmd-customer-4.4.8). */
  useSurfaceRebookLastAppointmentRescue?: boolean;
  /** When true, eval uses customer-surface self-service rescue only (acc-2.4 HY/RU). */
  useSurfaceMarketingGrowthRescue?: boolean;
  /** When true, eval uses customer-surface checkout success rescue only (acc-2.4 HY/RU). */
  useSurfaceConsumerCheckoutSuccessRescue?: boolean;
  /** When true, eval uses customer-surface checkout tax rescue only (acc-2.4 HY/RU). */
  useSurfaceConsumerCheckoutTaxRescue?: boolean;
  /** When true, eval uses public/customer checkout tax rescue for explain_checkout_tax. */
  useSurfaceExplainCheckoutTaxRescue?: boolean;
  /** When true, eval uses customer-surface clinic test results rescue only (acc-2.4 HY/RU). */
  useSurfaceConsumerClinicTestResultsRescue?: boolean;
  /** When true, eval uses customer lab order tracking rescue (track_lab_order_status). */
  useSurfaceTrackLabOrderStatusRescue?: boolean;
  /** When true, eval uses customer clinic documents rescue (list_my_documents). */
  useSurfaceListMyDocumentsRescue?: boolean;
  /** When true, eval uses customer measurement flag FAQ rescue (explain_abnormal_result_flag). */
  useSurfaceExplainAbnormalResultFlagRescue?: boolean;
  /** When true, eval uses customer result-ready notification explain rescue. */
  useSurfaceNotifyWhenResultsReadyRescue?: boolean;
  /** When true, eval uses provider-surface implication heuristic rescue (pipe-1.12.5). */
  useSurfaceProviderImplicationRescue?: boolean;
  /** When true, eval uses provider-surface push setup rescue only (acc-2.4 HY/RU). */
  useSurfaceProviderPushSetupRescue?: boolean;
  /** When true, eval uses payments-module rescue (customer/public checkout intents). */
  useSurfacePaymentsRescue?: boolean;
  /** When true, eval uses resume booking draft rescue (customer/public). */
  useSurfaceResumeBookingDraftRescue?: boolean;
  useSurfaceExplainSlotNoLongerAvailableRescue?: boolean;
  useSurfaceExplainMultiServicePaymentReturnRescue?: boolean;
  useSurfaceRetryFailedNetworkActionRescue?: boolean;
  useSurfaceExplainVoiceInputRescue?: boolean;
  useSurfaceSpeakAssistantReplyRescue?: boolean;
  useSurfaceGiveAiFeedbackRescue?: boolean;
  useSurfaceExplainRtlLayoutRescue?: boolean;
  /** Validated action should fail with clarify (acc-2.6). */
  expectValidationClarify?: boolean;
  validationAction?: string;
  validationParamsPartial?: Record<string, unknown>;
  clarifyFieldsContains?: string[];
  /** Expected rescueReason when stable. */
  rescueReason?: string;
  /** acc-3.11 — assert embedding semantic matcher resolves unknown/low-confidence phrasing. */
  useSemanticIntentMatch?: boolean;
  semanticMatchAction?: string;
  semanticMatchParamsPartial?: Record<string, unknown>;
  /** pipe-1.11.2 — implication corpus bucket for accuracy scorecard grouping. */
  implicationTopIntent?: 'booking' | 'schedule' | 'availability';
  /** When true, adopt top-ranked anchor if resolveSemanticMatch is null but score ≥ threshold. */
  semanticMatchUseTopAnchorFallback?: boolean;
  /** pipe-1.13.1 — assert semantic anchors detect first-available booking meaning. */
  useBookingFirstAvailableSemanticDetect?: boolean;
  bookingFirstAvailableSemantic?: boolean;
  /** pipe-1.13.2 — assert semantic anchors detect team-wide availability meaning. */
  useTeamWideAvailabilitySemanticDetect?: boolean;
  teamWideAvailabilitySemantic?: boolean;
  /** acc-3.14 — assert semantic anchors detect any-provider booking scope. */
  useAnyProviderBookingSemanticDetect?: boolean;
  anyProviderBookingSemantic?: boolean;
  /** acc-3.14 — assert semantic anchors detect recommend specialists phrasing. */
  useRecommendSpecialistsSemanticDetect?: boolean;
  recommendSpecialistsSemantic?: boolean;
  /** acc-3.14 — assert semantic anchors resolve dashboard metric params. */
  useMetricResolverSemanticDetect?: boolean;
  metricResolverSemantic?: boolean;
  metricResolverKind?:
    | 'booking'
    | 'staff'
    | 'service'
    | 'customer'
    | 'appointment';
  metricResolverExpected?: string;
  /** Use surface-scoped clinic lab booking rescue (i18n-clinic-v2-ai-8). */
  useSurfaceLabBookingRescue?: boolean;
  /** Use surface-scoped budget service discovery rescue (budget-1.11). */
  useSurfaceBudgetRescue?: boolean;
  /** Use checkout currency explain rescue (discover-not-currency-explain-en). */
  useCheckoutCurrencyRescue?: boolean;
  /** Use surface-scoped service rank discovery rescue (rank-1.11). */
  useSurfaceRankRescue?: boolean;
  /** Use surface-scoped flexible availability enrichment (avail-1.11). */
  useSurfaceFlexibleAvailabilityEnrichment?: boolean;
  /** acc-2.6 / ai-cmd-clinic-6-gap-2.3 — assert direct classifier action (no rescueFromAction). */
  useClinicTestResultExtClassifierDetect?: boolean;
  /** Cross-sprint discover eval bucket tag (service-discovery eval harness). */
  discoverCrossSprintKind?: string;
  discoverClassifierParams?: Record<string, unknown>;
  discoverForbiddenKeys?: readonly string[];
  discoverChipFixtureId?: string;
  discoverCatalogIds?: readonly string[];
  discoverCatalogParams?: Record<string, unknown>;
  discoverOrWindowCount?: number;
  discoverExpectSingleWindow?: boolean;
  discoverCompoundSteps?: readonly string[];
  discoverChipDomain?: string;
  /** Expected action after public/customer flexible availability enrichment. */
  enrichedAction?: string;
  /** Compound decomposition surface (ai-cmd-0.4). */
  compoundSurface?: CommandSurface;
  /** Exact ordered sub-intent actions from deterministic/golden decomposition. */
  compoundSteps?: string[];
  /** Subset of required sub-intent actions (any order). */
  compoundActionsContains?: string[];
  /** Minimum sub-intent count when order is unstable. */
  compoundMinSteps?: number;
  /** Decomposition should not yield multi-step result. */
  compoundExpectEmpty?: boolean;
  /** Expected decomposition source when stable. */
  compoundSource?: DecompositionSource;
  /** Expected compound recipe id when stable. */
  compoundRecipeId?: string;
  /** Per-step param subset checks after decomposition. */
  compoundStepParams?: CompoundStepParamExpectation[];
  /** Skip LLM classify for deterministic compound eval cases. */
  noLlm?: boolean;
  /** Use surface-scoped product guide rescue (ai-guide-1.6.4). */
  useProductGuideRescue?: boolean;
  /** Assert enrichGuideTopicFromPrompt topicId (ai-guide-1.6.4). */
  useProductGuideTopicEnrich?: boolean;
  /** Route context for product guide topic enrichment eval. */
  guideEvalRoute?: string;
  /** ai-guide-1.8.10 — OpenAI disabled or quota exceeded fallback scenario metadata. */
  aiUnavailableReason?: 'openai_not_configured' | 'quota_exceeded';
  aiUnavailableExpectGuide?: boolean;
  aiUnavailableExpectNativeNavigate?: boolean;
  /** Activation step for customer guide topic enrichment eval. */
  guideEvalActivationStep?:
    | 'welcome'
    | 'salon'
    | 'service'
    | 'slot'
    | 'confirm';
  /** HIPAA PHI guard assessment (ai-cmd-compliance-15). */
  phiGuard?: {
    blocked: boolean;
    reason?: 'phi_in_context' | 'phi_in_prompt';
    matchedFields?: string[];
    redactedSubstring?: string;
  };
}

export interface AiCommandEvalCase {
  id: string;
  prompt: string;
  locale?: AiEvalLocale;
  surface?: CommandSurface;
  expect: AiCommandEvalExpectation;
  /** When true, case is documented for live LLM eval only (skipped in CI) */
  requiresLlm?: boolean;
  /**
   * The roster this case presupposes — e2e-bug.470.
   *
   * Defaults to the runner's `SAMPLE_EMPLOYEES` (three people). That default is
   * fine for the overwhelming majority of cases, which never mention a
   * colleague by name, but it silently caps anything that resolves a *name*
   * against real data: §188 measured a roster-aware routing rule as "16 of 33
   * `update_employee` cases fail", when the real cause was that those cases name
   * people the fixed roster has never heard of. A rule cannot be scored against
   * a corpus that cannot express its inputs.
   *
   * Set it when the case's meaning depends on who exists — or on who does not.
   */
  employees?: Array<{ id: string; name: string }>;
}

export interface AiEvalCaseResult {
  id: string;
  passed: boolean;
  errors: string[];
}
