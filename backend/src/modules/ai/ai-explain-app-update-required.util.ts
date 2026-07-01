import {
  EXPLAIN_APP_UPDATE_REQUIRED_PROMPTS,
  type ExplainAppUpdateRequiredAspect,
  type ExplainAppUpdateRequiredFixture,
} from './ai-explain-app-update-required.fixtures.js';
import { EXPLAIN_APP_UPDATE_REQUIRED_MULTILINGUAL_SCENARIOS } from './ai-explain-app-update-required-multilingual.fixtures.js';
import {
  resolveMobileAppConfig,
  type MobileAppPlatform,
  type MobileAppSurface,
} from '../../common/utils/mobile-app-config.util.js';

export const EXPLAIN_APP_UPDATE_REQUIRED_INTENTS = [
  'explain_app_update_required',
] as const;

export type ExplainAppUpdateRequiredIntent =
  (typeof EXPLAIN_APP_UPDATE_REQUIRED_INTENTS)[number];

export { CUSTOMER_EXPLAIN_APP_UPDATE_REQUIRED_CLASSIFIER_RULES } from './ai-explain-app-update-required.fixtures.js';

const PROVIDER_APP_CUE =
  /\b(provider\s+app|provider\s+mobile|staff\s+app|stylist\s+app)\b/i;

const OS_SYSTEM_UPDATE_CUE =
  /\b(update\s+(?:ios|iphone|android|my\s+phone|operating\s+system)|ios\s+update\s+on\s+my\s+phone)\b/i;

const APP_GATE_CUE =
  /\b(why.{0,40}(?:update|must i update)|skip.{0,20}update|not now.{0,30}(?:update|banner)|update required|app version|version (?:unavailable|blocked|gate)|kill switch|newer version|minimum.{0,20}version|app store.{0,20}update|update nudge|temporarily unavailable|dismiss.{0,20}nudge|blocked.{0,20}update)\b/i;

const SKIP_NUDGE_CUE =
  /\b(skip.{0,20}update|not now|dismiss.{0,20}(?:nudge|banner)|hide.{0,20}update)\b/i;

const KILL_SWITCH_CUE =
  /\b(kill switch|temporarily unavailable|version unavailable|unavailable.{0,20}version)\b/i;

const UPDATE_REQUIRED_CUE =
  /\b(update required|can't book.{0,20}version|blocked.{0,20}update|minimum.{0,20}version|must i update)\b/i;

const UPDATE_NUDGE_CUE =
  /\b(newer version|update nudge|banner.{0,20}version|app store.{0,20}update)\b/i;

function containsArmenianScript(prompt: string): boolean {
  return /[\u0530-\u058F]/.test(prompt);
}

function containsCyrillicScript(prompt: string): boolean {
  return /[\u0400-\u04FF]/.test(prompt);
}

function parseSemver(version: string): [number, number, number] | null {
  const match = version.trim().match(/^(\d+)\.(\d+)\.(\d+)/);
  if (!match) return null;
  return [Number(match[1]), Number(match[2]), Number(match[3])];
}

function compareSemver(a: string, b: string): number | null {
  const parsedA = parseSemver(a);
  const parsedB = parseSemver(b);
  if (!parsedA || !parsedB) return null;
  for (let i = 0; i < 3; i += 1) {
    if (parsedA[i] > parsedB[i]) return 1;
    if (parsedA[i] < parsedB[i]) return -1;
  }
  return 0;
}

function isVersionBelowMinimum(current: string, minimum: string): boolean {
  const cmp = compareSemver(current, minimum);
  if (cmp == null) return false;
  return cmp < 0;
}

function matchExplainAppUpdateRequiredScenario(
  prompt: string,
): ExplainAppUpdateRequiredFixture | null {
  const trimmed = prompt.trim();
  const normalized = trimmed.toLowerCase();
  for (const scenario of EXPLAIN_APP_UPDATE_REQUIRED_PROMPTS) {
    const candidate = scenario.prompt.trim();
    if (candidate === trimmed || candidate.toLowerCase() === normalized) {
      return scenario;
    }
  }
  for (const scenario of EXPLAIN_APP_UPDATE_REQUIRED_MULTILINGUAL_SCENARIOS) {
    const candidate = scenario.prompt.trim();
    if (candidate === trimmed || candidate.toLowerCase() === normalized) {
      return scenario;
    }
  }
  return null;
}

export function resolveExplainAppUpdateRequiredAspect(
  prompt: string,
): ExplainAppUpdateRequiredAspect {
  const scenario = matchExplainAppUpdateRequiredScenario(prompt);
  if (scenario?.aspect) return scenario.aspect;
  if (SKIP_NUDGE_CUE.test(prompt)) return 'skip_nudge';
  if (KILL_SWITCH_CUE.test(prompt)) return 'kill_switch';
  if (UPDATE_REQUIRED_CUE.test(prompt)) return 'update_required';
  if (UPDATE_NUDGE_CUE.test(prompt)) return 'update_nudge';
  if (/\bwhy\b/i.test(prompt) && /\bupdate\b/i.test(prompt))
    return 'why_update';
  return 'how_it_works';
}

export function isExplainAppUpdateRequiredPrompt(prompt: string): boolean {
  const text = prompt.trim();
  if (!text) return false;
  if (matchExplainAppUpdateRequiredScenario(text)) return true;
  if (PROVIDER_APP_CUE.test(text)) return false;
  if (OS_SYSTEM_UPDATE_CUE.test(text)) return false;
  if (/\boffline\b/i.test(text) && !/\bupdate\b/i.test(text)) return false;

  if (
    (containsArmenianScript(text) &&
      /(թարմաց|բաց թողնել|արգելափակ)/i.test(text) &&
      /(հավելված|տարբերակ)/i.test(text)) ||
    (containsCyrillicScript(text) &&
      /(обнов|пропуст|недоступ|верси)/i.test(text) &&
      /(приложен|верси)/i.test(text))
  ) {
    return true;
  }

  return APP_GATE_CUE.test(text);
}

export function isExplainAppUpdateRequiredIntent(
  action: string,
): action is ExplainAppUpdateRequiredIntent {
  return (EXPLAIN_APP_UPDATE_REQUIRED_INTENTS as readonly string[]).includes(
    action,
  );
}

export interface ParsedExplainAppUpdateRequired {
  aspect: ExplainAppUpdateRequiredAspect;
}

export function parseExplainAppUpdateRequiredFromPrompt(
  prompt: string,
): ParsedExplainAppUpdateRequired | null {
  if (!isExplainAppUpdateRequiredPrompt(prompt)) return null;
  return { aspect: resolveExplainAppUpdateRequiredAspect(prompt) };
}

export function rescueExplainAppUpdateRequiredIntent(
  prompt: string,
  action: string,
): { action: ExplainAppUpdateRequiredIntent; rescueReason: string } | null {
  if (isExplainAppUpdateRequiredIntent(action)) return null;
  if (!parseExplainAppUpdateRequiredFromPrompt(prompt)) return null;
  return {
    action: 'explain_app_update_required',
    rescueReason: 'app_update_gate',
  };
}

export interface AppUpdateGateConfigView {
  minSupportedVersion: string;
  latestVersion: string;
  updateRequired: boolean;
  killSwitch: boolean;
  message: string | null;
  storeUrl: string | null;
}

export interface ConsumerAppUpdateExplainContext {
  currentVersion: string;
  platform: MobileAppPlatform | null;
  config: AppUpdateGateConfigView | null;
  blocked: boolean;
  blockedReason: 'kill_switch' | 'update_required' | null;
  nudgeVisible: boolean;
  nudgeDismissed: boolean;
}

function resolveNativePlatform(
  params: Record<string, unknown>,
): MobileAppPlatform | null {
  const raw = params.nativePlatform ?? params.platform;
  if (raw === 'ios' || raw === 'android' || raw === 'web') return raw;
  return null;
}

function resolveCurrentVersion(params: Record<string, unknown>): string {
  const raw = params.appVersion ?? params.currentVersion ?? params.version;
  if (typeof raw === 'string' && raw.trim()) return raw.trim();
  return '1.0.0';
}

function evaluateAppGate(input: {
  currentVersion: string;
  config: AppUpdateGateConfigView;
}): {
  blocked: boolean;
  blockedReason: 'kill_switch' | 'update_required' | null;
} {
  if (input.config.killSwitch) {
    return { blocked: true, blockedReason: 'kill_switch' };
  }
  if (
    input.config.updateRequired ||
    isVersionBelowMinimum(
      input.currentVersion,
      input.config.minSupportedVersion,
    )
  ) {
    return { blocked: true, blockedReason: 'update_required' };
  }
  return { blocked: false, blockedReason: null };
}

function shouldShowUpdateNudge(input: {
  currentVersion: string;
  config: AppUpdateGateConfigView;
  nudgeDismissed: boolean;
}): boolean {
  if (input.config.killSwitch || input.config.updateRequired) return false;
  if (
    isVersionBelowMinimum(
      input.currentVersion,
      input.config.minSupportedVersion,
    )
  ) {
    return false;
  }
  if (
    !isVersionBelowMinimum(input.currentVersion, input.config.latestVersion)
  ) {
    return false;
  }
  return !input.nudgeDismissed;
}

export function resolveConsumerAppUpdateExplainContext(
  params: Record<string, unknown>,
): ConsumerAppUpdateExplainContext {
  const currentVersion = resolveCurrentVersion(params);
  const platform = resolveNativePlatform(params);
  const nudgeDismissed =
    params.appGateNudgeDismissed === true || params.nudgeDismissed === true;

  let config: AppUpdateGateConfigView | null = null;
  if (platform === 'ios' || platform === 'android') {
    const surface: MobileAppSurface = 'consumer_app';
    config = resolveMobileAppConfig({
      surface,
      platform,
      version: currentVersion,
    });
  }

  if (!config) {
    return {
      currentVersion,
      platform,
      config: null,
      blocked: false,
      blockedReason: null,
      nudgeVisible: false,
      nudgeDismissed,
    };
  }

  const gate = evaluateAppGate({ currentVersion, config });
  const nudgeVisible = shouldShowUpdateNudge({
    currentVersion,
    config,
    nudgeDismissed,
  });

  return {
    currentVersion,
    platform,
    config,
    blocked: gate.blocked,
    blockedReason: gate.blockedReason,
    nudgeVisible,
    nudgeDismissed,
  };
}

export function buildWhyUpdateLines(
  ctx: ConsumerAppUpdateExplainContext,
): string[] {
  const lines = [
    'The consumer app checks your build against the salon platform minimum version from GET /mobile-app/config.',
  ];
  if (ctx.config) {
    lines.push(
      `Your version is ${ctx.currentVersion}. Minimum supported is ${ctx.config.minSupportedVersion}; latest is ${ctx.config.latestVersion}.`,
    );
  }
  if (ctx.blockedReason === 'update_required') {
    lines.push(
      'This build is below the minimum or flagged updateRequired — booking is blocked until you install a supported version from the app store.',
    );
  } else if (ctx.nudgeVisible) {
    lines.push(
      'A newer supported build exists. You can keep using this version for now, but updating is recommended for fixes and features.',
    );
  } else if (!ctx.blocked) {
    lines.push(
      'Your current build meets the minimum — no hard update block is active right now.',
    );
  }
  return lines;
}

export function buildSkipNudgeLines(
  ctx: ConsumerAppUpdateExplainContext,
): string[] {
  const lines = [
    '"Not now" on the update banner dismisses the soft nudge for this app session only.',
    'It does not bypass a hard update-required or kill-switch screen — those still need a store update.',
  ];
  if (ctx.nudgeDismissed) {
    lines.push(
      'You already dismissed the nudge for this latest-version prompt in this session.',
    );
  } else if (ctx.nudgeVisible) {
    lines.push(
      'The nudge is visible now — tap Not now to hide it until you restart the app.',
    );
  } else if (ctx.blocked) {
    lines.push(
      'You are on a blocking screen, not the dismissible nudge — install the update from the store.',
    );
  }
  return lines;
}

export function buildKillSwitchLines(
  ctx: ConsumerAppUpdateExplainContext,
): string[] {
  const lines = [
    'Kill switch means this app build is temporarily disabled for all users on your platform.',
    'Update from the store when a fixed build is available, or try again later if the team is rolling out a release.',
  ];
  if (ctx.config?.message) {
    lines.push(ctx.config.message);
  }
  if (ctx.blockedReason === 'kill_switch') {
    lines.push('Your device is currently blocked by the kill switch gate.');
  }
  return lines;
}

export function buildUpdateRequiredLines(
  ctx: ConsumerAppUpdateExplainContext,
): string[] {
  const lines = [
    'Update required means your installed build is below the minimum supported version or flagged as unsafe to use.',
    'Install the latest consumer app from the app store link on the gate screen to continue booking.',
  ];
  if (ctx.config) {
    lines.push(
      `Minimum supported: ${ctx.config.minSupportedVersion}. You are on ${ctx.currentVersion}.`,
    );
  }
  if (ctx.blockedReason === 'update_required') {
    lines.push(
      'You are blocked until you update — the rest of the app stays behind AppVersionGate.',
    );
  }
  return lines;
}

export function buildUpdateNudgeLines(
  ctx: ConsumerAppUpdateExplainContext,
): string[] {
  const lines = [
    'The soft update nudge appears when a newer build exists but your version is still supported.',
    'Tap Update to open the store, or Not now to hide the banner for this session.',
  ];
  if (ctx.nudgeVisible) {
    lines.push(
      'The nudge banner should be visible at the top of the app right now.',
    );
  } else if (ctx.nudgeDismissed) {
    lines.push(
      'You dismissed the nudge — it returns after a fresh app launch when a newer build is still available.',
    );
  } else if (ctx.blocked) {
    lines.push('A hard gate is active instead of the soft nudge.');
  }
  return lines;
}

export function buildAppUpdateHowItWorksLines(
  ctx: ConsumerAppUpdateExplainContext,
): string[] {
  const lines = [
    'AppVersionGate loads remote config (min version, latest version, kill switch) and compares it to your installed build.',
    'Hard blocks stop booking; soft nudges are dismissible per session.',
  ];
  if (ctx.config) {
    lines.push(
      `Config snapshot: min ${ctx.config.minSupportedVersion}, latest ${ctx.config.latestVersion}, killSwitch=${ctx.config.killSwitch}, updateRequired=${ctx.config.updateRequired}.`,
    );
  }
  if (ctx.blockedReason) {
    lines.push(`Active gate: ${ctx.blockedReason}.`);
  } else if (ctx.nudgeVisible) {
    lines.push('Active gate: soft update nudge.');
  }
  return lines;
}

export function assembleAppUpdateRequiredSummary(
  aspect: ExplainAppUpdateRequiredAspect,
  ctx: ConsumerAppUpdateExplainContext,
): string {
  let lines: string[];
  switch (aspect) {
    case 'why_update':
      lines = buildWhyUpdateLines(ctx);
      break;
    case 'skip_nudge':
      lines = buildSkipNudgeLines(ctx);
      break;
    case 'kill_switch':
      lines = buildKillSwitchLines(ctx);
      break;
    case 'update_required':
      lines = buildUpdateRequiredLines(ctx);
      break;
    case 'update_nudge':
      lines = buildUpdateNudgeLines(ctx);
      break;
    case 'how_it_works':
    default:
      lines = buildAppUpdateHowItWorksLines(ctx);
      break;
  }
  return lines.join(' ');
}

export function shouldDismissConsumerAppUpdateNudge(
  aspect: ExplainAppUpdateRequiredAspect,
  ctx: ConsumerAppUpdateExplainContext,
): boolean {
  return aspect === 'skip_nudge' && ctx.nudgeVisible && !ctx.blocked;
}
