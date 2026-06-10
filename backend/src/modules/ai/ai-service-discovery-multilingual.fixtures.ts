import type { AiEvalLocale } from './eval/ai-command-eval.types.js';
import { SIMILAR_BUDGET_SERVICE_PROMPTS } from './ai-budget-service-discovery.fixtures.js';
import { SIMILAR_FLEXIBLE_AVAILABILITY_PROMPTS } from './ai-flexible-availability.fixtures.js';
import { SIMILAR_SERVICE_RANK_PROMPTS } from './ai-service-rank-discovery.fixtures.js';

export type ServiceDiscoveryDomain = 'budget' | 'rank' | 'availability' | 'cross';

/** hy/ru/translit row linked to a budget, rank, or avail canonical fixture id (discover-1.5). */
export type ServiceDiscoveryMultilingualScenario = {
  id: string;
  locale: AiEvalLocale;
  prompt: string;
  /** Primary budget / rank / avail scenario id this row exercises. */
  sourceFixtureId: string;
  /** Additional canonical ids for cross-sprint compound rows. */
  relatedFixtureIds?: readonly string[];
  domain: ServiceDiscoveryDomain;
  surface: 'public' | 'customer' | 'both';
  expectedAction?: string;
  expectedParams?: Record<string, unknown>;
};

/** Classifier guidance for hy/ru/translit budget + rank + OR availability (discover-1.5). */
export const SERVICE_DISCOVERY_MULTILINGUAL_CLASSIFIER_RULES = `- Armenian/Russian/transliteration service discovery (budget + rank + OR availability):
  - maxPrice: hy «ունեմ X դրամ», «X դոլար», «X-ից ցած»; ru «у меня X рублей», «до X рублей», «меньше X»; translit «u menya X dollarov», «do X rubley» → list_services / check with maxPrice.
  - serviceRank: hy «ամենաէժան», «պրեմիում», «լյուքս»; ru «самый дешёвый», «люксовый», «премиум»; translit «samaya deshevaya», «premium uslugi» → list_services + serviceRank (NOT recommend_specialists for catalog rank).
  - OR availabilityWindows: hy «վաղը երեկոյան կամ ուրբաթ», «երեկոյան կամ հանգստյան օր»; ru «завтра вечером или в пятницу», «вечером или в субботу»; translit «vagh@ yereko yan kam urbat» → check_availability / check_providers_for_service with availabilityWindows[] (NOT single timeOfDay when «կամ/or/или» splits windows).
  - Compound: budget filter then OR scan — carry maxPrice + serviceRank through availabilityWindows; book compounds set bookingFirstAvailable when «ամենամոտ/blizhayshiy/забронируй» present.
  - Disambiguation: hy/ru gift card / package / deposit phrases → NOT maxPrice (same as English budget-1.3 rules).`;

type SourceFixtureRow = {
  id: string;
  prompt: string;
  expectedAction?: string;
  expectedParams?: Record<string, unknown>;
  surface?: string;
};

function sourceRow(
  catalog: readonly SourceFixtureRow[],
  id: string,
): SourceFixtureRow {
  const row = catalog.find((entry) => entry.id === id);
  if (!row) {
    throw new Error(`Missing service discovery source fixture: ${id}`);
  }
  return row;
}

function mirrorSourceScenario(
  id: string,
  locale: AiEvalLocale,
  domain: ServiceDiscoveryDomain,
  sourceFixtureId: string,
  overrides: Partial<ServiceDiscoveryMultilingualScenario> = {},
): ServiceDiscoveryMultilingualScenario {
  const catalog =
    domain === 'budget'
      ? SIMILAR_BUDGET_SERVICE_PROMPTS
      : domain === 'rank'
        ? SIMILAR_SERVICE_RANK_PROMPTS
        : SIMILAR_FLEXIBLE_AVAILABILITY_PROMPTS;
  const source = sourceRow(catalog, sourceFixtureId);
  return {
    id,
    locale,
    prompt: overrides.prompt ?? source.prompt,
    sourceFixtureId,
    domain,
    surface:
      overrides.surface ??
      (source.surface === 'dashboard'
        ? 'both'
        : (source.surface as ServiceDiscoveryMultilingualScenario['surface'])),
    expectedAction: overrides.expectedAction ?? source.expectedAction,
    expectedParams: overrides.expectedParams ?? source.expectedParams,
    relatedFixtureIds: overrides.relatedFixtureIds,
  };
}

/** Cross-sprint discover matrix section I (discover-1.5). */
export const DISCOVER_CROSS_SPRINT_MULTILINGUAL_SCENARIOS: ServiceDiscoveryMultilingualScenario[] =
  [
    {
      id: 'discover-hy-budget-or-en',
      locale: 'hy',
      prompt:
        'Ցանկանում եմ մազակրտում վաղը երեկոյան կամ ուրբաթ, 5000 դրամ ունեմ',
      sourceFixtureId: 'avail-or-hy',
      relatedFixtureIds: ['budget-hy-dram'],
      domain: 'cross',
      surface: 'both',
      expectedAction: 'check_availability',
      expectedParams: {
        serviceCategory: 'haircut',
        maxPrice: 5000,
        availabilityWindows: [
          { date: 'tomorrow', timeOfDay: 'evening' },
          { weekdays: ['friday'], timeOfDay: 'afternoon' },
        ],
      },
    },
    {
      id: 'discover-ru-premium-en',
      locale: 'ru',
      prompt: 'Люксовый массаж до 8000 рублей завтра вечером',
      sourceFixtureId: 'rank-luxury-ru',
      relatedFixtureIds: ['budget-ru-ruble'],
      domain: 'cross',
      surface: 'both',
      expectedAction: 'list_services',
      expectedParams: {
        serviceCategory: 'massage',
        serviceRank: 'highest_price',
        maxPrice: 8000,
        date: 'tomorrow',
        timeOfDay: 'evening',
      },
    },
    {
      id: 'discover-hy-cheapest-en',
      locale: 'hy',
      prompt: 'Ամենաէժան մանիկյուր $30-ից ցածր',
      sourceFixtureId: 'rank-cheapest-hy',
      relatedFixtureIds: ['budget-hair-50-en'],
      domain: 'cross',
      surface: 'both',
      expectedAction: 'list_services',
      expectedParams: {
        serviceCategory: 'manicure',
        serviceRank: 'lowest_price',
        maxPrice: 30,
      },
    },
    {
      id: 'discover-ru-or-book-en',
      locale: 'ru',
      prompt: 'Стрижка завтра вечером или в субботу — забронируй',
      sourceFixtureId: 'avail-or-ru',
      relatedFixtureIds: ['avail-or-book-en'],
      domain: 'cross',
      surface: 'both',
      expectedAction: 'book_appointment',
      expectedParams: {
        serviceCategory: 'haircut',
        availabilityWindows: [
          { date: 'tomorrow', timeOfDay: 'evening' },
          { weekdays: ['saturday'] },
        ],
        bookingFirstAvailable: true,
      },
    },
  ];

/** hy/ru/translit rows referencing budget / rank / avail fixture ids (discover-1.5). */
export const MULTILINGUAL_SERVICE_DISCOVERY_SCENARIOS: ServiceDiscoveryMultilingualScenario[] =
  [
    // Budget — direct mirrors
    mirrorSourceScenario(
      'discover-ml-budget-hy-dram',
      'hy',
      'budget',
      'budget-hy-dram',
    ),
    mirrorSourceScenario(
      'discover-ml-budget-ru-ruble',
      'ru',
      'budget',
      'budget-ru-ruble',
    ),
    mirrorSourceScenario(
      'discover-ml-budget-translit-under-50',
      'translit',
      'budget',
      'budget-translit-under-50',
    ),
    // Budget — hy translations referencing EN ids
    {
      id: 'discover-ml-budget-hy-hair-50',
      locale: 'hy',
      prompt: 'Ինձ մազակրտում է պետք, $50 ունեմ',
      sourceFixtureId: 'budget-hair-50-en',
      domain: 'budget',
      surface: 'both',
      expectedAction: 'list_services',
      expectedParams: { serviceCategory: 'haircut', maxPrice: 50 },
    },
    {
      id: 'discover-ml-budget-hy-massage-80',
      locale: 'hy',
      prompt: '80 դոլարից ցածր massage-ներ որոն եմ',
      sourceFixtureId: 'budget-massage-under-80-en',
      domain: 'budget',
      surface: 'both',
      expectedAction: 'list_services',
      expectedParams: { serviceCategory: 'massage', maxPrice: 80 },
    },
    {
      id: 'discover-ml-budget-hy-facial-30',
      locale: 'hy',
      prompt: '30 դոլարով ինչ facial կարող եմ ամրագրել',
      sourceFixtureId: 'budget-facial-budget-only-en',
      domain: 'budget',
      surface: 'both',
      expectedAction: 'list_services',
      expectedParams: { maxPrice: 30 },
    },
    {
      id: 'discover-ml-budget-hy-under-phrase',
      locale: 'hy',
      prompt: 'Մազակրտում 50 դոլարից ցած',
      sourceFixtureId: 'budget-under-phrase-en',
      domain: 'budget',
      surface: 'both',
      expectedAction: 'list_services',
      expectedParams: { serviceCategory: 'haircut', maxPrice: 50 },
    },
    // Budget — ru translations referencing EN ids
    {
      id: 'discover-ml-budget-ru-massage-80',
      locale: 'ru',
      prompt: 'Какие массажи можно до 80 долларов?',
      sourceFixtureId: 'budget-massage-under-80-en',
      domain: 'budget',
      surface: 'both',
      expectedAction: 'list_services',
      expectedParams: { serviceCategory: 'massage', maxPrice: 80 },
    },
    {
      id: 'discover-ml-budget-ru-hair-50',
      locale: 'ru',
      prompt: 'Мне нужна стрижка, у меня 50 долларов',
      sourceFixtureId: 'budget-hair-50-en',
      domain: 'budget',
      surface: 'both',
      expectedAction: 'list_services',
      expectedParams: { serviceCategory: 'haircut', maxPrice: 50 },
    },
    {
      id: 'discover-ml-budget-ru-facial-40',
      locale: 'ru',
      prompt: 'Можно ли записаться на facial дешевле 40?',
      sourceFixtureId: 'budget-question-en',
      domain: 'budget',
      surface: 'both',
      expectedAction: 'list_services',
      expectedParams: { serviceCategory: 'facial', maxPrice: 40 },
    },
    {
      id: 'discover-ml-budget-ru-voice-chip',
      locale: 'ru',
      prompt: 'Услуги до 50 долларов',
      sourceFixtureId: 'budget-voice-chip-en',
      domain: 'budget',
      surface: 'customer',
      expectedAction: 'list_services',
      expectedParams: { maxPrice: 50 },
    },
    // Rank — direct mirrors
    mirrorSourceScenario(
      'discover-ml-rank-hy-premium',
      'hy',
      'rank',
      'rank-premium-hy',
    ),
    mirrorSourceScenario(
      'discover-ml-rank-hy-cheapest',
      'hy',
      'rank',
      'rank-cheapest-hy',
    ),
    mirrorSourceScenario(
      'discover-ml-rank-ru-luxury',
      'ru',
      'rank',
      'rank-luxury-ru',
    ),
    mirrorSourceScenario(
      'discover-ml-rank-translit-premium',
      'translit',
      'rank',
      'rank-translit-premium',
    ),
    {
      id: 'discover-ml-rank-ru-cheapest',
      locale: 'ru',
      prompt: 'Какая у вас самая дешёвая стрижка?',
      sourceFixtureId: 'rank-cheapest-hair-en',
      domain: 'rank',
      surface: 'both',
      expectedAction: 'list_services',
      expectedParams: { serviceCategory: 'haircut', serviceRank: 'lowest_price' },
    },
    {
      id: 'discover-ml-rank-hy-luxury',
      locale: 'hy',
      prompt: 'Ցույց տուր ձեր լյուքս massage-ը',
      sourceFixtureId: 'rank-luxury-ru',
      domain: 'rank',
      surface: 'both',
      expectedAction: 'list_services',
      expectedParams: { serviceCategory: 'massage', serviceRank: 'highest_price' },
    },
    {
      id: 'discover-ml-rank-hy-popular',
      locale: 'hy',
      prompt: 'Ձեր ամենահ популяр haircut-ը ո՞րն է',
      sourceFixtureId: 'rank-most-popular-en',
      domain: 'rank',
      surface: 'both',
      expectedAction: 'list_services',
      expectedParams: { serviceCategory: 'haircut', serviceRank: 'most_popular' },
    },
    {
      id: 'discover-ml-rank-ru-deluxe',
      locale: 'ru',
      prompt: 'Есть ли у вас deluxe facial?',
      sourceFixtureId: 'rank-deluxe-facial-en',
      domain: 'rank',
      surface: 'both',
      expectedAction: 'list_services',
      expectedParams: { serviceCategory: 'facial', serviceRank: 'highest_price' },
    },
    {
      id: 'discover-ml-rank-ru-popular',
      locale: 'ru',
      prompt: 'Какая стрижка у вас самая популярная?',
      sourceFixtureId: 'rank-most-popular-en',
      domain: 'rank',
      surface: 'both',
      expectedAction: 'list_services',
      expectedParams: { serviceCategory: 'haircut', serviceRank: 'most_popular' },
    },
    {
      id: 'discover-ml-rank-translit-cheapest',
      locale: 'translit',
      prompt: 'Samaya deshevaya strizhka',
      sourceFixtureId: 'rank-translit-cheapest',
      domain: 'rank',
      surface: 'customer',
      expectedAction: 'list_services',
      expectedParams: { serviceCategory: 'haircut', serviceRank: 'lowest_price' },
    },
    // Availability — direct mirrors
    mirrorSourceScenario(
      'discover-ml-avail-hy-or',
      'hy',
      'availability',
      'avail-or-hy',
    ),
    mirrorSourceScenario(
      'discover-ml-avail-ru-or',
      'ru',
      'availability',
      'avail-or-ru',
    ),
    mirrorSourceScenario(
      'discover-ml-avail-translit-or',
      'translit',
      'availability',
      'avail-or-translit-en',
    ),
    {
      id: 'discover-ml-avail-hy-mon-wed',
      locale: 'hy',
      prompt: 'Massage երկուշաբթի առավոտյան կամ չորեքշաբթի',
      sourceFixtureId: 'avail-either-morning-en',
      domain: 'availability',
      surface: 'both',
      expectedAction: 'check_availability',
      expectedParams: {
        serviceCategory: 'massage',
        availabilityWindows: [
          { weekdays: ['monday'], timeOfDay: 'morning' },
          { weekdays: ['wednesday'], timeOfDay: 'morning' },
        ],
      },
    },
    {
      id: 'discover-ml-avail-hy-tonight-tomorrow',
      locale: 'hy',
      prompt: 'Haircut այս երեկոյան կամ վաղը առավոտyan',
      sourceFixtureId: 'avail-tonight-or-tomorrow-en',
      domain: 'availability',
      surface: 'both',
      expectedAction: 'check_availability',
      expectedParams: {
        serviceCategory: 'haircut',
        availabilityWindows: [
          { date: 'today', timeOfDay: 'evening' },
          { date: 'tomorrow', timeOfDay: 'morning' },
        ],
      },
    },
    {
      id: 'discover-ml-avail-ru-tomorrow-friday',
      locale: 'ru',
      prompt: 'Стрижка завтра вечером или в пятницу днём',
      sourceFixtureId: 'avail-or-tomorrow-friday-en',
      domain: 'availability',
      surface: 'both',
      expectedAction: 'check_availability',
      expectedParams: {
        serviceCategory: 'haircut',
        availabilityWindows: [
          { date: 'tomorrow', timeOfDay: 'evening' },
          { weekdays: ['friday'], timeOfDay: 'afternoon' },
        ],
      },
    },
    {
      id: 'discover-ml-avail-hy-budget-or',
      locale: 'hy',
      prompt: 'Massage 80 դոլարից ցածր, վաղը երեկոյան կամ հինգշաբթի',
      sourceFixtureId: 'avail-budget-under-or-en',
      domain: 'availability',
      surface: 'both',
      expectedAction: 'check_availability',
      expectedParams: {
        serviceCategory: 'massage',
        maxPrice: 80,
        availabilityWindows: [
          { date: 'tomorrow' },
          { weekdays: ['thursday'], timeOfDay: 'evening' },
        ],
      },
    },
    {
      id: 'discover-ml-avail-ru-weekend',
      locale: 'ru',
      prompt: 'Массаж в субботу днём или в воскресенье утром',
      sourceFixtureId: 'avail-this-weekend-or-en',
      domain: 'availability',
      surface: 'both',
      expectedAction: 'check_availability',
      expectedParams: {
        serviceCategory: 'massage',
        availabilityWindows: [
          { weekdays: ['saturday'], timeOfDay: 'afternoon' },
          { weekdays: ['sunday'], timeOfDay: 'morning' },
        ],
      },
    },
    {
      id: 'discover-ml-avail-ru-budget-or',
      locale: 'ru',
      prompt: 'Massage до 80 долларов завтра или в четверг вечером',
      sourceFixtureId: 'avail-budget-under-or-en',
      domain: 'availability',
      surface: 'both',
      expectedAction: 'check_availability',
      expectedParams: {
        serviceCategory: 'massage',
        maxPrice: 80,
        availabilityWindows: [
          { date: 'tomorrow' },
          { weekdays: ['thursday'], timeOfDay: 'evening' },
        ],
      },
    },
    ...DISCOVER_CROSS_SPRINT_MULTILINGUAL_SCENARIOS,
  ];

export const SERVICE_DISCOVERY_MULTILINGUAL_FIXTURE_IDS =
  MULTILINGUAL_SERVICE_DISCOVERY_SCENARIOS.map((scenario) => scenario.id);

export function lookupServiceDiscoverySourceFixture(
  sourceFixtureId: string,
):
  | SourceFixtureRow
  | undefined {
  return (
    SIMILAR_BUDGET_SERVICE_PROMPTS.find((row) => row.id === sourceFixtureId) ??
    SIMILAR_SERVICE_RANK_PROMPTS.find((row) => row.id === sourceFixtureId) ??
    SIMILAR_FLEXIBLE_AVAILABILITY_PROMPTS.find((row) => row.id === sourceFixtureId)
  );
}

export function serviceDiscoveryMultilingualByDomain(
  domain: ServiceDiscoveryDomain,
): ServiceDiscoveryMultilingualScenario[] {
  return MULTILINGUAL_SERVICE_DISCOVERY_SCENARIOS.filter(
    (scenario) => scenario.domain === domain,
  );
}

export function serviceDiscoveryMultilingualByLocale(
  locale: AiEvalLocale,
): ServiceDiscoveryMultilingualScenario[] {
  return MULTILINGUAL_SERVICE_DISCOVERY_SCENARIOS.filter(
    (scenario) => scenario.locale === locale,
  );
}
