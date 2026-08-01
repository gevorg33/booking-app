import type { AppGuideIntent } from './ai-product-guide.util.js';
import type { GuideNavigateTarget } from './command-completion.types.js';
import type { CommandResult } from './command-completion.types.js';
import { formatGuideVoiceText } from './ai-product-guide-voice.util.js';
import { resolveGuideFlowRoutePrimaryTopic } from './guide/guide-flow.routes.manifest.js';

export const PUBLIC_BOOKING_FUNNEL_GUIDE_ROUTES = {
  overview: '/book',
  professionals: '/book/professionals',
  services: '/book/services',
  checkout: '/book/checkout',
} as const;

export type PublicBookingFunnelGuideRoute =
  (typeof PUBLIC_BOOKING_FUNNEL_GUIDE_ROUTES)[keyof typeof PUBLIC_BOOKING_FUNNEL_GUIDE_ROUTES];

export interface PublicBookingGuideRescueScenario {
  id: string;
  prompt: RegExp;
  samplePrompt: string;
  fromActions?: readonly string[];
}

/** Post-classifier rescue — booking funnel walkthrough prompts (ai-guide-1.5.1 / 4.2.6). */
export const PUBLIC_BOOKING_GUIDE_RESCUE_SCENARIOS: readonly PublicBookingGuideRescueScenario[] =
  [
    {
      id: 'book-on-page',
      samplePrompt: 'How do I book an appointment on this page?',
      prompt:
        /\b(?:how\s+do\s+i\s+book(?:\s+an\s+appointment)?\s+on\s+this\s+page)\b|(?:ինչպ(?:ե?՞?)?(?:ես|ս).+(?:appointment|booking|amragir))|(?:այս\s+page(?:-ում|ում)?)/iu,
      fromActions: ['book_appointment', 'unknown'],
    },
    {
      id: 'walk-through-booking',
      samplePrompt: 'Walk me through booking step by step',
      // e2e-bug.195 — require booking cues with "step by step" so Home/account
      // app tours are not stolen on customer surface.
      prompt:
        /\b(?:walk\s+me\s+through\s+(?:booking|checkout|the\s+booking(?:\s+(?:process|flow|funnel|steps?))?)|how\s+(?:do\s+i|to)\s+book(?:\s+an\s+appointment)?(?:\s+online)?(?:\s+(?:here|with\s+you))?(?:\s+step\s+by\s+step)?|(?:how\s+do\s+i\s+book[\s\S]{0,48}step\s+by\s+step)|(?:\b(?:book(?:ing)?|appointment)\b[\s\S]{0,48}step\s+by\s+step)|(?:step\s+by\s+step[\s\S]{0,48}\b(?:book(?:ing)?|appointment)\b)|(?:i\s+need\s+)?booking\s+help|booking\s+(?:funnel|walkthrough)|full\s+booking\s+flow)\b|(?:քայլ\s+առ\s+քայլ|провед(?:и|ите)\s+меня\s+по\s+шагам|как\s+посмотреть\s+свободн)/iu,
    },
    // e2e-bug.258 — short pure-HY/RU how-to-book stems (no քայլ առ քայլ / Latin
    // booking words). Must rescue from confirm_my_booking_details steal.
    {
      id: 'hy-how-to-book-short',
      samplePrompt: 'Ինչպես ամրագրել',
      prompt:
        /ինչպե[\u055e՞]?ս\s+ամրագր(?:ել|եմ|իր|ենք)?(?:\s+այց(?:ելություն)?)?/iu,
      fromActions: [
        'confirm_my_booking_details',
        'book_appointment',
        'unknown',
        'explain_app_feature',
        'guide_user_flow',
      ],
    },
    {
      id: 'ru-how-to-book-short',
      samplePrompt: 'Как записаться',
      // No \b — JS word boundaries are ASCII-only and miss Cyrillic.
      prompt: /как\s+записат(?:ься|ь)(?:\s+(?:на\s+при[её]м|онлайн))?/iu,
      fromActions: [
        'confirm_my_booking_details',
        'book_appointment',
        'unknown',
        'explain_app_feature',
        'guide_user_flow',
      ],
    },
    {
      id: 'after-pick-time',
      samplePrompt: 'What happens after I pick a time?',
      prompt:
        /\b(?:what\s+happens\s+after\s+(?:i\s+)?(?:pick|choose|select)(?:\s+a)?\s+(?:time|slot)|after\s+i\s+pick\s+a\s+time)\b/i,
      // e2e-bug.195 — also steal from consumer screen/feature tours on customer surface
      fromActions: [
        'unknown',
        'check_availability',
        'book_appointment',
        'explain_app_feature',
        'explain_current_screen',
        'guide_user_flow',
      ],
    },
    {
      id: 'checkout-steps',
      samplePrompt: 'Walk me through checkout and payment',
      prompt:
        /\b(?:walk\s+me\s+through\s+checkout|checkout\s+steps?|explain\s+checkout|how\s+(?:does|do)\s+(?:checkout|payment)\s+work)\b|(?:провед(?:и|ите)\s+меня\s+по\s+шагам\s+checkout|checkout\s+и\s+оплат)/iu,
      fromActions: [
        'unknown',
        'explain_checkout_currency',
        'explain_checkout_tax',
      ],
    },
    {
      id: 'pick-service-provider',
      samplePrompt: 'How do I pick a service and provider?',
      prompt:
        /\b(?:how\s+do\s+i\s+(?:pick|choose|select)\s+(?:a\s+)?(?:service|provider|professional|specialist)|pick\s+a\s+service\s+and\s+provider)\b/i,
    },
  ] as const;

export const PUBLIC_BOOKING_GUIDE_CLASSIFIER_SCENARIOS = [
  {
    id: '5.1-book-step-by-step',
    prompt: 'How do I book an appointment step by step?',
  },
  { id: '5.1-after-time', prompt: 'What happens after I pick a time?' },
  {
    id: '5.1-checkout-walkthrough',
    prompt: 'Walk me through checkout and payment',
  },
  { id: '5.1-pick-service', prompt: 'How do I pick a service and provider?' },
] as const;

export const PUBLIC_BOOKING_GUIDE_ROUTE_SCENARIOS = [
  {
    id: 'step-checkout',
    context: { bookingStep: 'checkout' },
    route: PUBLIC_BOOKING_FUNNEL_GUIDE_ROUTES.checkout,
  },
  {
    id: 'step-services',
    context: { bookingStep: 'services' },
    route: PUBLIC_BOOKING_FUNNEL_GUIDE_ROUTES.services,
  },
  {
    id: 'step-professionals',
    context: { bookingStep: 'professionals' },
    route: PUBLIC_BOOKING_FUNNEL_GUIDE_ROUTES.professionals,
  },
  {
    id: 'path-professionals',
    context: { screen: '/book/demo-salon/professionals' },
    route: PUBLIC_BOOKING_FUNNEL_GUIDE_ROUTES.professionals,
  },
  {
    id: 'path-services',
    context: { pathname: '/book/demo-salon/services' },
    route: PUBLIC_BOOKING_FUNNEL_GUIDE_ROUTES.services,
  },
  {
    id: 'path-checkout',
    context: { screen: '/book/demo-salon/checkout' },
    route: PUBLIC_BOOKING_FUNNEL_GUIDE_ROUTES.checkout,
  },
  {
    id: 'consumer-checkout',
    context: { screen: '/s/demo-salon/book/uuid-service-id' },
    route: PUBLIC_BOOKING_FUNNEL_GUIDE_ROUTES.checkout,
  },
] as const;

export type PublicBookingCheckoutStep =
  | 'professionals'
  | 'services'
  | 'checkout';

export { PUBLIC_APP_GUIDE_CLASSIFIER_RULES } from './ai-product-guide.fixtures.js';
export { PUBLIC_EMPTY_STATE_GUIDE_CLASSIFIER_RULES } from './ai-product-guide-empty-state.fixtures.js';

export const PUBLIC_BOOKING_CHECKOUT_STEP_SCENARIOS = [
  {
    id: 'path-professionals-step',
    pathname: '/book/demo-salon/professionals',
    step: 'professionals' as const,
  },
  {
    id: 'path-services-step',
    pathname: '/book/demo-salon/services',
    step: 'services' as const,
  },
  {
    id: 'path-checkout-step',
    pathname: '/book/demo-salon/checkout',
    step: 'checkout' as const,
  },
  {
    id: 'consumer-slot-step',
    pathname: '/s/demo-salon/book/uuid-service-id',
    step: 'checkout' as const,
  },
] as const;

export const PUBLIC_BOOKING_HELP_CLASSIFIER_RULES = `- booking_help: READ — step-aware booking funnel guide using guide playbooks (professionals → services → checkout). Triggers: how do I book, how do I book an appointment step by step, walk me through booking, booking help, what happens after I pick a time. Uses session bookingStep/screen/route for checkout vs services vs professionals playbooks. Returns GuideResponse steps. NOT explain_app_feature / guide_user_flow consumer Home/account tours ("How do I use the Home tab?"), NOT book_appointment mutate, NOT explain_checkout_currency/tax (domain explainers), NOT list_services catalog browse.`;

function readString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

export function derivePublicBookingStepFromPath(
  pathname: string,
): PublicBookingCheckoutStep | undefined {
  const route = parseBookingPathToGuideRoute(pathname);
  if (route === PUBLIC_BOOKING_FUNNEL_GUIDE_ROUTES.checkout) return 'checkout';
  if (route === PUBLIC_BOOKING_FUNNEL_GUIDE_ROUTES.services) return 'services';
  if (route === PUBLIC_BOOKING_FUNNEL_GUIDE_ROUTES.professionals) {
    return 'professionals';
  }
  return undefined;
}

export function enrichPublicBookingGuideTopicFromPrompt(
  prompt: string,
  route?: string,
  topicId?: unknown,
): string | undefined {
  const explicit = readString(topicId);
  if (explicit) return explicit;

  const primary = resolveGuideFlowRoutePrimaryTopic(route);
  if (
    primary &&
    primary !== 'public-booking-funnel' &&
    primary.startsWith('public-')
  ) {
    return primary;
  }

  const lower = prompt.toLowerCase();
  if (
    /\b(checkout|payment|confirm|after\s+i\s+pick\s+a\s+time)\b/i.test(lower)
  ) {
    return 'public-checkout';
  }
  if (
    /\b(availability|available\s+slot|free\s+slot|open\s+slot|time\s+slot)\b/i.test(
      lower,
    )
  ) {
    return 'public-availability';
  }
  if (/(?:свободн(?:ые|ый)\s+слот|посмотреть\s+слот)/iu.test(prompt)) {
    return 'public-availability';
  }
  if (/\b(service|treatment|duration|price)\b/i.test(lower)) {
    return 'public-booking-services';
  }
  if (/\b(professional|provider|specialist|stylist)\b/i.test(lower)) {
    return 'public-booking-professionals';
  }

  return primary ?? undefined;
}

export function mergePublicBookingGuideContext(
  context?: Record<string, unknown>,
): Record<string, unknown> {
  const pathname =
    readString(context?.pathname) ??
    readString(context?.screen) ??
    readString(context?.path);
  const bookingStep =
    readString(context?.bookingStep) ??
    readString(context?.checkoutStep) ??
    (pathname ? derivePublicBookingStepFromPath(pathname) : undefined);
  return {
    ...context,
    ...(bookingStep ? { bookingStep } : {}),
  };
}

function normalizeExplicitBookRoute(
  route: string,
): PublicBookingFunnelGuideRoute {
  const path = route.split('?')[0]?.replace(/\/+$/, '') || route;
  if (path === '/book/checkout' || path.endsWith('/checkout')) {
    return PUBLIC_BOOKING_FUNNEL_GUIDE_ROUTES.checkout;
  }
  if (path === '/book/professionals' || path.endsWith('/professionals')) {
    return PUBLIC_BOOKING_FUNNEL_GUIDE_ROUTES.professionals;
  }
  if (path === '/book/services' || path.endsWith('/services')) {
    return PUBLIC_BOOKING_FUNNEL_GUIDE_ROUTES.services;
  }
  return PUBLIC_BOOKING_FUNNEL_GUIDE_ROUTES.overview;
}

/** Parse public web or consumer app pathname into canonical guide-flow route (ai-guide-1.5.1). */
export function parseBookingPathToGuideRoute(
  pathname: string,
): PublicBookingFunnelGuideRoute | undefined {
  const lower = pathname.toLowerCase();
  // e2e-bug.106 — manage / account / non-funnel pages must NOT map to checkout.
  if (
    /\/manage(\/|$|\?)/.test(lower) ||
    /\/account(\/|$|\?)/.test(lower) ||
    /\/gift-cards(\/|$|\?)/.test(lower) ||
    /\/packages(\/|$|\?)/.test(lower) ||
    /\/multi\/availability(\/|$|\?)/.test(lower)
  ) {
    return PUBLIC_BOOKING_FUNNEL_GUIDE_ROUTES.overview;
  }
  // Consumer deep-link with a selected service: /s/:tenant/book/:serviceId
  if (/^\/s\/[^/]+\/book\//.test(lower)) {
    return PUBLIC_BOOKING_FUNNEL_GUIDE_ROUTES.checkout;
  }
  if (
    /\/checkout(\/|$|\?)/.test(lower) ||
    /\/book\/multi\/checkout/.test(lower)
  ) {
    return PUBLIC_BOOKING_FUNNEL_GUIDE_ROUTES.checkout;
  }
  if (/\/professionals(\/|$|\?)/.test(lower) || /\/any(\/|$|\?)/.test(lower)) {
    return PUBLIC_BOOKING_FUNNEL_GUIDE_ROUTES.professionals;
  }
  if (/\/services(\/|$|\?)/.test(lower) && !lower.includes('/providers/')) {
    return PUBLIC_BOOKING_FUNNEL_GUIDE_ROUTES.services;
  }
  // e2e-bug.124 / e2e-bug.106 — bare /book/:slug landing is overview, not checkout.
  if (/^\/book\/[^/]+\/?$/.test(lower.split('?')[0] ?? lower)) {
    return PUBLIC_BOOKING_FUNNEL_GUIDE_ROUTES.overview;
  }
  // Booking-in-progress deep segments under /book/:slug/... (review, etc.)
  if (
    /^\/book\/[^/]+\//.test(lower) &&
    !lower.includes('/packages/') &&
    !lower.includes('/multi/') &&
    !lower.includes('/gift-cards/') &&
    !lower.includes('/manage') &&
    !lower.includes('/account')
  ) {
    return PUBLIC_BOOKING_FUNNEL_GUIDE_ROUTES.checkout;
  }
  if (/\/book(\/|$|\?)/.test(lower) || /^\/s\/[^/]+\/?$/.test(lower)) {
    return PUBLIC_BOOKING_FUNNEL_GUIDE_ROUTES.overview;
  }
  return undefined;
}

/** Map public booking funnel step to guide-flow route prefix (ai-guide-1.5.1 / 1.5.3). */
export function mapPublicBookingGuideRoute(
  context?: Record<string, unknown>,
): PublicBookingFunnelGuideRoute {
  const explicitRoute = readString(context?.route);
  if (explicitRoute) {
    return normalizeExplicitBookRoute(explicitRoute);
  }

  const step =
    readString(context?.bookingStep) ?? readString(context?.checkoutStep);
  // e2e-bug.106 — manage/availability are not booking-funnel checkout/professionals.
  if (step === 'manage' || step === 'availability') {
    return PUBLIC_BOOKING_FUNNEL_GUIDE_ROUTES.overview;
  }
  if (step === 'checkout' || step === 'payment') {
    return PUBLIC_BOOKING_FUNNEL_GUIDE_ROUTES.checkout;
  }
  if (step === 'services' || step === 'service') {
    return PUBLIC_BOOKING_FUNNEL_GUIDE_ROUTES.services;
  }
  if (step === 'professionals' || step === 'providers' || step === 'provider') {
    return PUBLIC_BOOKING_FUNNEL_GUIDE_ROUTES.professionals;
  }
  if (step === 'availability') {
    return PUBLIC_BOOKING_FUNNEL_GUIDE_ROUTES.overview;
  }

  const screen =
    readString(context?.screen) ??
    readString(context?.pathname) ??
    readString(context?.path);
  if (screen) {
    const parsed = parseBookingPathToGuideRoute(screen);
    if (parsed) return parsed;
  }

  return PUBLIC_BOOKING_FUNNEL_GUIDE_ROUTES.overview;
}

export function isBookingHelpPrompt(prompt: string): boolean {
  return PUBLIC_BOOKING_GUIDE_RESCUE_SCENARIOS.some((scenario) =>
    scenario.prompt.test(prompt),
  );
}

export function rescuePublicBookingHelpIntent(
  prompt: string,
  action: string,
): string {
  if (action === 'booking_help') return action;

  for (const scenario of PUBLIC_BOOKING_GUIDE_RESCUE_SCENARIOS) {
    if (
      scenario.fromActions?.length &&
      !scenario.fromActions.includes(action)
    ) {
      continue;
    }
    if (scenario.prompt.test(prompt)) {
      return 'booking_help';
    }
  }

  return action;
}

export function resolvePublicBookingGuideIntent(
  prompt: string,
  route?: string,
  intent: AppGuideIntent = 'guide_user_flow',
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
  if (
    primary &&
    primary !== 'public-booking-funnel' &&
    /\b(checkout|payment|after\s+i\s+pick|this\s+step)\b/i.test(lower)
  ) {
    return 'explain_current_screen';
  }

  if (
    route === PUBLIC_BOOKING_FUNNEL_GUIDE_ROUTES.checkout &&
    /\b(checkout|payment|confirm)\b/i.test(lower)
  ) {
    return 'explain_current_screen';
  }

  if (
    route === PUBLIC_BOOKING_FUNNEL_GUIDE_ROUTES.professionals &&
    /\b(professional|provider|specialist|who\s+should\s+i\s+pick)\b/i.test(
      lower,
    )
  ) {
    return 'explain_current_screen';
  }

  if (
    route === PUBLIC_BOOKING_FUNNEL_GUIDE_ROUTES.services &&
    /\b(service|treatment|what\s+do\s+you\s+offer)\b/i.test(lower)
  ) {
    return intent === 'guide_user_flow'
      ? 'guide_user_flow'
      : 'explain_app_feature';
  }

  return intent;
}

export function resolvePublicBookingGuideNavigate(
  route?: string,
): GuideNavigateTarget | undefined {
  switch (route) {
    case PUBLIC_BOOKING_FUNNEL_GUIDE_ROUTES.checkout:
      return { path: 'checkout' };
    case PUBLIC_BOOKING_FUNNEL_GUIDE_ROUTES.services:
      return { path: 'services' };
    case PUBLIC_BOOKING_FUNNEL_GUIDE_ROUTES.professionals:
      return { path: 'professionals' };
    default:
      return { path: 'professionals' };
  }
}

export function rewriteBookingHelpGuideResult(
  result: CommandResult,
  route?: string,
): CommandResult {
  const navigate =
    result.guide?.navigate ?? resolvePublicBookingGuideNavigate(route);
  const voiceSummary = result.guide
    ? formatGuideVoiceText(result.guide, result.summary)
    : undefined;

  return {
    ...result,
    action: 'booking_help',
    details: {
      ...result.details,
      ...(navigate ? { navigate } : {}),
      ...(voiceSummary ? { voiceSummary } : {}),
      guideRoute: route,
      guideIntent: result.action,
    },
    guide: result.guide
      ? {
          ...result.guide,
          navigate: result.guide.navigate ?? navigate,
        }
      : undefined,
  };
}
