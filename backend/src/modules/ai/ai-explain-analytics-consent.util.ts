import {
  EXPLAIN_ANALYTICS_CONSENT_PROMPTS,
  type ExplainAnalyticsConsentAspect,
  type ExplainAnalyticsConsentFixture,
} from './ai-explain-analytics-consent.fixtures.js';
import { EXPLAIN_ANALYTICS_CONSENT_MULTILINGUAL_SCENARIOS } from './ai-explain-analytics-consent-multilingual.fixtures.js';
import { isExplainPushPermissionPrompt } from './ai-explain-push-permission.util.js';

export const EXPLAIN_ANALYTICS_CONSENT_INTENTS = [
  'explain_analytics_consent',
] as const;

export type ExplainAnalyticsConsentIntent =
  (typeof EXPLAIN_ANALYTICS_CONSENT_INTENTS)[number];

export { CUSTOMER_EXPLAIN_ANALYTICS_CONSENT_CLASSIFIER_RULES } from './ai-explain-analytics-consent.fixtures.js';

const PROVIDER_APP_CUE =
  /\b(provider\s+app|provider\s+mobile|staff\s+app|stylist\s+app)\b/i;

const DASHBOARD_ANALYTICS_CUE =
  /\b(revenue\s+analytics|dashboard\s+analytics|business\s+reports?|salon\s+analytics)\b/i;

const ANALYTICS_CONSENT_CUE =
  /\b(why.{0,40}(?:analytics|usage tracking|tracking)|turn off.{0,20}(?:tracking|analytics)|stop tracking|usage tracking|analytics consent|analytics banner|anonymous usage|decline analytics|accept analytics|what (?:usage )?data|collect.{0,20}analytics|personal data.{0,20}analytics)\b/i;

const TURN_OFF_CUE =
  /\b(turn off|stop|disable|decline|opt out).{0,30}(tracking|analytics|usage)\b/i;

const WHAT_TRACKED_CUE =
  /\b(what (?:usage )?data|what is tracked|collect.{0,20}(data|analytics)|anonymous|personal data)\b/i;

const CONSENT_PROMPT_CUE =
  /\b(analytics banner|consent (?:banner|prompt)|accept.{0,20}analytics|bottom banner)\b/i;

function containsArmenianScript(prompt: string): boolean {
  return /[\u0530-\u058F]/.test(prompt);
}

function containsCyrillicScript(prompt: string): boolean {
  return /[\u0400-\u04FF]/.test(prompt);
}

function matchExplainAnalyticsConsentScenario(
  prompt: string,
): ExplainAnalyticsConsentFixture | null {
  const trimmed = prompt.trim();
  const normalized = trimmed.toLowerCase();
  for (const scenario of EXPLAIN_ANALYTICS_CONSENT_PROMPTS) {
    const candidate = scenario.prompt.trim();
    if (candidate === trimmed || candidate.toLowerCase() === normalized) {
      return scenario;
    }
  }
  for (const scenario of EXPLAIN_ANALYTICS_CONSENT_MULTILINGUAL_SCENARIOS) {
    const candidate = scenario.prompt.trim();
    if (candidate === trimmed || candidate.toLowerCase() === normalized) {
      return scenario;
    }
  }
  return null;
}

export function resolveExplainAnalyticsConsentAspect(
  prompt: string,
): ExplainAnalyticsConsentAspect {
  const scenario = matchExplainAnalyticsConsentScenario(prompt);
  if (scenario?.aspect) return scenario.aspect;
  if (TURN_OFF_CUE.test(prompt)) return 'turn_off_tracking';
  if (WHAT_TRACKED_CUE.test(prompt)) return 'what_is_tracked';
  if (CONSENT_PROMPT_CUE.test(prompt)) return 'consent_prompt';
  if (/\bwhy\b/i.test(prompt) && /\b(analytics|tracking)\b/i.test(prompt)) {
    return 'why_consent';
  }
  return 'how_it_works';
}

export function isExplainAnalyticsConsentPrompt(prompt: string): boolean {
  const text = prompt.trim();
  if (!text) return false;
  if (matchExplainAnalyticsConsentScenario(text)) return true;
  if (isExplainPushPermissionPrompt(text)) return false;
  if (PROVIDER_APP_CUE.test(text)) return false;
  if (DASHBOARD_ANALYTICS_CUE.test(text)) return false;

  if (
    (containsArmenianScript(text) &&
      /(վերլուծ|հետևում|անջատ)/i.test(text) &&
      /(հարցնում|օգտագործման|տվյալ)/i.test(text)) ||
    (containsCyrillicScript(text) &&
      /(аналитик|отслежив|использован)/i.test(text) &&
      /(спрашива|отключ|данн|аноним)/i.test(text))
  ) {
    return true;
  }

  return ANALYTICS_CONSENT_CUE.test(text);
}

export function isExplainAnalyticsConsentIntent(
  action: string,
): action is ExplainAnalyticsConsentIntent {
  return (EXPLAIN_ANALYTICS_CONSENT_INTENTS as readonly string[]).includes(
    action,
  );
}

export interface ParsedExplainAnalyticsConsent {
  aspect: ExplainAnalyticsConsentAspect;
}

export function parseExplainAnalyticsConsentFromPrompt(
  prompt: string,
): ParsedExplainAnalyticsConsent | null {
  if (!isExplainAnalyticsConsentPrompt(prompt)) return null;
  return { aspect: resolveExplainAnalyticsConsentAspect(prompt) };
}

export function rescueExplainAnalyticsConsentIntent(
  prompt: string,
  action: string,
): { action: ExplainAnalyticsConsentIntent; rescueReason: string } | null {
  if (isExplainAnalyticsConsentIntent(action)) return null;
  if (!parseExplainAnalyticsConsentFromPrompt(prompt)) return null;
  return {
    action: 'explain_analytics_consent',
    rescueReason: 'analytics_consent',
  };
}

export type AnalyticsConsentState = 'granted' | 'denied' | 'pending';

export interface ConsumerAnalyticsConsentExplainContext {
  consentState: AnalyticsConsentState;
  consentPending: boolean;
  trackingEnabled: boolean;
}

export function resolveAnalyticsConsentState(
  params: Record<string, unknown>,
): AnalyticsConsentState {
  if (
    params.analyticsConsent === true ||
    params.analyticsConsentGranted === true
  ) {
    return 'granted';
  }
  if (
    params.analyticsConsent === false ||
    params.analyticsConsentDenied === true
  ) {
    return 'denied';
  }
  if (
    params.analyticsConsentPending === true ||
    params.analyticsConsent === null
  ) {
    return 'pending';
  }
  if (params.analyticsConsent === 'granted') return 'granted';
  if (params.analyticsConsent === 'denied') return 'denied';
  if (params.analyticsConsent === 'pending') return 'pending';
  return 'pending';
}

export function resolveConsumerAnalyticsConsentExplainContext(
  params: Record<string, unknown>,
): ConsumerAnalyticsConsentExplainContext {
  const consentState = resolveAnalyticsConsentState(params);
  return {
    consentState,
    consentPending: consentState === 'pending',
    trackingEnabled: consentState === 'granted',
  };
}

export function buildWhyConsentLines(
  ctx: ConsumerAnalyticsConsentExplainContext,
): string[] {
  const lines = [
    'The consumer app asks once for anonymous usage analytics so we can improve booking flows, crashes, and performance.',
    'The banner uses analyticsConsent* copy — Accept sends batched events to POST /events/app; Decline keeps the app working without usage tracking.',
  ];
  if (ctx.consentPending) {
    lines.push(
      'You have not chosen yet — the consent banner should be visible at the bottom of the app.',
    );
  } else if (ctx.trackingEnabled) {
    lines.push('You already accepted analytics on this device.');
  } else {
    lines.push('You previously declined analytics — usage tracking stays off.');
  }
  return lines;
}

export function buildTurnOffTrackingLines(
  ctx: ConsumerAnalyticsConsentExplainContext,
): string[] {
  if (ctx.consentState === 'denied') {
    return [
      'Usage tracking is already off on this device.',
      'We do not send analytics events after you tap Decline on the consent banner.',
    ];
  }
  const lines = [
    'Tap Decline on the analytics consent banner to turn off usage tracking.',
    'If you already accepted, ask me to decline analytics and I can switch tracking off for this device.',
  ];
  if (ctx.consentPending) {
    lines.push(
      'The consent prompt is showing now — choose Decline to opt out before any events flush.',
    );
  }
  return lines;
}

export function buildWhatIsTrackedLines(): string[] {
  return [
    'Analytics covers anonymous app usage such as app opens, booking steps, and crash-free session markers.',
    'Events use a random anonId in local storage — not your name, phone, or booking details.',
    'No personal data is collected beyond coarse device, locale, app version, and tenant slug when you browse a salon.',
  ];
}

export function buildConsentPromptLines(
  ctx: ConsumerAnalyticsConsentExplainContext,
): string[] {
  const lines = [
    'On first launch the app shows a bottom consent dialog with Accept and Decline.',
    'Accept enables batched anonymous events; Decline stores your choice and skips tracking.',
  ];
  if (ctx.consentPending) {
    lines.push(
      'The prompt is active right now because no choice is saved yet.',
    );
  } else if (ctx.trackingEnabled) {
    lines.push(
      'You already accepted — the banner will not appear again unless app data is cleared.',
    );
  } else {
    lines.push('You already declined — the banner stays hidden.');
  }
  return lines;
}

export function buildAnalyticsConsentHowItWorksLines(
  ctx: ConsumerAnalyticsConsentExplainContext,
): string[] {
  const lines = [
    'Consent is stored locally under app-analytics-consent as granted or denied.',
    'Only after Accept does the app queue events like app_opened and booking funnel steps for POST /events/app.',
  ];
  if (ctx.consentPending) {
    lines.push('Status now: pending — choose Accept or Decline on the banner.');
  } else {
    lines.push(`Status now: ${ctx.consentState}.`);
  }
  return lines;
}

export function assembleAnalyticsConsentSummary(
  aspect: ExplainAnalyticsConsentAspect,
  ctx: ConsumerAnalyticsConsentExplainContext,
): string {
  let lines: string[];
  switch (aspect) {
    case 'why_consent':
      lines = buildWhyConsentLines(ctx);
      break;
    case 'turn_off_tracking':
      lines = buildTurnOffTrackingLines(ctx);
      break;
    case 'what_is_tracked':
      lines = buildWhatIsTrackedLines();
      break;
    case 'consent_prompt':
      lines = buildConsentPromptLines(ctx);
      break;
    case 'how_it_works':
    default:
      lines = buildAnalyticsConsentHowItWorksLines(ctx);
      break;
  }
  return lines.join(' ');
}

export function shouldDeclineConsumerAnalyticsConsent(
  aspect: ExplainAnalyticsConsentAspect,
  ctx: ConsumerAnalyticsConsentExplainContext,
): boolean {
  return aspect === 'turn_off_tracking' && ctx.consentState !== 'denied';
}
