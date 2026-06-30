import type { AppGuideIntent } from './ai-product-guide.util.js';
import { isAppGuideIntent } from './ai-product-guide.util.js';
import type { GuideNavigateTarget } from './command-completion.types.js';
import { resolveGuideFlowRoutePrimaryTopic } from './guide/guide-flow.routes.manifest.js';
import {
  CUSTOMER_APP_GUIDE_RESCUE_SCENARIOS,
  type CustomerAppGuideRescueScenario,
} from './ai-customer-product-guide.fixtures.js';

export const CUSTOMER_APP_GUIDE_ROUTES = {
  tabs: '/s',
  account: '/s/account',
  packages: '/s/packages',
  booking: '/s/book',
} as const;

export type CustomerAppGuideRoute =
  (typeof CUSTOMER_APP_GUIDE_ROUTES)[keyof typeof CUSTOMER_APP_GUIDE_ROUTES];

export type ConsumerActivationStep = 'welcome' | 'salon' | 'service' | 'slot' | 'confirm';

export const CONSUMER_ACTIVATION_GUIDE_ROUTES = {
  welcome: '/consumer/welcome',
  salon: '/consumer/salon',
  service: '/consumer/service',
  slot: '/consumer/slot',
  confirm: '/consumer/confirm',
} as const;

export type ConsumerActivationGuideRoute =
  (typeof CONSUMER_ACTIVATION_GUIDE_ROUTES)[keyof typeof CONSUMER_ACTIVATION_GUIDE_ROUTES];

export const CONSUMER_ACTIVATION_TOPIC_BY_STEP: Readonly<
  Record<ConsumerActivationStep, string>
> = {
  welcome: 'consumer-activation-welcome',
  salon: 'consumer-activation-salon',
  service: 'consumer-activation-service',
  slot: 'consumer-activation-slot',
  confirm: 'consumer-activation-confirm',
};

export { CUSTOMER_APP_GUIDE_CLASSIFIER_RULES } from './ai-product-guide.fixtures.js';
export { CUSTOMER_EMPTY_STATE_GUIDE_CLASSIFIER_RULES } from './ai-product-guide-empty-state.fixtures.js';

function readString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

/** Parse consumer app pathname into canonical guide-flow route (ai-guide-1.5.2). */
export function parseCustomerPathToGuideRoute(pathname: string): CustomerAppGuideRoute | undefined {
  const lower = pathname.toLowerCase();
  if (/\/account(\/|$|\?)/.test(lower) || /\/profile(\/|$|\?)/.test(lower)) {
    return CUSTOMER_APP_GUIDE_ROUTES.account;
  }
  if (/\/packages(\/|$|\?)/.test(lower) || /\/gift-cards(\/|$|\?)/.test(lower)) {
    return CUSTOMER_APP_GUIDE_ROUTES.packages;
  }
  if (/\/book(\/|$|\?)/.test(lower) || /\/services(\/|$|\?)/.test(lower)) {
    return CUSTOMER_APP_GUIDE_ROUTES.booking;
  }
  if (/\/home(\/|$|\?)/.test(lower) || /^\/s\/[^/]+\/?$/.test(lower)) {
    return CUSTOMER_APP_GUIDE_ROUTES.tabs;
  }
  return undefined;
}

/** Derive adopt-3.4 activation step from consumer pathname (ai-guide-1.5.4). */
export function deriveConsumerActivationStepFromPath(
  pathname: string,
  context: { slotSelected?: boolean } = {},
): ConsumerActivationStep | undefined {
  const lower = pathname.toLowerCase();
  if (/\/account(\/|$|\?)/.test(lower) || /\/packages(\/|$|\?)/.test(lower)) {
    return undefined;
  }
  if (pathname === '/' || pathname === '') return 'welcome';
  if (/^\/s\/[^/]+\/book\/[^/]+$/.test(pathname)) {
    return context.slotSelected ? 'confirm' : 'slot';
  }
  if (pathname.includes('/services')) return 'service';
  if (/^\/s\/[^/]+(\/home)?\/?$/.test(pathname)) return 'salon';
  return undefined;
}

function readActivationStep(context?: Record<string, unknown>): ConsumerActivationStep | undefined {
  const raw =
    readString(context?.activationStep) ?? readString(context?.guidedBookingStep);
  if (
    raw === 'welcome' ||
    raw === 'salon' ||
    raw === 'service' ||
    raw === 'slot' ||
    raw === 'confirm'
  ) {
    return raw;
  }
  return undefined;
}

function readSlotSelected(context?: Record<string, unknown>): boolean {
  if (context?.slotSelected === true) return true;
  const timeSlot = readString(context?.timeSlot);
  return Boolean(timeSlot);
}

/** Merge activationStep from pathname + slot context (ai-guide-1.5.4). */
export function mergeCustomerActivationGuideContext(
  context?: Record<string, unknown>,
): Record<string, unknown> {
  const pathname =
    readString(context?.pathname) ??
    readString(context?.screen) ??
    readString(context?.path);
  const slotSelected = readSlotSelected(context);
  const activationStep =
    readActivationStep(context) ??
    (pathname
      ? deriveConsumerActivationStepFromPath(pathname, { slotSelected })
      : undefined);
  return {
    ...context,
    ...(slotSelected ? { slotSelected: true } : {}),
    ...(activationStep ? { activationStep } : {}),
  };
}

/** Map activation step to virtual guide-flow route (ai-guide-1.5.4). */
export function mapCustomerActivationGuideRoute(
  context?: Record<string, unknown>,
): ConsumerActivationGuideRoute | undefined {
  const step = readActivationStep(context);
  if (!step) return undefined;
  switch (step) {
    case 'welcome':
      return CONSUMER_ACTIVATION_GUIDE_ROUTES.welcome;
    case 'salon':
      return CONSUMER_ACTIVATION_GUIDE_ROUTES.salon;
    case 'service':
      return CONSUMER_ACTIVATION_GUIDE_ROUTES.service;
    case 'slot':
      return CONSUMER_ACTIVATION_GUIDE_ROUTES.slot;
    case 'confirm':
      return CONSUMER_ACTIVATION_GUIDE_ROUTES.confirm;
    default:
      return undefined;
  }
}

export function resolveConsumerActivationTopicFromStep(
  step?: ConsumerActivationStep,
): string | undefined {
  if (!step) return undefined;
  return CONSUMER_ACTIVATION_TOPIC_BY_STEP[step];
}

export function isConsumerActivationPrompt(prompt: string): boolean {
  return /\b(?:first\s+booking|first\s+appointment|getting\s+started|onboarding|book\s+my\s+first|what(?:'s|\s+is)\s+next|activation\s+flow|welcome\s+screen)\b/i.test(
    prompt,
  );
}

/** Map consumer mobile screen/tab context to guide-flow route (ai-guide-1.5.2). */
export function mapCustomerMobileGuideRoute(
  context?: Record<string, unknown>,
): CustomerAppGuideRoute {
  const explicitRoute = readString(context?.route);
  if (explicitRoute) {
    if (explicitRoute.startsWith('/s/account') || explicitRoute.startsWith('/consumer/account')) {
      return CUSTOMER_APP_GUIDE_ROUTES.account;
    }
    if (
      explicitRoute.startsWith('/s/packages') ||
      explicitRoute.startsWith('/consumer/packages')
    ) {
      return CUSTOMER_APP_GUIDE_ROUTES.packages;
    }
    if (explicitRoute.startsWith('/s/book') || explicitRoute.startsWith('/consumer/book')) {
      return CUSTOMER_APP_GUIDE_ROUTES.booking;
    }
    return CUSTOMER_APP_GUIDE_ROUTES.tabs;
  }

  const tab = readString(context?.tab) ?? readString(context?.mobileRoute);
  if (tab === 'account' || tab === 'profile') return CUSTOMER_APP_GUIDE_ROUTES.account;
  if (tab === 'packages' || tab === 'gift-cards' || tab === 'subscriptions') {
    return CUSTOMER_APP_GUIDE_ROUTES.packages;
  }
  if (tab === 'book' || tab === 'booking' || tab === 'services') {
    return CUSTOMER_APP_GUIDE_ROUTES.booking;
  }
  if (tab === 'home') return CUSTOMER_APP_GUIDE_ROUTES.tabs;

  const screen =
    readString(context?.screen) ??
    readString(context?.pathname) ??
    readString(context?.path);
  if (screen) {
    const parsed = parseCustomerPathToGuideRoute(screen);
    if (parsed) return parsed;
  }

  return CUSTOMER_APP_GUIDE_ROUTES.tabs;
}

function matchesCustomerGuideRescueScenario(
  prompt: string,
  action: string,
  scenario: CustomerAppGuideRescueScenario,
): boolean {
  if (scenario.fromActions?.length && !scenario.fromActions.includes(action)) {
    return false;
  }
  return scenario.prompt.test(prompt);
}

/** Deterministic rescue for consumer app guide prompts (ai-guide-1.5.2). */
export function rescueCustomerAppGuideIntent(prompt: string, action: string): string {
  if (isAppGuideIntent(action)) return action;

  for (const scenario of CUSTOMER_APP_GUIDE_RESCUE_SCENARIOS) {
    if (matchesCustomerGuideRescueScenario(prompt, action, scenario)) {
      return scenario.intent;
    }
  }

  return action;
}

export function enrichCustomerGuideTopicFromPrompt(
  prompt: string,
  route?: string,
  topicId?: unknown,
  activationStep?: ConsumerActivationStep,
): string | undefined {
  const explicit = readString(topicId);
  if (explicit) return explicit;

  const primary = resolveGuideFlowRoutePrimaryTopic(route);
  if (primary?.startsWith('consumer-activation-')) {
    return primary;
  }

  if (activationStep) {
    const stepTopic = resolveConsumerActivationTopicFromStep(activationStep);
    if (stepTopic) return stepTopic;
  }

  const lower = prompt.toLowerCase();
  if (isConsumerActivationPrompt(prompt)) {
    if (/\b(confirm|checkout|after\s+i\s+pick\s+a\s+time)\b/i.test(lower)) {
      return CONSUMER_ACTIVATION_TOPIC_BY_STEP.confirm;
    }
    if (/\b(slot|time|calendar|when)\b/i.test(lower)) {
      return CONSUMER_ACTIVATION_TOPIC_BY_STEP.slot;
    }
    if (/\b(service|treatment)\b/i.test(lower)) {
      return CONSUMER_ACTIVATION_TOPIC_BY_STEP.service;
    }
    if (/\b(salon|business|clinic|pick\s+(?:a\s+)?(?:salon|business))\b/i.test(lower)) {
      return CONSUMER_ACTIVATION_TOPIC_BY_STEP.salon;
    }
    return 'consumer-getting-started';
  }

  if (
    primary &&
    primary !== 'consumer-tabs' &&
    primary !== 'consumer-booking-flow'
  ) {
    return primary;
  }

  if (/\b(gift\s+card|gift\s+cards?|subscription|subscriptions?|package?s?)\b/i.test(lower)) {
    return 'consumer-packages-gift-cards';
  }
  if (/(?:как\s+купить.+(?:пакет|package)|пакет\s+услуг)/iu.test(prompt)) {
    return 'consumer-packages-gift-cards';
  }
  if (/\b(profile|account|sign\s+in|notification|my\s+bookings?)\b/i.test(lower)) {
    return 'consumer-account';
  }
  if (/\b(tab|home\s+tab|services\s+tab|account\s+tab|bottom\s+nav)\b/i.test(lower)) {
    return 'consumer-tabs';
  }

  if (activationStep) {
    return resolveConsumerActivationTopicFromStep(activationStep);
  }

  return primary ?? undefined;
}

export function resolveCustomerGuideIntent(
  prompt: string,
  intent: AppGuideIntent,
  route?: string,
): AppGuideIntent {
  const lower = prompt.toLowerCase();
  if (
    /\b(this\s+page|this\s+screen|here|what\s+am\s+i\s+looking\s+at|what\s+can\s+i\s+do\s+(?:on|here))\b/i.test(
      lower,
    )
  ) {
    return 'explain_current_screen';
  }

  const primary = resolveGuideFlowRoutePrimaryTopic(route);
  if (primary === 'consumer-account') {
    if (/\b(profile|account|sign\s+in|notification)\b/i.test(lower)) {
      return intent === 'guide_user_flow' ? 'guide_user_flow' : 'explain_app_feature';
    }
  }

  if (primary === 'consumer-packages-gift-cards') {
    if (/\b(gift\s+card|subscription|package)\b/i.test(lower)) {
      return intent === 'guide_user_flow' ? 'guide_user_flow' : 'explain_app_feature';
    }
  }

  if (primary === 'consumer-tabs' && /\b(tab|home|services\s+tab|account\s+tab)\b/i.test(lower)) {
    return 'explain_app_feature';
  }

  if (primary?.startsWith('consumer-activation-')) {
    if (
      /\b(this\s+page|this\s+screen|here|what\s+am\s+i\s+looking\s+at|what\s+can\s+i\s+do\s+(?:on|here))\b/i.test(
        lower,
      )
    ) {
      return 'explain_current_screen';
    }
    if (/\b(what(?:'s|\s+is)\s+next|next\s+step|what\s+do\s+i\s+do\s+now)\b/i.test(lower)) {
      return 'guide_user_flow';
    }
  }

  return intent;
}

export function resolveCustomerGuideNavigate(route?: string): GuideNavigateTarget | undefined {
  switch (route) {
    case CONSUMER_ACTIVATION_GUIDE_ROUTES.salon:
      return { path: 'home' };
    case CONSUMER_ACTIVATION_GUIDE_ROUTES.service:
      return { path: 'services' };
    case CONSUMER_ACTIVATION_GUIDE_ROUTES.slot:
    case CONSUMER_ACTIVATION_GUIDE_ROUTES.confirm:
      return { path: 'checkout' };
    case CUSTOMER_APP_GUIDE_ROUTES.account:
      return { path: 'account' };
    case CUSTOMER_APP_GUIDE_ROUTES.packages:
      return { path: 'packages' };
    case CUSTOMER_APP_GUIDE_ROUTES.booking:
      return { path: 'services' };
    default:
      return { path: 'home' };
  }
}
