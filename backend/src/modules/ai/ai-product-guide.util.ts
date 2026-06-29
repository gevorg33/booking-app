import type { CommandSurface } from './ai-command-registry.types.js';
import type { AccessTier } from './access-control.matrix.js';
import type { AiRoleProfile } from './ai-settings.types.js';
import type {
  CommandResult,
  GuideResponse,
} from './command-completion.types.js';
import type { AssistantMode } from './ai-assistant-mode.util.js';
import type { GuideFlowSurface } from './guide/guide-flow.types.js';
import {
  shouldApplyProductGuideRouting,
  shouldForceProductGuideRouting,
} from './ai-assistant-mode.util.js';

/**
 * ai-guide-1.0.1 — Product guide vs domain explain vs action taxonomy.
 *
 * | Bucket | Answers | Handler target | Examples |
 * |--------|---------|----------------|----------|
 * | **guide** | Where in the UI, walkthroughs, screen semantics | `AiProductGuideService` (`explain_app_feature`, `guide_user_flow`, `explain_current_screen`, `guide_*`, `booking_help`) | "Where is online payment?", "Walk me through adding staff" |
 * | **domain_explain** | Business/domain meaning (tax, currency, policy, checkout line items) | Existing domain `explain_*` handlers | "Why is there VAT?", "What currency is checkout?" |
 * | **action** | Read/mutate operations (lists, bookings, settings changes) | Existing command handlers | "Book Anna tomorrow", "Enable online payment" |
 *
 * Routing rule: navigation/how-to without explicit mutate targets → **guide**; domain why/what-meaning → **domain_explain**; imperative mutate/read ops → **action**.
 * Domain `explain_*` intents must not be repurposed for UI navigation (see **ai-guide-1.8.1**).
 */
export type ProductGuideIntentBucket = 'guide' | 'domain_explain' | 'action' | 'unknown';

/** Unified app-guide intents (ai-guide-1.2.2). */
export const APP_GUIDE_INTENTS = [
  'explain_app_feature',
  'guide_user_flow',
  'explain_current_screen',
] as const;

export type AppGuideIntent = (typeof APP_GUIDE_INTENTS)[number];

/** Existing read-only intents that behave like app guides on specific surfaces. */
export const APP_GUIDE_SURROGATE_INTENTS = ['booking_help'] as const;

export type AppGuideSurrogateIntent = (typeof APP_GUIDE_SURROGATE_INTENTS)[number];

/** Representative domain explain intents — any other `explain_*` id is still domain_explain. */
export const DOMAIN_EXPLAIN_INTENT_SAMPLES = [
  'explain_appointment_tax',
  'explain_booking_date_format',
  'explain_booking_languages',
  'explain_checkout_currency',
  'explain_checkout_recommendations',
  'explain_checkout_tax',
  'explain_checkout_total',
  'explain_clinic_booking',
  'explain_clinic_services',
  'explain_compliance_status',
  'explain_consumer_checkout_success',
  'explain_consumer_checkout_tax',
  'explain_data_rights',
  'explain_gdpr_checklist',
  'explain_hipaa_session_timeout',
  'explain_last_push',
  'explain_minimum_necessary_phi_access',
  'explain_my_notifications',
  'explain_notification_currency',
  'explain_package_currency',
  'explain_package_display_name',
  'explain_payment_status',
  'explain_phi_encryption_status',
  'explain_plan_limits',
  'explain_provider_date_display',
  'explain_provider_payment_currency',
  'explain_provider_session_timeout',
  'explain_push_setup',
  'explain_reports_currency',
  'explain_stripe_checkout_currency',
  'explain_stripe_currency_warning',
  'explain_stripe_tax_charge',
  'explain_tenant_currency',
  'explain_tour_booking',
  'explain_tour_day_slots',
  'explain_why_stripe_required',
] as const;

export interface ProductGuideDisambiguationRow {
  id: string;
  /** When this holds, prefer `preferredIntent` over `misclassifiedAction`. */
  misclassifiedAction: string | RegExp;
  promptCue: RegExp;
  preferredIntent: AppGuideIntent;
  rescueReason: string;
  rationale: string;
}

/** Deterministic disambiguation table — extend via fixtures + tests. */
export const PRODUCT_GUIDE_DISAMBIGUATION_TABLE: readonly ProductGuideDisambiguationRow[] =
  [
    {
      id: 'nav-vs-configure-online-payment',
      misclassifiedAction: /^configure_(service_)?online_payment$/,
      promptCue:
        /\b(where|how\s+(?:do|can|to)|which\s+(?:menu|page|tab|setting)|walk\s+me\s+through|show\s+me\s+how|find\s+the\s+setting)\b|(?:Որտեղ(?:ից|)?|որտեղ(?:ից|)?)|(?:где\s+(?:включить|найти|мне)|как\s+(?:включить|подключить))/iu,
      preferredIntent: 'guide_user_flow',
      rescueReason: 'product_guide_navigation',
      rationale:
        'Navigation/how-to for online payments → guide; explicit "enable/configure X for service Y" stays mutate.',
    },
    {
      id: 'nav-vs-create-employee',
      misclassifiedAction: /^create_employee$/,
      promptCue:
        /\b(how\s+(?:do|can|to)|where|walk\s+me\s+through|add\s+a\s+(?:new\s+)?(?:staff|employee|stylist|provider|team\s+member))\b/i,
      preferredIntent: 'guide_user_flow',
      rescueReason: 'product_guide_navigation',
      rationale:
        'Generic staff onboarding questions → guide; named hire + role assignment → create_employee.',
    },
    {
      id: 'nav-vs-privacy-retention',
      misclassifiedAction: /^configure_privacy_retention$/,
      promptCue:
        /\b(where|how\s+(?:do|can|to)|which\s+setting|find\s+the\s+setting)\b.+\b(retention|customer\s+data|privacy\s+settings)\b/i,
      preferredIntent: 'explain_app_feature',
      rescueReason: 'product_guide_navigation',
      rationale:
        'Find settings UI → guide; "keep data for N years" imperative → configure_privacy_retention.',
    },
    {
      id: 'nav-vs-enable-push',
      misclassifiedAction: /^enable_push_notifications$/,
      promptCue:
        /\b(how\s+(?:do|can|to)|where|turn\s+on|enable)\b.+\b(push|notifications?)\b/i,
      preferredIntent: 'guide_user_flow',
      rescueReason: 'product_guide_navigation',
      rationale:
        'Provider push setup walkthrough → guide; explicit enable without how/where → enable_push_notifications / explain_push_setup domain path.',
    },
    {
      id: 'nav-vs-booking-mutate',
      misclassifiedAction: /^(create_booking|book_appointment)$/,
      promptCue:
        /\b(how\s+(?:do|can|to)|where|walk\s+me\s+through|help\s+me)\b.+\b(book|booking|appointment|schedule)\b|(?:ինչպ(?:ե?՞?)?(?:ես|ս).+(?:booking|appointment|amragir|amragrum))|(?:как\s+(?:забронировать|записаться)|как.+(?:appointment|booking))/iu,
      preferredIntent: 'guide_user_flow',
      rescueReason: 'product_guide_navigation',
      rationale:
        'Booking funnel help → guide; concrete slot/person/date → book/create.',
    },
    {
      id: 'nav-vs-mark-paid',
      misclassifiedAction: /^mark_paid$/,
      promptCue:
        /\b(where|how\s+(?:do|can|to))\b.+\b(mark\s+paid|paid|payment\s+status)\b|(?:где\s+отметить.+(?:оплат|paid))/iu,
      preferredIntent: 'guide_user_flow',
      rescueReason: 'product_guide_navigation',
      rationale:
        'Locate mark-paid UI → guide; "mark Sofia paid" → mark_paid.',
    },
    {
      id: 'screen-vs-unknown',
      misclassifiedAction: /^unknown$/,
      promptCue:
        /\b(this\s+page|this\s+screen|what\s+am\s+i\s+looking\s+at|explain\s+what\s+i\s+(?:see|am\s+looking\s+at)|here\s+on\s+this)\b|(?:на\s+этой\s+странице|что\s+я\s+могу\s+сделать)/iu,
      preferredIntent: 'explain_current_screen',
      rescueReason: 'product_guide_screen',
      rationale: 'Screen semantics with route context → explain_current_screen.',
    },
  ] as const;

export interface ProductGuideRoutingOptions {
  surface?: CommandSurface;
  assistantMode?: AssistantMode;
}

export interface ProductGuideDisambiguationResult {
  action: AppGuideIntent;
  rescueReason: string;
}

export type ProductGuidePromptCue =
  | 'navigation'
  | 'screen'
  | 'walkthrough'
  | 'help_page'
  | 'feature_meaning';

export interface ProductGuidePromptMatch {
  matched: boolean;
  intent?: AppGuideIntent;
  cue?: ProductGuidePromptCue;
}

/**
 * pipe-1.2 / ai-guide-1.0.2 — fast heuristic: prompt asks for UI navigation or setup help, not domain explain or mutate.
 */
export function isProductGuidePrompt(
  prompt: string,
  options: ProductGuideRoutingOptions = {},
): boolean {
  return resolveProductGuidePromptMatch(prompt, options).matched;
}

/** Detect guide prompt + preferred guide intent + cue (pipe-1.2). */
export function resolveProductGuidePromptMatch(
  prompt: string,
  options: ProductGuideRoutingOptions = {},
): ProductGuidePromptMatch {
  const trimmed = prompt.trim();
  if (!trimmed) return { matched: false };

  if (options.assistantMode === 'act') {
    return { matched: false };
  }

  if (shouldForceProductGuideRouting(options.assistantMode)) {
    if (hasExplicitMutateCue(trimmed)) return { matched: false };
    const cue = detectProductGuidePromptCue(trimmed);
    return {
      matched: true,
      intent: inferProductGuideIntentFromPrompt(trimmed),
      cue,
    };
  }

  if (classifyPromptIntentBucket(trimmed, options) !== 'guide') {
    return { matched: false };
  }

  const cue = detectProductGuidePromptCue(trimmed);
  return {
    matched: true,
    intent: inferProductGuideIntentFromPrompt(trimmed),
    cue,
  };
}

function isGuideUiFeatureMeaningPrompt(prompt: string): boolean {
  if (!GUIDE_UI_FEATURE_MEANING_CUE.test(prompt)) return false;
  if (
    /\b(deposit|vat|tax|currency|checkout\s+total|stripe|fee|charge|gdpr|hipaa|privacy\s+rights?)\b/i.test(
      prompt,
    )
  ) {
    return false;
  }
  return /\b(toggle|button|tab|menu|screen|feature|sidebar|setting|page|panel|switch|field|icon)\b/i.test(
    prompt,
  );
}

function detectProductGuidePromptCue(prompt: string): ProductGuidePromptCue {
  if (/\bhelp\s+me\s+with\s+this\s+(?:page|screen)\b/i.test(prompt)) {
    return 'help_page';
  }
  if (hasProductGuideScreenCue(prompt)) return 'screen';
  if (GUIDE_WALKTHROUGH_CUE.test(prompt)) return 'walkthrough';
  if (isGuideUiFeatureMeaningPrompt(prompt)) {
    return 'feature_meaning';
  }
  return 'navigation';
}

/** Map a guide-classified prompt to the app-guide intent id (ai-guide-1.2.2). */
export function inferProductGuideIntentFromPrompt(prompt: string): AppGuideIntent {
  if (hasProductGuideScreenCue(prompt)) {
    return 'explain_current_screen';
  }
  if (/\bwalk\s+me\s+through|step\s+by\s+step|setup\s+flow\b/i.test(prompt)) {
    return 'guide_user_flow';
  }
  if (
    isGuideUiFeatureMeaningPrompt(prompt)
  ) {
    return 'explain_app_feature';
  }
  return 'guide_user_flow';
}

export function isGuideResponse(value: unknown): value is GuideResponse {
  if (!value || typeof value !== 'object') return false;
  const guide = value as GuideResponse;
  return (
    typeof guide.summary === 'string' &&
    Array.isArray(guide.steps) &&
    guide.steps.every(
      (step) =>
        step &&
        typeof step === 'object' &&
        typeof step.title === 'string' &&
        typeof step.body === 'string',
    )
  );
}

export function buildGuideCommandResult(
  action: AppGuideIntent,
  guide: GuideResponse,
): CommandResult {
  return {
    success: true,
    action,
    summary: guide.summary,
    details: {
      topicId: guide.topicId ?? null,
      stepCount: guide.steps.length,
    },
    guide,
  };
}

export type { ProductGuideSessionContext } from './ai-product-guide-session.util.js';
export { resolveProductGuideSessionContext } from './ai-product-guide-session.util.js';

/** Merge conversational guideTopicId from dashboard context into classifier params (ai-guide-1.3.4). */
export function mergeProductGuideParams(
  params: Record<string, unknown>,
  session?: { context?: Record<string, unknown> },
): Record<string, unknown> {
  const guideTopicId = session?.context?.guideTopicId;
  if (
    params.topicId == null &&
    typeof guideTopicId === 'string' &&
    guideTopicId.trim()
  ) {
    return { ...params, topicId: guideTopicId.trim() };
  }
  return params;
}

export function isProductGuideDashboardIntent(
  action: string,
): action is AppGuideIntent {
  return isAppGuideIntent(action);
}

const EXPLICIT_MUTATE_VERB =
  /\b(enable|disable|turn\s+on|turn\s+off|create|add|invite|book|schedule|cancel|reschedule|mark\b.+\bpaid|mark\s+no[- ]show|delete|remove|forget|set|keep|configure|assign|send|approve|deny|upload|release|notify|offer|accept|sign|report|open\s+ticket)\b/i;

const GUIDE_NAVIGATION_CUE =
  /\b(how\s+(?:do|can|could|to|i)|where\s+(?:is|are|do|can|i)|which\s+(?:menu|page|tab|screen|setting|button)|walk\s+me\s+through|show\s+me\s+how|help\s+me\s+(?:with|understand)|help\s+me\s+with\s+this\s+(?:page|screen)|what\s+can\s+i\s+do\s+(?:on|here)|take\s+me\s+to|find\s+the\s+(?:setting|page|menu))\b|(?:ինչպ(?:ե?՞?)?(?:ես|ս)|որտեղ(?:ից|)?|Որտեղ(?:ից|)?)|(?:как\s+(?:обновить|купить|посмотреть|забронировать|отметить)|где\s+(?:отметить|найти|включить)|как\s+(?:я\s+)?могу)/iu;

/** UI feature semantics — guide, not domain explain (when not checkout/tax/currency topic). */
const GUIDE_UI_FEATURE_MEANING_CUE =
  /\bwhat\s+does\s+.+\s+mean\b|\bwhat\s+is\s+.+\s+(?:feature|button|tab|toggle|switch|menu|screen)\b/i;

const GUIDE_WALKTHROUGH_CUE =
  /\bwalk\s+me\s+through\b|(?:քայլ\s+առ\s+քայլ|провед(?:и|ите)\s+меня\s+по\s+шагам)/iu;

const GUIDE_SCREEN_CUE =
  /\b(this\s+page|this\s+screen|on\s+this\s+(?:page|screen)|what\s+am\s+i\s+looking\s+at|explain\s+what\s+i\s+(?:see|am\s+looking\s+at)|here\s+on\s+this)\b|(?:на\s+этой\s+странице|что\s+я\s+могу\s+сделать|այս\s+page(?:-ում|ում)?)/iu;

const DOMAIN_EXPLAIN_TOPIC_CUE =
  /\b(why\s+(?:is|are|does|do)|what\s+(?:currency|tax|vat|deposit|fee|charge|total|amount)|why\s+(?:does|do)\s+.+\s+(?:show|display|cost)|checkout\s+total|stripe\s+fee|gdpr|data\s+rights?|privacy\s+rights?|hipaa|retention\s+period|sub[- ]?processor|currency\s+(?:on|in|for)|prices?\s+(?:shown|displayed|in))\b/i;

const QUESTION_SHAPE =
  /\?|\b(what|why|how|where|which|explain|mean|means|help)\b|(?:ինչ|որտեղ|ինչպ(?:ե?՞?)?(?:ես|ս)|Что|Как|Где|Почему)/iu;

export function isAppGuideIntent(action: string): action is AppGuideIntent {
  return (APP_GUIDE_INTENTS as readonly string[]).includes(action);
}

export function isAppGuideSurrogateIntent(
  action: string,
): action is AppGuideSurrogateIntent {
  return (APP_GUIDE_SURROGATE_INTENTS as readonly string[]).includes(action);
}

export function isGuidePrefixedIntent(action: string): boolean {
  return action.startsWith('guide_');
}

export function isDomainExplainIntent(action: string): boolean {
  if (!action.startsWith('explain_')) return false;
  return !(APP_GUIDE_INTENTS as readonly string[]).includes(action);
}

export function getProductGuideIntentBucket(action: string): ProductGuideIntentBucket {
  if (
    isAppGuideIntent(action) ||
    isAppGuideSurrogateIntent(action) ||
    isGuidePrefixedIntent(action)
  ) {
    return 'guide';
  }
  if (isDomainExplainIntent(action)) {
    return 'domain_explain';
  }
  if (action && action !== 'unknown') {
    return 'action';
  }
  return 'unknown';
}

export function hasProductGuideNavigationCue(prompt: string): boolean {
  return GUIDE_NAVIGATION_CUE.test(prompt);
}

export function hasProductGuideScreenCue(prompt: string): boolean {
  return GUIDE_SCREEN_CUE.test(prompt);
}

function hasDomainExplainTopicCue(prompt: string): boolean {
  if (/\bwhat\s+does\s+.+\s+mean\b/i.test(prompt)) {
    return !isGuideUiFeatureMeaningPrompt(prompt);
  }
  return DOMAIN_EXPLAIN_TOPIC_CUE.test(prompt);
}

function isNavigationQuestionPrompt(prompt: string): boolean {
  return (
    (hasProductGuideNavigationCue(prompt) && isQuestionShaped(prompt)) ||
    GUIDE_WALKTHROUGH_CUE.test(prompt)
  );
}

export function hasExplicitMutateCue(prompt: string): boolean {
  if (isNavigationQuestionPrompt(prompt)) return false;
  if (!EXPLICIT_MUTATE_VERB.test(prompt)) return false;
  return isImperativeMutatePrompt(prompt) || hasConcreteMutateTarget(prompt);
}

function isImperativeMutatePrompt(prompt: string): boolean {
  const trimmed = prompt.trim();
  if (/^(please\s+)?(enable|disable|create|add|invite|book|schedule|cancel|reschedule|mark|delete|remove|set|keep|configure|assign|send|approve|deny|upload|release|notify|offer|accept|sign|report)\b/i.test(trimmed)) {
    return true;
  }
  return /\b(turn\s+on|turn\s+off)\b/i.test(trimmed) && !/^(where|how)\b/i.test(trimmed);
}

function hasConcreteMutateTarget(prompt: string): boolean {
  return (
    /\b(for|named|called|tomorrow|today|at\s+\d|@\d|\d{1,2}(?::\d{2})?\s*(?:am|pm)|next\s+(?:week|monday|tuesday|wednesday|thursday|friday|saturday|sunday))\b/i.test(
      prompt,
    ) ||
    /\b[A-Z][a-z]{2,}\b/.test(prompt)
  );
}

function isQuestionShaped(prompt: string): boolean {
  return QUESTION_SHAPE.test(prompt);
}

/** Infer routing bucket from prompt before or after classification. */
export function classifyPromptIntentBucket(
  prompt: string,
  options: ProductGuideRoutingOptions & { classifiedAction?: string } = {},
): ProductGuideIntentBucket {
  const trimmed = prompt.trim();
  if (!trimmed) return 'unknown';

  if (options.assistantMode === 'act') {
    if (hasExplicitMutateCue(trimmed)) return 'action';
    if (options.classifiedAction) {
      return getProductGuideIntentBucket(options.classifiedAction);
    }
    return 'unknown';
  }

  if (shouldForceProductGuideRouting(options.assistantMode)) {
    if (hasExplicitMutateCue(trimmed)) return 'action';
    if (
      hasDomainExplainTopicCue(trimmed) &&
      isQuestionShaped(trimmed) &&
      !isNavigationQuestionPrompt(trimmed)
    ) {
      return 'domain_explain';
    }
    return 'guide';
  }

  if (
    isGuideUiFeatureMeaningPrompt(trimmed) &&
    isQuestionShaped(trimmed)
  ) {
    return 'guide';
  }

  if (
    hasDomainExplainTopicCue(trimmed) &&
    isQuestionShaped(trimmed) &&
    !isNavigationQuestionPrompt(trimmed)
  ) {
    return 'domain_explain';
  }

  if (hasProductGuideScreenCue(trimmed) || isNavigationQuestionPrompt(trimmed)) {
    return 'guide';
  }

  if (hasExplicitMutateCue(trimmed)) {
    return 'action';
  }

  if (options.classifiedAction) {
    return getProductGuideIntentBucket(options.classifiedAction);
  }

  return 'unknown';
}

function rowMatchesMisclassifiedAction(
  row: ProductGuideDisambiguationRow,
  action: string,
): boolean {
  return typeof row.misclassifiedAction === 'string'
    ? row.misclassifiedAction === action
    : row.misclassifiedAction.test(action);
}

/**
 * Post-LLM rescue when a question-shaped prompt was classified as a mutate/read op
 * that should be handled by the product guide layer (ai-guide-1.0.5 prep).
 */
export function resolveProductGuideDisambiguation(
  prompt: string,
  classifiedAction: string,
  options: ProductGuideRoutingOptions = {},
): ProductGuideDisambiguationResult | null {
  if (!shouldApplyProductGuideRouting(options.assistantMode)) {
    return null;
  }

  if (hasExplicitMutateCue(prompt)) {
    return null;
  }

  if (
    hasDomainExplainTopicCue(prompt) &&
    !isNavigationQuestionPrompt(prompt)
  ) {
    return null;
  }

  for (const row of PRODUCT_GUIDE_DISAMBIGUATION_TABLE) {
    if (!rowMatchesMisclassifiedAction(row, classifiedAction)) continue;
    if (!row.promptCue.test(prompt)) continue;
    if (!isQuestionShaped(prompt) && row.preferredIntent !== 'explain_current_screen') {
      continue;
    }
    return {
      action: row.preferredIntent,
      rescueReason: row.rescueReason,
    };
  }

  const bucket = classifyPromptIntentBucket(prompt, {
    ...options,
    classifiedAction,
  });
  if (bucket !== 'guide') return null;

  const guideBucket = getProductGuideIntentBucket(classifiedAction);
  if (guideBucket === 'guide') return null;

  if (guideBucket === 'domain_explain' && hasDomainExplainTopicCue(prompt)) {
    return null;
  }

  if (
    guideBucket === 'action' &&
    (isProductGuidePrompt(prompt, options) ||
      shouldForceProductGuideRouting(options.assistantMode))
  ) {
    return {
      action: inferProductGuideIntentFromPrompt(prompt),
      rescueReason: isBulkMutateIntent(classifiedAction)
        ? 'product_guide_bulk_misroute'
        : shouldForceProductGuideRouting(options.assistantMode)
          ? 'assistant_mode_guide'
          : 'product_guide_question',
    };
  }

  return null;
}

export function lookupProductGuideDisambiguationRow(
  id: string,
): ProductGuideDisambiguationRow | undefined {
  return PRODUCT_GUIDE_DISAMBIGUATION_TABLE.find((row) => row.id === id);
}

/**
 * Bulk / multi-row mutates that require swipe confirm — must not execute on guide prompts (ai-guide-1.0.5).
 * Kept in sync with `bulkConfirmActions` in `ai-command.service.ts`.
 */
export const PRODUCT_GUIDE_BULK_MUTATE_ACTIONS = [
  'cancel_bookings',
  'update_bookings',
  'bulk_smart_cancel',
  'clear_schedule',
  'hide_appointments_from_calendar',
  'setup_week_schedule',
  'create_services',
  'mark_no_shows',
  'no_show_recovery',
  'payment_sweep',
  'day_replan',
  'sick_day_replan',
  'import_services_from_menu',
  'update_service_prices',
  'staff_service_matrix',
  'bulk_create_catalog',
  'merge_customers',
  'delete_customer_data',
  'admin_delete_customer_data',
  'privacy_delete',
] as const;

export type ProductGuideBulkMutateAction =
  (typeof PRODUCT_GUIDE_BULK_MUTATE_ACTIONS)[number];

const PRODUCT_GUIDE_BULK_MUTATE_SET = new Set<string>(
  PRODUCT_GUIDE_BULK_MUTATE_ACTIONS,
);

export function isBulkMutateIntent(action: string): action is ProductGuideBulkMutateAction {
  return PRODUCT_GUIDE_BULK_MUTATE_SET.has(action);
}

/**
 * pipe-1.5 / ai-guide-1.0.5 — post-classify misroute guard: "how do I…?" → guide, not bulk mutate.
 */
export function rescueProductGuideMisroute(
  prompt: string,
  classifiedAction: string,
  options: ProductGuideRoutingOptions = {},
): ProductGuideDisambiguationResult | null {
  return resolveProductGuideDisambiguation(prompt, classifiedAction, options);
}

/** Human-readable taxonomy summary for docs / classifier appendix (dashboard). */
export const PRODUCT_GUIDE_TAXONOMY_SUMMARY = `Product guide taxonomy (ai-guide-1.0.1):
- guide_user_flow / explain_app_feature / explain_current_screen / guide_* / booking_help → UI navigation and setup walkthroughs (AiProductGuideService).
- explain_* (except app-guide ids above) → domain explain handlers (tax, currency, checkout lines, compliance, tour/clinic semantics).
- All other intents → operational read/mutate actions; question-shaped navigation prompts must not execute bulk or destructive handlers without confirmation.`;
