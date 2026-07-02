import {
  EXPLAIN_HOME_SCREEN_WIDGET_PROMPTS,
  type ExplainHomeScreenWidgetAspect,
  type ExplainHomeScreenWidgetFixture,
} from './ai-explain-home-screen-widget.fixtures.js';
import { EXPLAIN_HOME_SCREEN_WIDGET_MULTILINGUAL_SCENARIOS } from './ai-explain-home-screen-widget-multilingual.fixtures.js';

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
): string[] {
  if (!ctx.widgetSupported) {
    return [
      'Home-screen widgets are available in the native iOS and Android consumer apps, not in the mobile browser.',
      'Install OptiSchedule Book from the app store, sign in, then add the widget from your phone home screen.',
    ];
  }
  const lines = [
    'Open your phone home screen widget picker and choose OptiSchedule Book.',
  ];
  if (ctx.platform === 'ios') {
    lines.push(
      'On iPhone: long-press the home screen → tap Add (+) → search OptiSchedule Book → add the widget.',
    );
  } else if (ctx.platform === 'android') {
    lines.push(
      'On Android: long-press the home screen → Widgets → find OptiSchedule Book → drag it onto your home screen.',
    );
  } else {
    lines.push(
      'On iPhone use the Add (+) widget gallery; on Android use the Widgets menu after a long-press on the home screen.',
    );
  }
  lines.push(
    'Stay signed in and open Account once so the app can sync your next visit and quick rebook snapshot.',
  );
  return lines;
}

export function buildWhatShowsLines(
  ctx: ConsumerHomeScreenWidgetExplainContext,
): string[] {
  const lines = [
    'The widget shows your salon name plus up to two tiles: Next appointment (widgetNextAppointment*) and Book again (widgetQuickRebook*).',
    'Tapping next appointment opens Account; tapping Book again opens booking with rebookSource=widget.',
  ];
  if (ctx.widgetAuthed === false) {
    lines.push(
      'You are signed out — the widget shows a sign-in prompt instead of visits.',
    );
  } else if (ctx.hasNextAppointment) {
    lines.push(
      ctx.nextServiceName
        ? `Your snapshot includes a next appointment${ctx.nextSubtitle ? ` (${ctx.nextSubtitle})` : ` for ${ctx.nextServiceName}`}.`
        : 'Your snapshot currently includes a next appointment.',
    );
  } else if (ctx.hasQuickRebook) {
    lines.push(
      'No upcoming visit is synced yet, but a quick rebook tile is available from your last completed booking.',
    );
  } else if (ctx.widgetAuthed) {
    lines.push(
      'You are signed in but no upcoming visit or completed rebook tile is synced yet — open Account to refresh bookings.',
    );
  }
  return lines;
}

export function buildNextAppointmentWidgetLines(
  ctx: ConsumerHomeScreenWidgetExplainContext,
): string[] {
  const lines = [
    'The Next appointment tile uses widgetNextAppointmentTitle and shows the nearest confirmed or pending future booking.',
    'It displays service, date, time, and provider, and opens your Account tab when tapped.',
  ];
  if (ctx.hasNextAppointment && ctx.nextServiceName) {
    lines.push(`Current snapshot service: ${ctx.nextServiceName}.`);
  } else if (!ctx.hasNextAppointment) {
    lines.push('No upcoming booking is in the widget snapshot right now.');
  }
  return lines;
}

export function buildQuickRebookWidgetLines(): string[] {
  return [
    'Book again on the widget comes from your most recent completed visit (widgetQuickRebook*).',
    'It deep-links into booking with the same service and rebookSource=widget so you can pick a new slot quickly.',
    'It is a shortcut — not the same as asking the assistant to rebook for you inside the app.',
  ];
}

export function buildSignedOutWidgetLines(): string[] {
  return [
    'When you are signed out, the widget shows widgetSignedOutTitle and widgetSignedOutSubtitle with a link to open the salon.',
    'Sign in on the consumer app and revisit Account so the widget snapshot can include your visits.',
  ];
}

export function buildHomeScreenWidgetHowItWorksLines(
  ctx: ConsumerHomeScreenWidgetExplainContext,
): string[] {
  const lines = [
    'The app builds a home_screen_widget_snapshot from your bookings and syncs it to iOS WidgetKit / Android App Widget on native platforms.',
    'Account and salon tabs refresh the snapshot when bookings change or the app returns to the foreground.',
  ];
  if (!ctx.widgetSupported) {
    lines.push(
      'Widgets require the installed native app — they are not available on web.',
    );
  }
  return lines;
}

export function assembleHomeScreenWidgetSummary(
  aspect: ExplainHomeScreenWidgetAspect,
  ctx: ConsumerHomeScreenWidgetExplainContext,
): string {
  let lines: string[];
  switch (aspect) {
    case 'add_to_home_screen':
      lines = buildAddToHomeScreenLines(ctx);
      break;
    case 'what_shows':
      lines = buildWhatShowsLines(ctx);
      break;
    case 'next_appointment':
      lines = buildNextAppointmentWidgetLines(ctx);
      break;
    case 'quick_rebook':
      lines = buildQuickRebookWidgetLines();
      break;
    case 'signed_out_state':
      lines = buildSignedOutWidgetLines();
      break;
    case 'how_it_works':
    default:
      lines = buildHomeScreenWidgetHowItWorksLines(ctx);
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
