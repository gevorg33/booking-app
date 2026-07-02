import {
  enrichParamsWithSharedEntities,
  propagateCompoundStepParamsAcrossSteps,
} from './ai-command-entity-params.util.js';
import { parseConfigureNotificationSettingsFromPrompt } from './ai-notification-settings.util.js';
import { parseConfigureWhatsappIntegrationFromPrompt } from './ai-whatsapp-integration.util.js';

export const ONBOARD_SALON_NOTIFICATIONS_STEP_ACTIONS = [
  'configure_notification_settings',
  'configure_whatsapp_integration',
  'test_push',
] as const;

export type OnboardSalonNotificationsStepAction =
  (typeof ONBOARD_SALON_NOTIFICATIONS_STEP_ACTIONS)[number];

export const ONBOARD_SALON_NOTIFICATIONS_RECIPE_ID =
  'onboard_salon_notifications';

const COMPOUND_MARKERS =
  /\band\s+then\b|\bthen\b|;\s*|\s+and\s+(?=(?:configure|connect|enable|set|use|test|send)\b)/i;

export const ONBOARD_SALON_NOTIFICATIONS_CLASSIFIER_RULES = `- onboard_salon_notifications (compound): dashboard multi-step salon notification onboarding — decomposes to configure_notification_settings → configure_whatsapp_integration → test_push. Use for "onboard salon notifications end-to-end", "set up salon notifications: email reminders, WhatsApp integration with platform default, test push". NOT configure_notification_settings alone when user asks for full notification onboarding; NOT configure_whatsapp_integration alone when user also asks notification channels + test push; NOT configure_push_recipients (provider mobile push recipients); NOT enable_notifications (customer prefs); NOT launch_consumer_app_growth.`;

const FULL_NOTIFICATION_ONBOARDING_CUE =
  /\b(?:onboard(?:ing)?\s+salon\s+notifications?|salon\s+notifications?\s+onboarding|notification\s+onboarding|set\s+up\s+salon\s+notifications?|salon\s+notification\s+setup|notifications?\s+setup\s+end[\s-]to[\s-]end|end[\s-]to[\s-]end\s+(?:salon\s+)?notifications?|configure\s+(?:our\s+)?salon\s+notifications?)\b/i;

const SALON_VENUE_CUE =
  /\b(?:salon|spa|barbershop|beauty\s+salon|nail\s+salon|business)\b/i;

const NOTIFICATION_SETTINGS_STEP_CUE =
  /\b(?:notification\s+settings?|email\s+reminders?|sms\s+reminders?|appointment\s+reminders?|24\s*-?\s*h(?:our)?\s+reminders?|confirmation\s+(?:email|whatsapp)|turn\s+on\s+email)\b/i;

const WHATSAPP_STEP_CUE =
  /\b(?:whatsapp\s+integration|connect\s+whatsapp|whatsapp\s+connection|platform\s+default\s+whatsapp|configure\s+whatsapp)\b/i;

const TEST_PUSH_STEP_CUE =
  /\b(?:test\s+push|send\s+test\s+push|ping\s+push)\b/i;

const PUSH_RECIPIENTS_PRIMARY_CUE =
  /\b(?:configure|set|update|assign|manage)\b.*\b(?:push\s+recipients?|provider\s+push|mobile\s+push\s+recipients?)\b/i;

function countNotificationOnboardingStepFamilies(prompt: string): number {
  let count = 0;
  if (NOTIFICATION_SETTINGS_STEP_CUE.test(prompt)) count += 1;
  if (WHATSAPP_STEP_CUE.test(prompt)) count += 1;
  if (TEST_PUSH_STEP_CUE.test(prompt)) count += 1;
  return count;
}

function hasFullNotificationOnboardingCue(prompt: string): boolean {
  if (FULL_NOTIFICATION_ONBOARDING_CUE.test(prompt)) return true;
  return (
    /\b(?:set\s+up|setup|onboard)\b/i.test(prompt) &&
    /\bnotifications?\b/i.test(prompt) &&
    (SALON_VENUE_CUE.test(prompt) ||
      /\b(?:end[\s-]to[\s-]end|from\s+scratch)\b/i.test(prompt))
  );
}

export function isOnboardSalonNotificationsCompoundPrompt(
  prompt: string,
): boolean {
  const text = prompt.trim();
  if (text.length < 32) return false;
  if (PUSH_RECIPIENTS_PRIMARY_CUE.test(text)) return false;
  if (
    /\b(?:marketing|registration)\s+email\b/i.test(text) &&
    !WHATSAPP_STEP_CUE.test(text)
  ) {
    return false;
  }
  if (
    /\bmy\s+notifications?\b/i.test(text) &&
    !/\b(?:salon|business|dashboard)\b/i.test(text)
  ) {
    return false;
  }

  const stepFamilies = countNotificationOnboardingStepFamilies(text);
  const fullOnboarding = hasFullNotificationOnboardingCue(text);

  if (fullOnboarding) return true;
  if (stepFamilies < 3) return false;

  return stepFamilies >= 3 || COMPOUND_MARKERS.test(text) || /;\s*/.test(text);
}

export type OnboardSalonNotificationsStep = {
  action: OnboardSalonNotificationsStepAction;
  params: Record<string, unknown>;
  segment: string;
};

export function buildOnboardSalonNotificationsCompoundParams(
  prompt: string,
): Record<string, unknown> {
  const params = enrichParamsWithSharedEntities(
    {
      emailEnabled: true,
      whatsappEnabled: true,
      reminder24hEmail: true,
      reminder24hWhatsapp: true,
      usePlatformDefault: true,
      _forceNotificationSettings: true,
      _forceWhatsappIntegration: true,
    },
    prompt,
  );

  const notificationConfig = parseConfigureNotificationSettingsFromPrompt(
    prompt,
    params,
  );
  if (notificationConfig) {
    Object.assign(params, notificationConfig);
  }

  const whatsappConfig = parseConfigureWhatsappIntegrationFromPrompt(
    prompt,
    params,
  );
  if (whatsappConfig) {
    Object.assign(params, whatsappConfig);
  }

  return params;
}

export function decomposeOnboardSalonNotificationsCompoundPrompt(
  prompt: string,
): OnboardSalonNotificationsStep[] {
  const trimmed = prompt.trim();
  if (!trimmed || !isOnboardSalonNotificationsCompoundPrompt(trimmed)) {
    return [];
  }

  const base = buildOnboardSalonNotificationsCompoundParams(trimmed);
  const steps: OnboardSalonNotificationsStep[] = [
    {
      action: 'configure_notification_settings',
      params: { ...base },
      segment: trimmed,
    },
    {
      action: 'configure_whatsapp_integration',
      params: { ...base },
      segment: trimmed,
    },
    {
      action: 'test_push',
      params: { ...base },
      segment: trimmed,
    },
  ];

  return propagateCompoundStepParamsAcrossSteps(steps);
}

export function rescueOnboardSalonNotificationsCompoundIntent(
  prompt: string,
  action: string,
): { action: 'compound_intent'; rescueReason: string } | null {
  if (action === 'compound_intent') return null;
  if (!isOnboardSalonNotificationsCompoundPrompt(prompt)) return null;
  return {
    action: 'compound_intent',
    rescueReason: 'onboard_salon_notifications_compound',
  };
}
