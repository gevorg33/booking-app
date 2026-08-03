import type { AppGuideIntent } from './ai-product-guide.util.js';

export interface CustomerAppGuideRescueScenario {
  id: string;
  intent: AppGuideIntent;
  prompt: RegExp;
  samplePrompt: string;
  fromActions?: readonly string[];
}

/** Post-classifier rescue — consumer app guide prompts (ai-guide-1.5.2). */
export const CUSTOMER_APP_GUIDE_RESCUE_SCENARIOS: readonly CustomerAppGuideRescueScenario[] =
  [
    {
      id: 'consumer-tabs',
      intent: 'explain_app_feature',
      samplePrompt: 'What is on the Home tab vs Services?',
      // e2e-bug.276 — reclaim Home/Services/Account tab tours from widget /
      // compare_services steals (locale:hy EN prompts often misclassify).
      prompt:
        /\b(?:(?:how\s+(?:do\s+i|to)\s+use|walk\s+me\s+through|what(?:'s|\s+is)\s+on)\s+(?:the\s+)?(?:home|services|account)\s+tab|(?:home|services|account)\s+tab|consumer\s+app\s+tabs?|bottom\s+tabs?)\b/i,
      fromActions: [
        'unknown',
        'list_my_appointments',
        'list_my_upcoming_appointments',
        'how_to_download_app',
        'explain_home_screen_widget',
        'compare_services',
      ],
    },
    {
      id: 'consumer-profile',
      intent: 'guide_user_flow',
      samplePrompt: 'How do I update my profile?',
      prompt:
        /\b(?:how\s+do\s+i\s+(?:update|edit|change)\s+(?:my\s+)?(?:profile|name|phone|email|avatar)|profile\s+settings?|sign\s+in\s+to\s+my\s+account)\b|(?:как\s+(?:обновить|изменить).+(?:профил|profile))/iu,
      fromActions: ['unknown', 'list_my_appointments', 'how_to_download_app'],
    },
    {
      id: 'consumer-packages-walkthrough',
      intent: 'guide_user_flow',
      samplePrompt: 'Walk me through buying a package',
      prompt:
        /\b(?:walk\s+me\s+through\s+(?:buying\s+)?(?:a\s+)?package|step\s+by\s+step.*package|how\s+do\s+i\s+buy\s+(?:a\s+)?package)\b|(?:как\s+купить.+(?:пакет|package))/iu,
      fromActions: ['unknown', 'book_package', 'discover_packages'],
    },
    {
      id: 'consumer-gift-cards',
      intent: 'explain_app_feature',
      samplePrompt: 'How do gift cards work in the app?',
      prompt:
        /\b(?:how\s+do\s+(?:gift\s+cards?|gift\s+card\s+codes?)\s+work|what\s+(?:is|are)\s+(?:a\s+)?gift\s+cards?|redeem\s+(?:a\s+)?gift\s+card|apply\s+gift\s+card\s+at\s+checkout)\b|(?:ինչպ(?:ե?՞?)?(?:ես|ս).*(?:gift\s+card|gift\s+cards?))|(?:как\s+работа(?:ют|ет).+(?:gift\s+card|подарочн))/iu,
      fromActions: ['unknown', 'promo_code_help', 'book_package'],
    },
    {
      id: 'consumer-subscriptions',
      intent: 'explain_app_feature',
      samplePrompt: 'How do subscriptions work?',
      prompt:
        /\b(?:how\s+do\s+subscriptions?\s+work|what\s+(?:is|are)\s+(?:a\s+)?subscriptions?|membership\s+plan|recurring\s+package)\b/i,
      fromActions: ['unknown', 'book_package', 'discover_packages'],
    },
    {
      id: 'consumer-packages-screen',
      intent: 'explain_app_feature',
      samplePrompt: 'What is the Packages screen for?',
      prompt:
        /\b(?:packages?\s+screen|what\s+(?:is|are)\s+packages?|where\s+(?:are|do\s+i\s+find)\s+packages?)\b/i,
      fromActions: ['unknown', 'discover_packages'],
    },
    {
      id: 'consumer-first-booking',
      intent: 'guide_user_flow',
      samplePrompt: 'How do I book my first appointment?',
      prompt:
        /\b(?:how\s+do\s+i\s+book\s+my\s+first\s+(?:appointment|visit|booking)|first\s+booking|book\s+my\s+first|getting\s+started\s+with\s+booking)\b/i,
      fromActions: ['unknown', 'book_nearest_slot', 'create_booking'],
    },
    {
      id: 'consumer-activation-next',
      intent: 'guide_user_flow',
      samplePrompt: "What's next in the onboarding flow?",
      prompt:
        /\b(?:what(?:'s|\s+is)\s+next(?:\s+in\s+(?:the\s+)?(?:onboarding|activation|booking)\s+flow)?|next\s+step\s+in\s+(?:booking|onboarding)|activation\s+flow)\b/i,
      fromActions: ['unknown', 'booking_help'],
    },
    {
      id: 'consumer-welcome-screen',
      intent: 'explain_current_screen',
      samplePrompt: 'What am I looking at on the welcome screen?',
      prompt:
        /\b(?:welcome\s+screen|what\s+(?:is|does)\s+(?:the\s+)?welcome\s+(?:page|screen)|pick\s+(?:a\s+)?salon)\b/i,
      fromActions: ['unknown', 'how_to_download_app'],
    },
  ] as const;

export const CUSTOMER_APP_GUIDE_CLASSIFIER_SCENARIOS = [
  {
    id: '5.2-tabs',
    intent: 'explain_app_feature' as const,
    prompt: 'What is on the Home tab vs Services?',
  },
  {
    id: '5.2-profile',
    intent: 'guide_user_flow' as const,
    prompt: 'How do I update my profile?',
  },
  {
    id: '5.2-packages',
    intent: 'guide_user_flow' as const,
    prompt: 'Walk me through buying a package',
  },
  {
    id: '5.2-gift-cards',
    intent: 'explain_app_feature' as const,
    prompt: 'How do gift cards work in the app?',
  },
  {
    id: '5.2-subscriptions',
    intent: 'explain_app_feature' as const,
    prompt: 'How do subscriptions work?',
  },
  {
    id: '5.4-first-booking',
    intent: 'guide_user_flow' as const,
    prompt: 'How do I book my first appointment?',
  },
  {
    id: '5.4-activation-next',
    intent: 'guide_user_flow' as const,
    prompt: "What's next in the onboarding flow?",
  },
  {
    id: '5.4-welcome-screen',
    intent: 'explain_current_screen' as const,
    prompt: 'What am I looking at on the welcome screen?',
  },
] as const;

export const CONSUMER_ACTIVATION_STEP_SCENARIOS = [
  {
    id: 'welcome',
    pathname: '/',
    step: 'welcome' as const,
    slotSelected: false,
  },
  {
    id: 'salon',
    pathname: '/s/glow-nails/home',
    step: 'salon' as const,
    slotSelected: false,
  },
  {
    id: 'service',
    pathname: '/s/glow-nails/services',
    step: 'service' as const,
    slotSelected: false,
  },
  {
    id: 'slot',
    pathname: '/s/glow-nails/book/svc-1',
    step: 'slot' as const,
    slotSelected: false,
  },
  {
    id: 'confirm',
    pathname: '/s/glow-nails/book/svc-1',
    step: 'confirm' as const,
    slotSelected: true,
  },
] as const;

export const CONSUMER_ACTIVATION_ROUTE_SCENARIOS = [
  {
    id: 'step-welcome',
    context: { activationStep: 'welcome' },
    route: '/consumer/welcome',
    topicId: 'consumer-activation-welcome',
  },
  {
    id: 'step-salon',
    context: { activationStep: 'salon' },
    route: '/consumer/salon',
    topicId: 'consumer-activation-salon',
  },
  {
    id: 'step-service',
    context: { activationStep: 'service' },
    route: '/consumer/service',
    topicId: 'consumer-activation-service',
  },
  {
    id: 'step-slot',
    context: { activationStep: 'slot' },
    route: '/consumer/slot',
    topicId: 'consumer-activation-slot',
  },
  {
    id: 'step-confirm',
    context: { activationStep: 'confirm' },
    route: '/consumer/confirm',
    topicId: 'consumer-activation-confirm',
  },
  {
    id: 'path-services',
    context: { pathname: '/s/demo-salon/services' },
    route: '/consumer/service',
    topicId: 'consumer-activation-service',
  },
  {
    id: 'path-slot',
    context: { pathname: '/s/demo-salon/book/svc-1', slotSelected: false },
    route: '/consumer/slot',
    topicId: 'consumer-activation-slot',
  },
] as const;

export const CUSTOMER_APP_GUIDE_ROUTE_SCENARIOS = [
  { id: 'tab-account', context: { tab: 'account' }, route: '/s/account' },
  { id: 'tab-packages', context: { tab: 'packages' }, route: '/s/packages' },
  { id: 'tab-book', context: { tab: 'services' }, route: '/s/book' },
  {
    id: 'path-account',
    context: { screen: '/s/demo-salon/account' },
    route: '/s/account',
  },
  {
    id: 'path-packages',
    context: { pathname: '/s/demo-salon/packages' },
    route: '/s/packages',
  },
  { id: 'path-home', context: { screen: '/s/demo-salon/home' }, route: '/s' },
] as const;
