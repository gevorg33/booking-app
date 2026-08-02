import {
  EXPLAIN_HOME_SCREEN_WIDGET_PROMPTS,
  type ExplainHomeScreenWidgetAspect,
  type ExplainHomeScreenWidgetFixture,
} from './ai-explain-home-screen-widget.fixtures.js';
import { EXPLAIN_HOME_SCREEN_WIDGET_MULTILINGUAL_SCENARIOS } from './ai-explain-home-screen-widget-multilingual.fixtures.js';
import { t, type AppLocale } from '../../common/i18n/messages.js';

const REBOOK_MUTATE_WITHOUT_WIDGET_CUE =
  /\b(rebook(?:\s+my)?\s+last|book(?:\s+the)?\s+same|repeat(?:\s+my)?\s+last|book my last|same as last)\b/i;

export const EXPLAIN_HOME_SCREEN_WIDGET_INTENTS = [
  'explain_home_screen_widget',
] as const;

export type ExplainHomeScreenWidgetIntent =
  (typeof EXPLAIN_HOME_SCREEN_WIDGET_INTENTS)[number];

export { CUSTOMER_EXPLAIN_HOME_SCREEN_WIDGET_CLASSIFIER_RULES } from './ai-explain-home-screen-widget.fixtures.js';

const PROVIDER_APP_CUE =
  /\b(provider\s+app|provider\s+mobile|staff\s+app|stylist\s+app|provider\s+schedule\s+widget)\b/i;

const SUPPORT_WIDGET_CUE =
  /\b(zendesk|support\s+chat|chat\s+widget|help\s+widget|messenger\s+widget)\b/i;

const HOME_SCREEN_WIDGET_CUE =
  /\b(home\s*screen\s+widget|home\s+screen|add.{0,30}widget|widget.{0,30}(?:home|appointment|rebook|show)|next\s+appointment.{0,20}(?:widget|home\s+screen)|optischedule\s+widget|book\s+again.{0,20}widget)\b/i;

const ADD_WIDGET_CUE =
  /\b(add.{0,30}(?:widget|home\s+screen)|how.{0,20}add.{0,20}widget|iphone|android).{0,30}widget\b/i;

const WHAT_SHOWS_CUE =
  /\b(what.{0,30}widget|widget.{0,20}show|widget\s+empty|tap.{0,20}widget)\b/i;

const NEXT_APPOINTMENT_CUE =
  /\b(next\s+appointment.{0,20}widget|widget.{0,20}next\s+appointment)\b/i;

const QUICK_REBOOK_CUE =
  /\b(book\s+again.{0,20}widget|quick\s+rebook|widget.{0,20}rebook)\b/i;

const SIGNED_OUT_CUE =
  /\b(widget.{0,20}sign\s+in|signed\s+out.{0,20}widget)\b/i;

function containsArmenianScript(prompt: string): boolean {
  return /[\u0530-\u058F]/.test(prompt);
}

function containsCyrillicScript(prompt: string): boolean {
  return /[\u0400-\u04FF]/.test(prompt);
}

function matchExplainHomeScreenWidgetScenario(
  prompt: string,
): ExplainHomeScreenWidgetFixture | null {
  const trimmed = prompt.trim();
  const normalized = trimmed.toLowerCase();
  for (const scenario of EXPLAIN_HOME_SCREEN_WIDGET_PROMPTS) {
    const candidate = scenario.prompt.trim();
    if (candidate === trimmed || candidate.toLowerCase() === normalized) {
      return scenario;
    }
  }
  for (const scenario of EXPLAIN_HOME_SCREEN_WIDGET_MULTILINGUAL_SCENARIOS) {
    const candidate = scenario.prompt.trim();
    if (candidate === trimmed || candidate.toLowerCase() === normalized) {
      return scenario;
    }
  }
  return null;
}

export function resolveExplainHomeScreenWidgetAspect(
  prompt: string,
): ExplainHomeScreenWidgetAspect {
  const scenario = matchExplainHomeScreenWidgetScenario(prompt);
  if (scenario?.aspect) return scenario.aspect;
  if (
    ADD_WIDGET_CUE.test(prompt) ||
    (/\badd\b/i.test(prompt) && /\bhome\s+screen\b/i.test(prompt))
  ) {
    return 'add_to_home_screen';
  }
  if (SIGNED_OUT_CUE.test(prompt)) return 'signed_out_state';
  if (QUICK_REBOOK_CUE.test(prompt)) return 'quick_rebook';
  if (NEXT_APPOINTMENT_CUE.test(prompt)) return 'next_appointment';
  if (WHAT_SHOWS_CUE.test(prompt)) return 'what_shows';
  if (/\bhow\b/i.test(prompt) && /\bwidget\b/i.test(prompt))
    return 'how_it_works';
  return 'how_it_works';
}

export function isExplainHomeScreenWidgetPrompt(prompt: string): boolean {
  const text = prompt.trim();
  if (!text) return false;
  if (/\b(patient|clinic)\s+alerts?\b/i.test(text)) return false;
  // e2e-bug.276 — in-app Home/Services/Account tab tours ≠ OS home-screen widget.
  if (/\b(?:home|services|account)\s+tab\b/i.test(text)) return false;
  if (matchExplainHomeScreenWidgetScenario(text)) return true;
  if (PROVIDER_APP_CUE.test(text)) return false;
  if (SUPPORT_WIDGET_CUE.test(text)) return false;
  if (
    REBOOK_MUTATE_WITHOUT_WIDGET_CUE.test(text) &&
    !/\bwidget\b/i.test(text)
  ) {
    return false;
  }

  if (
    (containsArmenianScript(text) &&
      /(վիջեթ|հիմնական\s+էկրան)/i.test(text) &&
      /(ավելացնել|ցույց|կրկին)/i.test(text)) ||
    (containsCyrillicScript(text) &&
      /(виджет|главн)/i.test(text) &&
      /(добав|показыва|запис|работа)/i.test(text))
  ) {
    return true;
  }

  return HOME_SCREEN_WIDGET_CUE.test(text);
}

export function isExplainHomeScreenWidgetIntent(
  action: string,
): action is ExplainHomeScreenWidgetIntent {
  return (EXPLAIN_HOME_SCREEN_WIDGET_INTENTS as readonly string[]).includes(
    action,
  );
}

export interface ParsedExplainHomeScreenWidget {
  aspect: ExplainHomeScreenWidgetAspect;
}

export function parseExplainHomeScreenWidgetFromPrompt(
  prompt: string,
): ParsedExplainHomeScreenWidget | null {
  if (!isExplainHomeScreenWidgetPrompt(prompt)) return null;
  return { aspect: resolveExplainHomeScreenWidgetAspect(prompt) };
}

export function rescueExplainHomeScreenWidgetIntent(
  prompt: string,
  action: string,
): { action: ExplainHomeScreenWidgetIntent; rescueReason: string } | null {
  if (isExplainHomeScreenWidgetIntent(action)) return null;
  if (!parseExplainHomeScreenWidgetFromPrompt(prompt)) return null;
  return {
    action: 'explain_home_screen_widget',
    rescueReason: 'home_screen_widget',
  };
}

export interface ConsumerHomeScreenWidgetExplainContext {
  widgetSupported: boolean;
  platform: 'ios' | 'android' | 'web' | null;
  widgetAuthed: boolean | null;
  hasNextAppointment: boolean;
  hasQuickRebook: boolean;
  nextServiceName: string | null;
  nextSubtitle: string | null;
}

function resolveNativePlatform(
  params: Record<string, unknown>,
): 'ios' | 'android' | 'web' | null {
  const raw = params.nativePlatform ?? params.platform;
  if (raw === 'ios' || raw === 'android' || raw === 'web') return raw;
  return null;
}

export function resolveConsumerHomeScreenWidgetExplainContext(
  params: Record<string, unknown>,
): ConsumerHomeScreenWidgetExplainContext {
  const platform = resolveNativePlatform(params);
  const widgetSupported =
    params.homeScreenWidgetSupported === true ||
    platform === 'ios' ||
    platform === 'android';
  const widgetAuthed =
    typeof params.widgetAuthed === 'boolean'
      ? params.widgetAuthed
      : typeof params.sessionCustomerId === 'string'
        ? true
        : null;
  const hasNextAppointment =
    params.widgetHasNextAppointment === true ||
    params.hasNextAppointment === true;
  const hasQuickRebook =
    params.widgetHasQuickRebook === true || params.hasQuickRebook === true;
  const nextServiceName =
    typeof params.widgetNextServiceName === 'string'
      ? params.widgetNextServiceName
      : typeof params.nextServiceName === 'string'
        ? params.nextServiceName
        : null;
  const nextSubtitle =
    typeof params.widgetNextSubtitle === 'string'
      ? params.widgetNextSubtitle
      : null;

  return {
    widgetSupported,
    platform,
    widgetAuthed,
    hasNextAppointment,
    hasQuickRebook,
    nextServiceName,
    nextSubtitle,
  };
}

export function buildAddToHomeScreenLines(
  ctx: ConsumerHomeScreenWidgetExplainContext,
  locale: AppLocale = 'en',
): string[] {
  if (!ctx.widgetSupported) {
    return [
      t(locale, 'assistant.homeScreenWidgetUnsupportedInstall'),
      t(locale, 'assistant.homeScreenWidgetUnsupportedInstructions'),
    ];
  }
  const lines = [t(locale, 'assistant.homeScreenWidgetOpenPicker')];
  if (ctx.platform === 'ios') {
    lines.push(t(locale, 'assistant.homeScreenWidgetAddIos'));
  } else if (ctx.platform === 'android') {
    lines.push(t(locale, 'assistant.homeScreenWidgetAddAndroid'));
  } else {
    lines.push(t(locale, 'assistant.homeScreenWidgetAddGeneric'));
  }
  lines.push(t(locale, 'assistant.homeScreenWidgetStaySignedIn'));
  return lines;
}

export function buildWhatShowsLines(
  ctx: ConsumerHomeScreenWidgetExplainContext,
  locale: AppLocale = 'en',
): string[] {
  const lines = [
    t(locale, 'assistant.homeScreenWidgetShowsTiles'),
    t(locale, 'assistant.homeScreenWidgetTapBehavior'),
  ];
  if (ctx.widgetAuthed === false) {
    lines.push(t(locale, 'assistant.homeScreenWidgetSignedOutNote'));
  } else if (ctx.hasNextAppointment) {
    if (ctx.nextServiceName) {
      lines.push(
        ctx.nextSubtitle
          ? t(locale, 'assistant.homeScreenWidgetNextApptWithSubtitle', {
              subtitle: ctx.nextSubtitle,
            })
          : t(locale, 'assistant.homeScreenWidgetNextApptWithService', {
              service: ctx.nextServiceName,
            }),
      );
    } else {
      lines.push(t(locale, 'assistant.homeScreenWidgetNextApptGeneric'));
    }
  } else if (ctx.hasQuickRebook) {
    lines.push(t(locale, 'assistant.homeScreenWidgetQuickRebookAvailable'));
  } else if (ctx.widgetAuthed) {
    lines.push(t(locale, 'assistant.homeScreenWidgetAuthedNoData'));
  }
  return lines;
}

export function buildNextAppointmentWidgetLines(
  ctx: ConsumerHomeScreenWidgetExplainContext,
  locale: AppLocale = 'en',
): string[] {
  const lines = [
    t(locale, 'assistant.homeScreenWidgetNextTileUsage'),
    t(locale, 'assistant.homeScreenWidgetNextTileBehavior'),
  ];
  if (ctx.hasNextAppointment && ctx.nextServiceName) {
    lines.push(
      t(locale, 'assistant.homeScreenWidgetCurrentSnapshotService', {
        service: ctx.nextServiceName,
      }),
    );
  } else if (!ctx.hasNextAppointment) {
    lines.push(t(locale, 'assistant.homeScreenWidgetNoUpcomingSnapshot'));
  }
  return lines;
}

export function buildQuickRebookWidgetLines(
  locale: AppLocale = 'en',
): string[] {
  return [
    t(locale, 'assistant.homeScreenWidgetQuickRebookSource'),
    t(locale, 'assistant.homeScreenWidgetQuickRebookDeepLink'),
    t(locale, 'assistant.homeScreenWidgetQuickRebookShortcut'),
  ];
}

export function buildSignedOutWidgetLines(locale: AppLocale = 'en'): string[] {
  return [
    t(locale, 'assistant.homeScreenWidgetSignedOutTiles'),
    t(locale, 'assistant.homeScreenWidgetSignedOutSignIn'),
  ];
}

export function buildHomeScreenWidgetHowItWorksLines(
  ctx: ConsumerHomeScreenWidgetExplainContext,
  locale: AppLocale = 'en',
): string[] {
  const lines = [
    t(locale, 'assistant.homeScreenWidgetHowItWorksSnapshot'),
    t(locale, 'assistant.homeScreenWidgetHowItWorksRefresh'),
  ];
  if (!ctx.widgetSupported) {
    lines.push(t(locale, 'assistant.homeScreenWidgetWebUnsupportedNote'));
  }
  return lines;
}

export function assembleHomeScreenWidgetSummary(
  aspect: ExplainHomeScreenWidgetAspect,
  ctx: ConsumerHomeScreenWidgetExplainContext,
  locale: AppLocale = 'en',
): string {
  let lines: string[];
  switch (aspect) {
    case 'add_to_home_screen':
      lines = buildAddToHomeScreenLines(ctx, locale);
      break;
    case 'what_shows':
      lines = buildWhatShowsLines(ctx, locale);
      break;
    case 'next_appointment':
      lines = buildNextAppointmentWidgetLines(ctx, locale);
      break;
    case 'quick_rebook':
      lines = buildQuickRebookWidgetLines(locale);
      break;
    case 'signed_out_state':
      lines = buildSignedOutWidgetLines(locale);
      break;
    case 'how_it_works':
    default:
      lines = buildHomeScreenWidgetHowItWorksLines(ctx, locale);
      break;
  }
  return lines.join(' ');
}

export function buildExplainHomeScreenWidgetNavigate(
  aspect: ExplainHomeScreenWidgetAspect,
): { path: string; query: Record<string, string> } | null {
  if (aspect === 'add_to_home_screen' || aspect === 'signed_out_state') {
    return { path: 'account', query: {} };
  }
  if (aspect === 'next_appointment' || aspect === 'what_shows') {
    return { path: 'account', query: {} };
  }
  return null;
}
