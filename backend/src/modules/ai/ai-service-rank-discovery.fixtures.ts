import type { ServiceRank } from './ai-service-catalog-rank.util.js';
import {
  RANK_HANDLER_OUTCOME_SCENARIOS,
  RANK_LIMIT_FROM_PROMPT_SCENARIOS,
  RANK_MID_RANGE_HANDLER_SCENARIOS,
  RANK_NAVIGATE_SCENARIOS,
  RANK_SESSION_PICK_CATALOG,
  type RankHandlerOutcomeScenario,
} from './ai-rank-list-services.fixtures.js';

/** Customer/public classifier rules for service catalog rank discovery (rank-1.2 / rank-1.10). */
export const SERVICE_RANK_DISCOVERY_CLASSIFIER_RULES = `- serviceRank: highest_price | lowest_price | most_popular | null — rank catalog services in list_services before summarizing. highest_price: premium/luxury/deluxe/top-tier/most expensive/priciest/best SERVICE (catalog item). lowest_price: cheapest/most affordable/lowest-priced service when the user does NOT state a dollar budget ceiling. most_popular: most popular/best-selling service ranked by rolling 90-day booking count within the category. Omit when the user asks for the full catalog/menu or rates a specialist/stylist/therapist.
- list_services + serviceRank: When the user asks for the best/premium/luxury/deluxe/top-tier/most expensive SERVICE (not a stylist/therapist/specialist), set serviceRank=highest_price with serviceCategory and/or serviceName. When they ask for cheapest/most affordable/lowest-priced service without a budget amount, set serviceRank=lowest_price. When both rank and budget appear ("best premium haircut under $80"), set serviceRank AND maxPrice.
- Disambiguation vs recommend_specialists: "best rated lash specialist" / "top stylist this week" → recommend_specialists (provider rank). "best premium lash service" / "luxury facial option" / "most expensive styling service" → list_services + serviceRank=highest_price (service catalog rank). "What's the cheapest haircut?" → list_services + serviceRank=lowest_price — NOT maxPrice unless they also state a ceiling ("cheapest under $50" → maxPrice=50).
- Subjective best-for-me: "What's the best option for a first-time haircut?" → booking_help with serviceCategory=haircut — NO serviceRank (not premium/cheapest catalog rank).
- Rank + book compound: "What's your best massage and book it Saturday" → list_services (serviceRank=highest_price) then book_appointment/book_nearest_slot with date hint — NOT list_services alone.
- Dashboard admin analytics: "Most booked service this month" → analyze_services (serviceMetric=most_booked) — NOT list_services serviceRank. "Most expensive appointment today" → analyze_appointments — NOT catalog highest_price.
- Disambiguation vs budget-only: maxPrice filters by spending limit; serviceRank sorts/ranks the catalog. Cheapest-without-dollar-amount uses serviceRank=lowest_price, not maxPrice. Premium/luxury without budget uses serviceRank=highest_price only.
- serviceTier: standard | premium | null — filter catalog rows by entity metadata tier (rank-tier-metadata-en). "Premium tier services for color" → list_services, serviceTier=premium, serviceCategory=color — NOT serviceRank=highest_price.
- Mid-range browse: "Mid-range color service" → list_services, serviceCategory=color, limit=3, sorted by price — NO serviceRank (percentile rank is phase 2).
- Missing price: services with null/unknown price are excluded from price-based serviceRank picks; list copy uses "price on request" when shown.
- Voice/mobile: short prompts like "Premium cut?" → list_services, serviceCategory=haircut, serviceRank=highest_price, limit=1. Colloquial cheapest like "Cheapest facial you got" → list_services, serviceCategory=facial, serviceRank=lowest_price.
- Recommend catalog not provider: "Recommend your best spa service not a person" → list_services, serviceCategory=spa, serviceRank=highest_price — NOT recommend_specialists (user excludes people/providers).
- Session rank upgrade: T1 cheapest haircut → T2 "show premium instead" → list_services, serviceCategory=haircut, serviceRank=highest_price (switch rank, keep category from session).
- Session rank + budget: T1 luxury facial → T2 "anything like that under $120?" → list_services, serviceCategory=facial, serviceRank=highest_price, maxPrice=120 (intersect prior rank with new ceiling).
- Session list pick: T1 top 3 premium massages → T2 "book the second one tomorrow" → book_appointment with serviceName from ranked list index 2; carry serviceCategory from session.
- NOT discover_packages (package/bundle/deal catalog), NOT gift card checkout, NOT explain_checkout_currency. "What's your premium spa package?" → discover_packages — NOT list_services serviceRank (premium + package = bundle catalog, not service rank).
- Examples:
  - "What is the best and premium haircut service?" → list_services, serviceCategory=haircut, serviceRank=highest_price
  - "What's the cheapest haircut you offer?" → list_services, serviceCategory=haircut, serviceRank=lowest_price
  - "What's your luxury massage option?" → list_services, serviceCategory=massage, serviceRank=highest_price
  - "Which is your most expensive styling service?" → list_services, serviceCategory=styling, serviceRank=highest_price
  - "Who is the best rated massage therapist this week?" → recommend_specialists, serviceCategory=massage — NO serviceRank
  - "What's your most popular haircut?" → list_services, serviceCategory=haircut, serviceRank=most_popular
  - "Premium tier services for color" → list_services, serviceTier=premium, serviceCategory=color — NO serviceRank
  - "Mid-range color service" → list_services, serviceCategory=color, limit=3 — NO serviceRank
  - "Premium cut?" → list_services, serviceCategory=haircut, serviceRank=highest_price, limit=1
  - "Cheapest facial you got" → list_services, serviceCategory=facial, serviceRank=lowest_price
  - "Recommend your best spa service not a person" → list_services, serviceCategory=spa, serviceRank=highest_price
  - Session T1: "What's the cheapest haircut you offer?" → list_services, serviceCategory=haircut, serviceRank=lowest_price; T2: "show premium instead" → serviceRank=highest_price (keep haircut)
  - Session T1: "What's your luxury facial option?" → list_services, serviceCategory=facial, serviceRank=highest_price; T2: "anything like that under $120?" → maxPrice=120 (keep facial + highest_price)
  - Session T1: "Top 3 premium massages" → list_services, serviceCategory=massage, serviceRank=highest_price, limit=3; T2: "book the second one tomorrow" → book_appointment, serviceName from list index 2`;

export type ServiceRankExtractionScenario = {
  id: string;
  prompt: string;
  serviceRank: ServiceRank | null;
  blocked?: boolean;
};

/** Post-LLM rank extraction golden rows (rank-1.3). */
export const SERVICE_RANK_EXTRACTION_SCENARIOS: ServiceRankExtractionScenario[] =
  [
    {
      id: 'rank-premium-hair-en',
      prompt: 'What is the best and premium haircut service?',
      serviceRank: 'highest_price',
    },
    {
      id: 'rank-luxury-massage-en',
      prompt: "What's your luxury massage option?",
      serviceRank: 'highest_price',
    },
    {
      id: 'rank-deluxe-facial-en',
      prompt: 'Do you have a deluxe facial?',
      serviceRank: 'highest_price',
    },
    {
      id: 'rank-most-expensive-en',
      prompt: 'Which is your most expensive styling service?',
      serviceRank: 'highest_price',
    },
    {
      id: 'rank-top-tier-en',
      prompt: 'Show me your top-tier hair color services',
      serviceRank: 'highest_price',
    },
    {
      id: 'rank-cheapest-hair-en',
      prompt: "What's the cheapest haircut you offer?",
      serviceRank: 'lowest_price',
    },
    {
      id: 'rank-most-affordable-en',
      prompt: 'Most affordable massage option',
      serviceRank: 'lowest_price',
    },
    {
      id: 'rank-most-popular-en',
      prompt: "What's your most popular haircut?",
      serviceRank: 'most_popular',
    },
    {
      id: 'rank-best-selling-en',
      prompt: 'What is your best-selling facial treatment?',
      serviceRank: 'most_popular',
    },
    {
      id: 'rank-tier-metadata-en',
      prompt: 'Premium tier services for color',
      serviceRank: null,
      blocked: true,
    },
    {
      id: 'rank-specialist-stays-en',
      prompt: 'Who is the best rated lash specialist this week?',
      serviceRank: null,
      blocked: true,
    },
    {
      id: 'rank-not-specialist-en',
      prompt: "What's the best premium service for lashes?",
      serviceRank: 'highest_price',
    },
    {
      id: 'rank-best-for-me-en',
      prompt: "What's the best option for a first-time haircut?",
      serviceRank: null,
    },
    {
      id: 'rank-not-analyze-appt-en',
      prompt: 'Most expensive appointment today',
      serviceRank: null,
      blocked: true,
    },
    {
      id: 'rank-not-analyze-services-admin-en',
      prompt: 'Most booked service this month',
      serviceRank: null,
      blocked: true,
    },
    {
      id: 'rank-plain-catalog-en',
      prompt: 'What services do you offer?',
      serviceRank: null,
    },
    {
      id: 'rank-not-package-en',
      prompt: "What's your premium spa package?",
      serviceRank: null,
      blocked: true,
    },
    {
      id: 'rank-vip-en',
      prompt: 'VIP hair treatment options',
      serviceRank: 'highest_price',
    },
    {
      id: 'rank-signature-en',
      prompt: "What's your signature massage?",
      serviceRank: 'highest_price',
    },
    {
      id: 'rank-flagship-en',
      prompt: 'Flagship facial service',
      serviceRank: 'highest_price',
    },
    {
      id: 'rank-entry-level-en',
      prompt: 'Entry-level manicure',
      serviceRank: 'lowest_price',
    },
    {
      id: 'rank-budget-friendly-en',
      prompt: 'Budget-friendly pedicure',
      serviceRank: 'lowest_price',
    },
    {
      id: 'rank-mid-range-en',
      prompt: 'Mid-range color service',
      serviceRank: null,
      blocked: true,
    },
    {
      id: 'rank-voice-premium-en',
      prompt: 'Premium cut?',
      serviceRank: 'highest_price',
    },
    {
      id: 'rank-voice-cheapest-en',
      prompt: 'Cheapest facial you got',
      serviceRank: 'lowest_price',
    },
    {
      id: 'rank-recommend-not-provider-en',
      prompt: 'Recommend your best spa service not a person',
      serviceRank: 'highest_price',
    },
    {
      id: 'rank-session-upgrade-t2-en',
      prompt: 'show premium instead',
      serviceRank: 'highest_price',
    },
  ];

export type ServiceRankRecommendSpecialistsRescueScenario = {
  id: string;
  prompt: string;
  fromAction: string;
  expectedAction: 'list_services' | 'recommend_specialists';
  rescueReason?: string;
};

/** recommend_specialists guard — service catalog rank vs provider rank (rank-1.5). */
export const SERVICE_RANK_RECOMMEND_SPECIALISTS_RESCUE_SCENARIOS: ServiceRankRecommendSpecialistsRescueScenario[] =
  [
    {
      id: 'rank-rescue-not-specialist-en',
      prompt: "What's the best premium service for lashes?",
      fromAction: 'recommend_specialists',
      expectedAction: 'list_services',
      rescueReason: 'rank_recommend_specialists',
    },
    {
      id: 'rank-rescue-luxury-massage-en',
      prompt: "What's your luxury massage option?",
      fromAction: 'recommend_specialists',
      expectedAction: 'list_services',
      rescueReason: 'rank_recommend_specialists',
    },
    {
      id: 'rank-rescue-cheapest-hair-en',
      prompt: "What's the cheapest haircut you offer?",
      fromAction: 'recommend_specialists',
      expectedAction: 'list_services',
      rescueReason: 'rank_recommend_specialists',
    },
    {
      id: 'rank-specialist-stays-en',
      prompt: 'Who is the best rated lash specialist this week?',
      fromAction: 'recommend_specialists',
      expectedAction: 'recommend_specialists',
    },
    {
      id: 'rank-rated-means-provider-en',
      prompt: 'Best rated deep tissue massage',
      fromAction: 'recommend_specialists',
      expectedAction: 'recommend_specialists',
    },
    {
      id: 'rank-budget-rated-stays-en',
      prompt: 'Best rated massage under $100 this week',
      fromAction: 'recommend_specialists',
      expectedAction: 'recommend_specialists',
    },
    {
      id: 'rank-budget-premium-service-unknown-en',
      prompt: 'Best premium haircut under $80',
      fromAction: 'unknown',
      expectedAction: 'list_services',
      rescueReason: 'rank_list_services',
    },
    {
      id: 'rank-recommend-not-provider-en',
      prompt: 'Recommend your best spa service not a person',
      fromAction: 'recommend_specialists',
      expectedAction: 'list_services',
      rescueReason: 'rank_recommend_specialists',
    },
  ];

export type ServiceRankProviderMisrouteRescueScenario = {
  id: string;
  prompt: string;
  fromAction: string;
  expectedAction: 'recommend_specialists';
  rescueReason: 'rank_provider_specialists';
  serviceCategory?: string;
};

/** list_services/unknown misroutes → recommend_specialists for provider rank (rank-specialist-stays-en). */
export type ServiceRankSubjectiveRescueScenario = {
  id: string;
  prompt: string;
  fromAction: string;
  expectedAction: 'booking_help';
  rescueReason: 'rank_subjective_booking_help';
  serviceCategory?: string;
};

/** list_services/unknown misroutes → booking_help for subjective rank (rank-best-for-me-en). */
export type ServiceRankAdminAnalyticsRescueScenario = {
  id: string;
  prompt: string;
  fromAction: string;
  expectedAction: 'analyze_services' | 'analyze_appointments';
  rescueReason: string;
  serviceMetric?: string;
};

/** list_services/unknown misroutes → package discovery (rank-not-package-en). */
export type ServiceRankPackageRescueScenario = {
  id: string;
  prompt: string;
  fromAction: string;
  surface: 'public' | 'customer';
  expectedAction: string;
  rescueReason: string;
};

export const SERVICE_RANK_PACKAGE_RESCUE_SCENARIOS: ServiceRankPackageRescueScenario[] =
  [
    {
      id: 'rank-not-package-list-public-en',
      prompt: "What's your premium spa package?",
      fromAction: 'list_services',
      surface: 'public',
      expectedAction: 'booking_help',
      rescueReason: 'discover_packages',
    },
    {
      id: 'rank-not-package-unknown-public-en',
      prompt: "What's your premium spa package?",
      fromAction: 'unknown',
      surface: 'public',
      expectedAction: 'booking_help',
      rescueReason: 'discover_packages',
    },
    {
      id: 'rank-not-package-list-customer-en',
      prompt: "What's your premium spa package?",
      fromAction: 'list_services',
      surface: 'customer',
      expectedAction: 'discover_packages',
      rescueReason: 'discover_packages',
    },
    {
      id: 'rank-not-package-unknown-customer-en',
      prompt: "What's your premium spa package?",
      fromAction: 'unknown',
      surface: 'customer',
      expectedAction: 'discover_packages',
      rescueReason: 'discover_packages',
    },
  ];

/** Dashboard list_services misroutes → admin analytics (rank-not-analyze-*-en). */
export const SERVICE_RANK_ADMIN_ANALYTICS_RESCUE_SCENARIOS: ServiceRankAdminAnalyticsRescueScenario[] =
  [
    {
      id: 'rank-not-analyze-services-list-en',
      prompt: 'Most booked service this month',
      fromAction: 'list_services',
      expectedAction: 'analyze_services',
      rescueReason: 'rank_to_analyze_services',
      serviceMetric: 'most_booked',
    },
    {
      id: 'rank-not-analyze-services-unknown-en',
      prompt: 'Most booked service this month',
      fromAction: 'unknown',
      expectedAction: 'analyze_services',
      rescueReason: 'rank_to_analyze_services',
      serviceMetric: 'most_booked',
    },
    {
      id: 'rank-not-analyze-appt-list-en',
      prompt: 'Most expensive appointment today',
      fromAction: 'list_services',
      expectedAction: 'analyze_appointments',
      rescueReason: 'rank_to_analyze_appointments',
    },
    {
      id: 'rank-not-analyze-appt-unknown-en',
      prompt: 'Most expensive appointment today',
      fromAction: 'unknown',
      expectedAction: 'analyze_appointments',
      rescueReason: 'rank_to_analyze_appointments',
    },
  ];

export const SERVICE_RANK_SUBJECTIVE_RESCUE_SCENARIOS: ServiceRankSubjectiveRescueScenario[] =
  [
    {
      id: 'rank-best-for-me-list-en',
      prompt: "What's the best option for a first-time haircut?",
      fromAction: 'list_services',
      expectedAction: 'booking_help',
      rescueReason: 'rank_subjective_booking_help',
      serviceCategory: 'haircut',
    },
    {
      id: 'rank-best-for-me-unknown-en',
      prompt: "What's the best option for a first-time haircut?",
      fromAction: 'unknown',
      expectedAction: 'booking_help',
      rescueReason: 'rank_subjective_booking_help',
      serviceCategory: 'haircut',
    },
  ];

export const SERVICE_RANK_PROVIDER_MISROUTE_RESCUE_SCENARIOS: ServiceRankProviderMisrouteRescueScenario[] =
  [
    {
      id: 'rank-specialist-stays-list-en',
      prompt: 'Who is the best rated lash specialist this week?',
      fromAction: 'list_services',
      expectedAction: 'recommend_specialists',
      rescueReason: 'rank_provider_specialists',
      serviceCategory: 'lash',
    },
    {
      id: 'rank-specialist-stays-unknown-en',
      prompt: 'Who is the best rated lash specialist this week?',
      fromAction: 'unknown',
      expectedAction: 'recommend_specialists',
      rescueReason: 'rank_provider_specialists',
      serviceCategory: 'lash',
    },
  ];

export type ServiceRankCompoundScenario = {
  id: string;
  prompt: string;
  serviceRank: ServiceRank;
  serviceCategory?: string | null;
  maxPrice?: number;
  publicCompoundSteps: readonly string[];
  customerCompoundSteps: readonly string[];
};

/** Rank compound decomposition golden rows (rank-1.7). */
export const SERVICE_RANK_COMPOUND_SCENARIOS: ServiceRankCompoundScenario[] = [
  {
    id: 'rank-book-premium-en',
    prompt: 'Book your most premium facial tomorrow, nearest slot',
    serviceRank: 'highest_price',
    serviceCategory: 'facial',
    publicCompoundSteps: ['list_services', 'book_appointment'],
    customerCompoundSteps: ['list_services', 'book_nearest_slot'],
  },
  {
    id: 'rank-premium-under-budget-en',
    prompt: 'Best premium haircut I can get under $80 tomorrow nearest slot',
    serviceRank: 'highest_price',
    serviceCategory: 'haircut',
    maxPrice: 80,
    publicCompoundSteps: ['list_services', 'book_appointment'],
    customerCompoundSteps: ['list_services', 'book_nearest_slot'],
  },
  {
    id: 'rank-cheapest-book-en',
    prompt: 'Book the cheapest massage tomorrow, soonest opening',
    serviceRank: 'lowest_price',
    serviceCategory: 'massage',
    publicCompoundSteps: ['list_services', 'book_appointment'],
    customerCompoundSteps: ['list_services', 'book_nearest_slot'],
  },
  {
    id: 'rank-list-then-book-en',
    prompt: "What's your best massage and book it Saturday",
    serviceRank: 'highest_price',
    serviceCategory: 'massage',
    publicCompoundSteps: ['list_services', 'book_appointment'],
    customerCompoundSteps: ['list_services', 'book_nearest_slot'],
  },
];

export const SERVICE_RANK_COMPOUND_NEGATIVE_SCENARIOS: Array<{
  id: string;
  prompt: string;
}> = [
  {
    id: 'rank-not-budget-only-compound',
    prompt: 'Book a haircut under $50 tomorrow, nearest slot',
  },
  {
    id: 'rank-not-plain-book',
    prompt: 'Book massage tomorrow at 3pm',
  },
  {
    id: 'rank-not-list-only',
    prompt: "What's your luxury massage option?",
  },
];

export type RankDiscoverySurface = 'public' | 'customer' | 'dashboard' | 'both';

export type ServiceRankDiscoveryPromptFixture = {
  id: string;
  prompt: string;
  surface: RankDiscoverySurface;
  expectedAction: string;
  expectedParams?: Record<string, unknown>;
  blocked?: boolean;
  /** Provider/specialist rating — stays recommend_specialists; eligible for eval when set. */
  providerRank?: boolean;
  /** Subjective best-for-me — routes to booking_help without serviceRank. */
  subjectiveRank?: boolean;
  clarify?: boolean;
  phase2?: boolean;
  publicCompoundSteps?: readonly string[];
  customerCompoundSteps?: readonly string[];
};

export type RankSessionTurn = {
  prompt: string;
  expectedParams?: Record<string, unknown>;
  expectedAction?: string;
};

export type RankSessionScenario = {
  id: string;
  surface: RankDiscoverySurface;
  turns: readonly RankSessionTurn[];
};

/** NL prompts for classifier, rescue, and eval (sections A–L). */
export const SIMILAR_SERVICE_RANK_PROMPTS: ServiceRankDiscoveryPromptFixture[] =
  [
    // A — Premium / top-tier
    {
      id: 'rank-premium-hair-en',
      prompt: 'What is the best and premium haircut service?',
      surface: 'both',
      expectedAction: 'list_services',
      expectedParams: {
        serviceCategory: 'haircut',
        serviceRank: 'highest_price',
        limit: 1,
      },
    },
    {
      id: 'rank-luxury-massage-en',
      prompt: "What's your luxury massage option?",
      surface: 'both',
      expectedAction: 'list_services',
      expectedParams: {
        serviceCategory: 'massage',
        serviceRank: 'highest_price',
      },
    },
    {
      id: 'rank-deluxe-facial-en',
      prompt: 'Do you have a deluxe facial?',
      surface: 'both',
      expectedAction: 'list_services',
      expectedParams: {
        serviceCategory: 'facial',
        serviceRank: 'highest_price',
      },
    },
    {
      id: 'rank-most-expensive-en',
      prompt: 'Which is your most expensive styling service?',
      surface: 'both',
      expectedAction: 'list_services',
      expectedParams: {
        serviceCategory: 'styling',
        serviceRank: 'highest_price',
      },
    },
    {
      id: 'rank-top-tier-en',
      prompt: 'Show me your top-tier hair color services',
      surface: 'both',
      expectedAction: 'list_services',
      expectedParams: {
        serviceCategory: 'hair color',
        serviceRank: 'highest_price',
        limit: 3,
      },
    },
    // B — Cheapest / value
    {
      id: 'rank-cheapest-hair-en',
      prompt: "What's the cheapest haircut you offer?",
      surface: 'both',
      expectedAction: 'list_services',
      expectedParams: {
        serviceCategory: 'haircut',
        serviceRank: 'lowest_price',
        limit: 1,
      },
    },
    {
      id: 'rank-most-affordable-en',
      prompt: 'Most affordable massage option',
      surface: 'both',
      expectedAction: 'list_services',
      expectedParams: {
        serviceCategory: 'massage',
        serviceRank: 'lowest_price',
      },
    },
    // C — Best service vs best specialist
    {
      id: 'rank-not-specialist-en',
      prompt: "What's the best premium service for lashes?",
      surface: 'both',
      expectedAction: 'list_services',
      expectedParams: { serviceCategory: 'lash', serviceRank: 'highest_price' },
    },
    {
      id: 'rank-specialist-stays-en',
      prompt: 'Who is the best rated lash specialist this week?',
      surface: 'both',
      expectedAction: 'recommend_specialists',
      providerRank: true,
      expectedParams: { serviceCategory: 'lash' },
    },
    {
      id: 'rank-best-service-explicit-en',
      prompt: 'Best service in your spa menu for relaxation',
      surface: 'both',
      expectedAction: 'list_services',
      expectedParams: { serviceCategory: 'spa', serviceRank: 'highest_price' },
    },
    {
      id: 'rank-best-for-me-en',
      prompt: "What's the best option for a first-time haircut?",
      surface: 'both',
      expectedAction: 'booking_help',
      subjectiveRank: true,
      expectedParams: { serviceCategory: 'haircut' },
    },
    // E — Compounds
    {
      id: 'rank-book-premium-en',
      prompt: 'Book your most premium facial tomorrow, nearest slot',
      surface: 'both',
      expectedAction: 'book_appointment',
      expectedParams: {
        serviceCategory: 'facial',
        serviceRank: 'highest_price',
        bookingFirstAvailable: true,
      },
      publicCompoundSteps: ['list_services', 'book_appointment'],
      customerCompoundSteps: ['list_services', 'book_nearest_slot'],
    },
    {
      id: 'rank-list-then-book-en',
      prompt: "What's your best massage and book it Saturday",
      surface: 'both',
      expectedAction: 'book_appointment',
      expectedParams: {
        serviceCategory: 'massage',
        serviceRank: 'highest_price',
        bookingFirstAvailable: true,
      },
      publicCompoundSteps: ['list_services', 'book_appointment'],
      customerCompoundSteps: ['list_services', 'book_nearest_slot'],
    },
    {
      id: 'rank-premium-under-budget-en',
      prompt: 'Best premium haircut I can get under $80',
      surface: 'both',
      expectedAction: 'list_services',
      expectedParams: {
        serviceCategory: 'haircut',
        serviceRank: 'highest_price',
        maxPrice: 80,
      },
    },
    // F — Multilingual
    {
      id: 'rank-premium-hy',
      prompt: 'Որն է ձեր ամենապրեմիում մազակրտումը',
      surface: 'both',
      expectedAction: 'list_services',
      expectedParams: {
        serviceCategory: 'haircut',
        serviceRank: 'highest_price',
      },
    },
    {
      id: 'rank-luxury-ru',
      prompt: 'Какой у вас люксовый массаж?',
      surface: 'both',
      expectedAction: 'list_services',
      expectedParams: {
        serviceCategory: 'massage',
        serviceRank: 'highest_price',
      },
    },
    {
      id: 'rank-cheapest-hy',
      prompt: 'Ամենաէժան մազակրտումը',
      surface: 'both',
      expectedAction: 'list_services',
      expectedParams: {
        serviceCategory: 'haircut',
        serviceRank: 'lowest_price',
      },
    },
    {
      id: 'rank-translit-premium',
      prompt: 'Premium uslugi dlya strizhki',
      surface: 'customer',
      expectedAction: 'list_services',
      expectedParams: {
        serviceCategory: 'haircut',
        serviceRank: 'highest_price',
      },
    },
    {
      id: 'rank-translit-cheapest',
      prompt: 'Samaya deshevaya strizhka',
      surface: 'customer',
      expectedAction: 'list_services',
      expectedParams: {
        serviceCategory: 'haircut',
        serviceRank: 'lowest_price',
      },
    },
    // G — Negative / rescue
    {
      id: 'rank-not-analyze-appt-en',
      prompt: 'Most expensive appointment today',
      surface: 'dashboard',
      expectedAction: 'analyze_appointments',
      blocked: true,
    },
    {
      id: 'rank-not-analyze-services-admin-en',
      prompt: 'Most booked service this month',
      surface: 'dashboard',
      expectedAction: 'analyze_services',
      blocked: true,
    },
    {
      id: 'rank-not-package-en',
      prompt: "What's your premium spa package?",
      surface: 'both',
      expectedAction: 'discover_packages',
      blocked: true,
    },
    {
      id: 'rank-rated-means-provider-en',
      prompt: 'Best rated deep tissue massage',
      surface: 'both',
      expectedAction: 'recommend_specialists',
      blocked: true,
    },
    // H — Popularity + metadata (shipped rank-1.8 / 1.9)
    {
      id: 'rank-most-popular-en',
      prompt: "What's your most popular haircut?",
      surface: 'both',
      expectedAction: 'list_services',
      expectedParams: {
        serviceCategory: 'haircut',
        serviceRank: 'most_popular',
      },
    },
    {
      id: 'rank-best-selling-en',
      prompt: 'What is your best-selling facial treatment?',
      surface: 'both',
      expectedAction: 'list_services',
      expectedParams: {
        serviceCategory: 'facial',
        serviceRank: 'most_popular',
      },
    },
    {
      id: 'rank-tier-metadata-en',
      prompt: 'Premium tier services for color',
      surface: 'both',
      expectedAction: 'list_services',
      expectedParams: { serviceCategory: 'color', serviceTier: 'premium' },
    },
    // I — Synonyms & marketing language
    {
      id: 'rank-vip-en',
      prompt: 'VIP hair treatment options',
      surface: 'both',
      expectedAction: 'list_services',
      expectedParams: { serviceCategory: 'hair', serviceRank: 'highest_price' },
    },
    {
      id: 'rank-signature-en',
      prompt: "What's your signature massage?",
      surface: 'both',
      expectedAction: 'list_services',
      expectedParams: {
        serviceCategory: 'massage',
        serviceRank: 'highest_price',
      },
    },
    {
      id: 'rank-flagship-en',
      prompt: 'Flagship facial service',
      surface: 'both',
      expectedAction: 'list_services',
      expectedParams: {
        serviceCategory: 'facial',
        serviceRank: 'highest_price',
      },
    },
    {
      id: 'rank-entry-level-en',
      prompt: 'Entry-level manicure',
      surface: 'both',
      expectedAction: 'list_services',
      expectedParams: {
        serviceCategory: 'manicure',
        serviceRank: 'lowest_price',
      },
    },
    {
      id: 'rank-budget-friendly-en',
      prompt: 'Budget-friendly pedicure',
      surface: 'both',
      expectedAction: 'list_services',
      expectedParams: {
        serviceCategory: 'pedicure',
        serviceRank: 'lowest_price',
      },
    },
    {
      id: 'rank-mid-range-en',
      prompt: 'Mid-range color service',
      surface: 'both',
      expectedAction: 'list_services',
      expectedParams: { serviceCategory: 'color', limit: 3 },
    },
    // J — Voice / mobile
    {
      id: 'rank-voice-premium-en',
      prompt: 'Premium cut?',
      surface: 'customer',
      expectedAction: 'list_services',
      expectedParams: {
        serviceCategory: 'haircut',
        serviceRank: 'highest_price',
        limit: 1,
      },
    },
    {
      id: 'rank-voice-chip-en',
      prompt: 'Premium services',
      surface: 'customer',
      expectedAction: 'list_services',
      expectedParams: { serviceRank: 'highest_price' },
    },
    {
      id: 'rank-voice-cheapest-en',
      prompt: 'Cheapest facial you got',
      surface: 'customer',
      expectedAction: 'list_services',
      expectedParams: {
        serviceCategory: 'facial',
        serviceRank: 'lowest_price',
      },
    },
    {
      id: 'rank-compare-en',
      prompt: "What's the difference between standard and premium haircut?",
      surface: 'both',
      expectedAction: 'list_services',
      expectedParams: {
        serviceCategory: 'haircut',
        serviceRank: 'highest_price',
        limit: 2,
      },
      phase2: true,
    },
    {
      id: 'rank-recommend-not-provider-en',
      prompt: 'Recommend your best spa service not a person',
      surface: 'both',
      expectedAction: 'list_services',
      expectedParams: { serviceCategory: 'spa', serviceRank: 'highest_price' },
    },
    // Plain catalog (no rank)
    {
      id: 'rank-plain-catalog-en',
      prompt: 'What services do you offer?',
      surface: 'both',
      expectedAction: 'list_services',
    },
  ];

/** Multi-turn session flows (section K). */
export const RANK_SESSION_SCENARIOS: RankSessionScenario[] = [
  {
    id: 'rank-session-upgrade-en',
    surface: 'both',
    turns: [
      {
        prompt: "What's the cheapest haircut you offer?",
        expectedParams: {
          serviceCategory: 'haircut',
          serviceRank: 'lowest_price',
        },
      },
      {
        prompt: 'show premium instead',
        expectedParams: {
          serviceCategory: 'haircut',
          serviceRank: 'highest_price',
        },
      },
    ],
  },
  {
    id: 'rank-session-then-budget-en',
    surface: 'both',
    turns: [
      {
        prompt: "What's your luxury facial option?",
        expectedParams: {
          serviceCategory: 'facial',
          serviceRank: 'highest_price',
        },
      },
      {
        prompt: 'anything like that under $120?',
        expectedParams: {
          serviceCategory: 'facial',
          serviceRank: 'highest_price',
          maxPrice: 120,
        },
      },
    ],
  },
  {
    id: 'rank-session-pick-one-en',
    surface: 'both',
    turns: [
      {
        prompt: 'Top 3 premium massages',
        expectedParams: {
          serviceCategory: 'massage',
          serviceRank: 'highest_price',
        },
      },
      {
        prompt: 'book the second one tomorrow',
        expectedParams: {
          serviceCategory: 'massage',
          serviceName: 'Relax massage',
          serviceId: 'massage-90',
        },
        expectedAction: 'book_appointment',
      },
    ],
  },
];

export const RANK_DISAMBIGUATION_SCENARIOS =
  SIMILAR_SERVICE_RANK_PROMPTS.filter(
    (scenario) =>
      scenario.blocked || scenario.providerRank || scenario.subjectiveRank,
  );

export const RANK_VOICE_SCENARIOS = SIMILAR_SERVICE_RANK_PROMPTS.filter(
  (scenario) => scenario.id.startsWith('rank-voice-'),
);

/** Section J — voice / mobile phrasing (rank-1.12). */
export const RANK_MOBILE_SCENARIOS = SIMILAR_SERVICE_RANK_PROMPTS.filter(
  (scenario) =>
    scenario.id.startsWith('rank-voice-') ||
    scenario.id === 'rank-compare-en' ||
    scenario.id === 'rank-recommend-not-provider-en',
);

/** Section K — multi-turn session flows (rank-1.12). */
export { RANK_SESSION_SCENARIOS as RANK_SESSION_FIXTURES };

/** Section L — handler edge cases (rank-1.12). */
export const RANK_HANDLER_EDGE_SCENARIOS = (
  [
    'rank-all-same-price',
    'rank-inactive-excluded',
    'rank-zero-price',
    'rank-missing-price',
  ] as const
).map(
  (id) =>
    RANK_HANDLER_OUTCOME_SCENARIOS.find((scenario) => scenario.id === id)!,
);

export const RANK_MULTILINGUAL_SCENARIOS = SIMILAR_SERVICE_RANK_PROMPTS.filter(
  (scenario) =>
    [
      'rank-premium-hy',
      'rank-luxury-ru',
      'rank-cheapest-hy',
      'rank-translit-premium',
      'rank-translit-cheapest',
    ].includes(scenario.id),
);

export const RANK_SYNONYM_SCENARIOS = SIMILAR_SERVICE_RANK_PROMPTS.filter(
  (scenario) =>
    [
      'rank-vip-en',
      'rank-signature-en',
      'rank-flagship-en',
      'rank-entry-level-en',
      'rank-budget-friendly-en',
      'rank-mid-range-en',
    ].includes(scenario.id),
);

export {
  RANK_HANDLER_OUTCOME_SCENARIOS,
  RANK_LIMIT_FROM_PROMPT_SCENARIOS,
  RANK_MID_RANGE_HANDLER_SCENARIOS,
  RANK_NAVIGATE_SCENARIOS,
  RANK_SESSION_PICK_CATALOG,
  type RankHandlerOutcomeScenario,
};

/** Unique fixture ids across NL prompts, session flows, compounds, and handler outcomes. */
export const RANK_DOMAIN_FIXTURE_IDS: readonly string[] = [
  ...new Set([
    ...SIMILAR_SERVICE_RANK_PROMPTS.map((scenario) => scenario.id),
    ...RANK_SESSION_SCENARIOS.map((scenario) => scenario.id),
    ...SERVICE_RANK_COMPOUND_SCENARIOS.map((scenario) => scenario.id),
    ...SERVICE_RANK_EXTRACTION_SCENARIOS.map((scenario) => scenario.id),
    ...SERVICE_RANK_RECOMMEND_SPECIALISTS_RESCUE_SCENARIOS.map(
      (scenario) => scenario.id,
    ),
    ...RANK_HANDLER_OUTCOME_SCENARIOS.map((scenario) => scenario.id),
    ...RANK_NAVIGATE_SCENARIOS.map((scenario) => scenario.id),
  ]),
];

export const SERVICE_RANK_DISCOVERY_PUBLIC_PROMPTS =
  SIMILAR_SERVICE_RANK_PROMPTS.filter(
    (scenario) => scenario.surface === 'public' || scenario.surface === 'both',
  );

export const SERVICE_RANK_DISCOVERY_CUSTOMER_PROMPTS =
  SIMILAR_SERVICE_RANK_PROMPTS.filter(
    (scenario) =>
      scenario.surface === 'customer' || scenario.surface === 'both',
  );

export const SERVICE_RANK_DISCOVERY_DASHBOARD_PROMPTS =
  SIMILAR_SERVICE_RANK_PROMPTS.filter(
    (scenario) =>
      scenario.surface === 'dashboard' || scenario.surface === 'both',
  );

const premiumHyPrompt =
  SIMILAR_SERVICE_RANK_PROMPTS.find(
    (scenario) => scenario.id === 'rank-premium-hy',
  )?.prompt ?? '';
const cheapestHyPrompt =
  SIMILAR_SERVICE_RANK_PROMPTS.find(
    (scenario) => scenario.id === 'rank-cheapest-hy',
  )?.prompt ?? '';

/** Multilingual rank keyword hints for deterministic rescue (rank-1.10). */
export const RANK_I18N_HIGHEST_HINTS = [
  'люксов',
  'люкс',
  'премиум',
  premiumHyPrompt.split(/\s+/)[3] ?? '',
].filter(Boolean);

export const RANK_I18N_LOWEST_HINTS = [
  cheapestHyPrompt.split(/\s+/)[0] ?? '',
  'deshevaya',
  'samaya deshevaya',
].filter(Boolean);
