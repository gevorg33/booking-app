import type { AiEvalLocale } from './eval/ai-command-eval.types.js';
import {
  RANK_DISCOVER_AND_BOOK_COMPOUND_PROMPTS,
  RANK_DISCOVER_AND_BOOK_EN_SCENARIO_IDS,
} from './ai-rank-discover-and-book-compound.fixtures.js';
import type { RankDiscoverAndBookStepAction } from './ai-rank-discover-and-book-compound.util.js';

export type RankDiscoverAndBookMultilingualScenario = {
  id: string;
  enScenarioId: string;
  locale: Extract<AiEvalLocale, 'hy' | 'ru'>;
  prompt: string;
  orderedActions: RankDiscoverAndBookStepAction[];
  paramsPartial?: Record<string, unknown>;
};

const I18N: Record<string, { hy: string; ru: string }> = {
  'rank-discover-book-premium-facial-e2e-en': {
    hy: "Rank discover and book end-to-end: show premium facial options, check who's free tomorrow evening, book the nearest slot",
    ru: 'Rank discover and book end-to-end: show premium facial options, check кто свободен tomorrow evening, book the nearest slot',
  },
  'filter-catalog-cheapest-massage-en': {
    hy: 'Filter catalog for cheapest massage, check who is free tomorrow, and book the soonest appointment',
    ru: 'Filter catalog для cheapest massage, check who is free завтра, and book the soonest appointment',
  },
  'list-popular-manicure-friday-en': {
    hy: 'List most popular manicure services, check providers available Friday, book nearest slot',
    ru: 'List most popular manicure services, check providers available пятницу, book nearest slot',
  },
  'show-luxury-color-saturday-en': {
    hy: "Show top-tier color options, who's free Saturday morning, book the earliest slot",
    ru: "Show top-tier color options, who's free Saturday morning, book the earliest slot",
  },
  'semicolon-premium-haircut-en': {
    hy: "Filter premium haircut services; check who's free tomorrow; book nearest slot",
    ru: "Filter premium haircut services; check who's free завтра; book nearest slot",
  },
  'client-deluxe-styling-en': {
    hy: 'Client wants deluxe styling — list premium options, check availability tomorrow, book soonest',
    ru: 'Client wants deluxe styling — list premium options, check availability завтра, book soonest',
  },
  'what-book-cheapest-facial-en': {
    hy: "What can we book — cheapest facial tomorrow — check who's free and book nearest",
    ru: "What can we book — cheapest facial завтра — check who's free and book nearest",
  },
  'discover-luxury-massage-en': {
    hy: 'Discover and book premium: options for massage, who is free Thursday, book ASAP',
    ru: 'Discover and book premium: options for massage, who is free четверг, book ASAP',
  },
  'e2e-cheapest-haircut-afternoon-en': {
    hy: 'End-to-end rank booking: cheapest haircut, check providers tomorrow afternoon, book first available',
    ru: 'End-to-end rank booking: cheapest haircut, check providers завтра afternoon, book first available',
  },
  'full-rank-check-book-massage-en': {
    hy: 'Full rank-check-book for luxury massage — list options, check who is free, create booking for nearest slot',
    ru: 'Full rank-check-book for luxury massage — list options, check who is free, create booking for nearest slot',
  },
  'reception-premium-haircut-en': {
    hy: "Reception: show premium haircut services, check who's available tomorrow, create booking for nearest opening",
    ru: "Reception: show premium haircut services, check who's available завтра, create booking for nearest opening",
  },
};

const EN_BY_ID = new Map(
  RANK_DISCOVER_AND_BOOK_COMPOUND_PROMPTS.map((row) => [row.id, row]),
);

function buildRankDiscoverAndBookMultilingualScenarios(): RankDiscoverAndBookMultilingualScenario[] {
  const rows: RankDiscoverAndBookMultilingualScenario[] = [];
  for (const enScenarioId of RANK_DISCOVER_AND_BOOK_EN_SCENARIO_IDS) {
    const i18n = I18N[enScenarioId];
    const enRow = EN_BY_ID.get(enScenarioId);
    if (!i18n || !enRow) continue;
    for (const locale of ['hy', 'ru'] as const) {
      rows.push({
        id: `${enScenarioId}-${locale}`,
        enScenarioId,
        locale,
        prompt: locale === 'hy' ? i18n.hy : i18n.ru,
        orderedActions: [...enRow.orderedActions],
        ...(enRow.expectedParams ? { paramsPartial: enRow.expectedParams } : {}),
      });
    }
  }
  return rows;
}

export const RANK_DISCOVER_AND_BOOK_MULTILINGUAL_SCENARIOS =
  buildRankDiscoverAndBookMultilingualScenarios();
