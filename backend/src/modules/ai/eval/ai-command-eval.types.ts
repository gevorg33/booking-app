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
  /** When true, eval uses customer-surface self-service rescue only (acc-2.4 HY/RU). */
  useSurfaceMarketingGrowthRescue?: boolean;
  /** When true, eval uses customer-surface checkout success rescue only (acc-2.4 HY/RU). */
  useSurfaceConsumerCheckoutSuccessRescue?: boolean;
  /** When true, eval uses customer-surface checkout tax rescue only (acc-2.4 HY/RU). */
  useSurfaceConsumerCheckoutTaxRescue?: boolean;
  /** When true, eval uses customer-surface clinic test results rescue only (acc-2.4 HY/RU). */
  useSurfaceConsumerClinicTestResultsRescue?: boolean;
  /** When true, eval uses provider-surface implication heuristic rescue (pipe-1.12.5). */
  useSurfaceProviderImplicationRescue?: boolean;
  /** When true, eval uses provider-surface push setup rescue only (acc-2.4 HY/RU). */
  useSurfaceProviderPushSetupRescue?: boolean;
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
  metricResolverKind?: 'booking' | 'staff' | 'service' | 'customer' | 'appointment';
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
}

export interface AiEvalCaseResult {
  id: string;
  passed: boolean;
  errors: string[];
}
