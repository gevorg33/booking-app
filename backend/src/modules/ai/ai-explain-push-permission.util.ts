import {
  EXPLAIN_PUSH_PERMISSION_PROMPTS,
  type ExplainPushPermissionAspect,
  type ExplainPushPermissionFixture,
} from './ai-explain-push-permission.fixtures.js';
import { EXPLAIN_PUSH_PERMISSION_MULTILINGUAL_SCENARIOS } from './ai-explain-push-permission-multilingual.fixtures.js';
import { isCustomerEnablePushNotificationsPrompt } from './ai-customer-enable-push-notifications.util.js';
import { isExplainPushSetupPrompt } from './ai-provider-push-setup.util.js';
import {
  N99_PUSH_PERMISSION_STATES,
  N99_PUSH_REACHABLE_STATES,
  type N99PushPermissionState,
} from '../../common/utils/n99-push-reachability.fixtures.js';

export const EXPLAIN_PUSH_PERMISSION_INTENTS = [
  'explain_push_permission',
] as const;

export type ExplainPushPermissionIntent =
  (typeof EXPLAIN_PUSH_PERMISSION_INTENTS)[number];

export { CUSTOMER_EXPLAIN_PUSH_PERMISSION_CLASSIFIER_RULES } from './ai-explain-push-permission.fixtures.js';

const SALON_POLICY_CUE =
  /\b(what (?:notifications?|reminders?) will|will (?:you|the salon) send|do i get (?:email|sms|whatsapp)|salon (?:sends?|channels?)|24\s*-?\s*h reminder policy)\b/i;

const PERMISSION_TROUBLESHOOT_CUE =
  /\b(why (?:didn'?t|did not|don'?t|do not) (?:i )?(?:get|receive)|didn'?t (?:get|receive)|missed (?:my )?(?:push|alert|notification)|blocked on my phone|denied push|turn it back on|notification settings|system settings|open settings|provisional push|quiet notifications?|post_notifications|post notifications|android (?:13|asks|permission)|fix push permissions?|permissions? (?:blocked|denied))\b/i;

const OPEN_SETTINGS_CUE =
  /\b(open|take me to|go to|show).{0,30}(notification settings|system settings|phone settings|app settings)\b/i;

const PROVISIONAL_CUE =
  /\b(provisional|quiet notifications?|deliver quietly|iphone notifications? quiet)\b/i;

const ANDROID_PERMISSION_CUE =
  /\b(android|post_notifications|post notifications|android 13)\b/i;

const DENIED_CUE = /\b(blocked|denied|turned off|turn it back on|re-?ask)\b/i;

function containsArmenianScript(prompt: string): boolean {
  return /[\u0530-\u058F]/.test(prompt);
}

function containsCyrillicScript(prompt: string): boolean {
  return /[\u0400-\u04FF]/.test(prompt);
}

function matchExplainPushPermissionScenario(
  prompt: string,
): ExplainPushPermissionFixture | null {
  const trimmed = prompt.trim();
  const normalized = trimmed.toLowerCase();
  for (const scenario of EXPLAIN_PUSH_PERMISSION_PROMPTS) {
    const candidate = scenario.prompt.trim();
    if (candidate === trimmed || candidate.toLowerCase() === normalized) {
      return scenario;
    }
  }
  for (const scenario of EXPLAIN_PUSH_PERMISSION_MULTILINGUAL_SCENARIOS) {
    const candidate = scenario.prompt.trim();
    if (candidate === trimmed || candidate.toLowerCase() === normalized) {
      return scenario;
    }
  }
  return null;
}

export function resolveExplainPushPermissionAspect(
  prompt: string,
): ExplainPushPermissionAspect {
  const scenario = matchExplainPushPermissionScenario(prompt);
  if (scenario?.aspect) return scenario.aspect;
  if (OPEN_SETTINGS_CUE.test(prompt)) return 'open_settings';
  if (PROVISIONAL_CUE.test(prompt)) return 'provisional';
  if (
    ANDROID_PERMISSION_CUE.test(prompt) &&
    /\b(permission|allow|why|post)\b/i.test(prompt)
  ) {
    return 'android_permission';
  }
  if (DENIED_CUE.test(prompt)) return 'denied_reask';
  if (
    /\bwhy\b/i.test(prompt) &&
    /\b(notification|push|alert|reminder)\b/i.test(prompt)
  ) {
    return 'missing_notification';
  }
  return 'how_it_works';
}

export function isExplainPushPermissionPrompt(prompt: string): boolean {
  const text = prompt.trim();
  if (!text) return false;
  if (matchExplainPushPermissionScenario(text)) return true;
  if (isCustomerEnablePushNotificationsPrompt(text)) return false;
  if (isExplainPushSetupPrompt(text)) return false;
  if (/\bprovider\s+app\b/i.test(text)) return false;
  if (SALON_POLICY_CUE.test(text) && !PERMISSION_TROUBLESHOOT_CUE.test(text)) {
    return false;
  }

  if (
    (containsArmenianScript(text) &&
      /(ինչու|չստաց|արգելափակ|կարգավորում)/i.test(text) &&
      /(ծանուց|push|հեռախոս)/i.test(text)) ||
    (containsCyrillicScript(text) &&
      /(почему|не получил|заблок|настройк|разрешен)/i.test(text) &&
      /(уведом|push|телефон|android)/i.test(text))
  ) {
    return true;
  }

  return PERMISSION_TROUBLESHOOT_CUE.test(text) || OPEN_SETTINGS_CUE.test(text);
}

export function isExplainPushPermissionIntent(
  action: string,
): action is ExplainPushPermissionIntent {
  return (EXPLAIN_PUSH_PERMISSION_INTENTS as readonly string[]).includes(
    action,
  );
}

export interface ParsedExplainPushPermission {
  aspect: ExplainPushPermissionAspect;
}

export function parseExplainPushPermissionFromPrompt(
  prompt: string,
): ParsedExplainPushPermission | null {
  if (!isExplainPushPermissionPrompt(prompt)) return null;
  return { aspect: resolveExplainPushPermissionAspect(prompt) };
}

export function rescueExplainPushPermissionIntent(
  prompt: string,
  action: string,
): { action: ExplainPushPermissionIntent; rescueReason: string } | null {
  if (isExplainPushPermissionIntent(action)) return null;
  if (!parseExplainPushPermissionFromPrompt(prompt)) return null;
  return {
    action: 'explain_push_permission',
    rescueReason: 'push_permission',
  };
}

export interface PushPermissionExplainContext {
  permissionState: N99PushPermissionState | 'unknown';
  platform: 'ios' | 'android' | 'web' | null;
  pushRegistered: boolean | null;
  pushRemindersEnabled: boolean | null;
}

export function normalizePushPermissionState(
  raw: unknown,
): N99PushPermissionState | 'unknown' {
  if (
    typeof raw === 'string' &&
    (N99_PUSH_PERMISSION_STATES as readonly string[]).includes(raw)
  ) {
    return raw as N99PushPermissionState;
  }
  return 'unknown';
}

export function resolvePushPermissionExplainContext(
  params: Record<string, unknown>,
  pushRegistered: boolean | null,
): PushPermissionExplainContext {
  const permissionState = normalizePushPermissionState(
    params.pushPermissionState ?? params.permissionState,
  );
  const platformRaw = params.nativePlatform ?? params.platform;
  const platform =
    platformRaw === 'ios' || platformRaw === 'android'
      ? platformRaw
      : platformRaw === 'web'
        ? 'web'
        : null;
  const pushRemindersRaw = params.pushReminders;
  const pushRemindersEnabled =
    typeof pushRemindersRaw === 'boolean' ? pushRemindersRaw : null;

  return {
    permissionState,
    platform,
    pushRegistered,
    pushRemindersEnabled,
  };
}

function isReachablePermission(
  state: N99PushPermissionState | 'unknown',
): boolean {
  return state !== 'unknown' && N99_PUSH_REACHABLE_STATES.has(state);
}

export function buildMissingNotificationLines(
  ctx: PushPermissionExplainContext,
): string[] {
  const lines = [
    'Booking reminders on your phone need native push enabled, OS permission, and push reminders turned on in Account → Notifications.',
  ];
  if (ctx.pushRemindersEnabled === false) {
    lines.push(
      'Push reminders are off in your account preferences — turn them on in Account → Notifications.',
    );
  }
  if (ctx.pushRegistered === false) {
    lines.push(
      'This device is not registered for push yet — ask to enable push notifications to register FCM.',
    );
  }
  if (ctx.permissionState === 'denied') {
    lines.push(
      'Notifications are denied at the OS level — open system Settings and allow notifications for this app.',
    );
  } else if (ctx.permissionState === 'provisional') {
    lines.push(
      'On iOS you may be on provisional (quiet) delivery — upgrade to full alerts when prompted after you engage with a notification.',
    );
  } else if (ctx.permissionState === 'prompt') {
    lines.push(
      'Your phone has not granted notification permission yet — allow notifications when the app asks.',
    );
  } else if (
    !isReachablePermission(ctx.permissionState) &&
    ctx.permissionState !== 'unknown'
  ) {
    lines.push('Check system notification settings for this app.');
  }
  if (ctx.platform === 'android') {
    lines.push(
      'On Android 13+, the app requests POST_NOTIFICATIONS after your first booking instead of on first launch.',
    );
  }
  return lines;
}

export function buildOpenSettingsLines(): string[] {
  return [
    'I can open your phone notification settings for this app.',
    'On iOS: Settings → Notifications → this app → allow Alerts.',
    'On Android: App info → Notifications → allow reminders.',
    'Then return here and confirm push reminders are on under Account → Notifications.',
  ];
}

export function buildProvisionalLines(): string[] {
  return [
    'iOS provisional delivery lets quiet booking reminders arrive before you tap Allow.',
    'After you open a reminder, the app may ask you to keep full alerts — tap Keep notifications on.',
    'You can also open Account → Notifications and enable push to upgrade to full permission.',
  ];
}

export function buildAndroidPermissionLines(): string[] {
  return [
    'Android 13 and newer require the POST_NOTIFICATIONS runtime permission for visible alerts.',
    'This app asks after your first completed booking so the prompt has context.',
    'On older Android versions notifications may be on by default without that dialog.',
    'If you denied it earlier, open system app settings and allow Notifications.',
  ];
}

export function buildDeniedReaskLines(
  ctx: PushPermissionExplainContext,
): string[] {
  const lines = [
    'If notifications were denied, iOS and Android will not show the in-app prompt again — use system Settings.',
    'After your second completed visit the app may offer one re-ask card that deep-links to Settings.',
  ];
  if (ctx.permissionState === 'denied') {
    lines.push('Your device currently reports notifications as denied.');
  }
  lines.push(
    'Open Settings, allow notifications for this app, then enable push reminders in Account → Notifications.',
  );
  return lines;
}

export function buildPushPermissionHowItWorksLines(
  ctx: PushPermissionExplainContext,
): string[] {
  const lines = [
    'Consumer push uses Firebase on native iOS/Android builds.',
    'You need OS permission, a registered device token, and push reminders enabled in your account.',
  ];
  if (ctx.platform === 'ios') {
    lines.push(
      'iOS may start with provisional quiet delivery before full opt-in.',
    );
  }
  if (ctx.platform === 'android') {
    lines.push('Android 13+ uses POST_NOTIFICATIONS after your first booking.');
  }
  return lines;
}

export function assemblePushPermissionSummary(
  aspect: ExplainPushPermissionAspect,
  ctx: PushPermissionExplainContext,
): string {
  let lines: string[];
  switch (aspect) {
    case 'open_settings':
      lines = buildOpenSettingsLines();
      break;
    case 'provisional':
      lines = buildProvisionalLines();
      break;
    case 'android_permission':
      lines = buildAndroidPermissionLines();
      break;
    case 'denied_reask':
      lines = buildDeniedReaskLines(ctx);
      break;
    case 'missing_notification':
      lines = buildMissingNotificationLines(ctx);
      break;
    case 'how_it_works':
    default:
      lines = buildPushPermissionHowItWorksLines(ctx);
      break;
  }
  return lines.join(' ');
}

export function buildExplainPushPermissionNavigate(
  aspect: ExplainPushPermissionAspect,
): { path: string; query: Record<string, string> } {
  if (aspect === 'open_settings' || aspect === 'denied_reask') {
    return {
      path: 'account',
      query: { section: 'notifications', openPushSettings: '1' },
    };
  }
  return { path: 'account', query: { section: 'notifications' } };
}

export function shouldOpenConsumerNotificationSettings(
  aspect: ExplainPushPermissionAspect,
): boolean {
  return aspect === 'open_settings' || aspect === 'denied_reask';
}
