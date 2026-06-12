import type { AiEvalLocale } from './eval/ai-command-eval.types.js';
import {
  BUDGET_DISCOVER_AND_BOOK_COMPOUND_PROMPTS,
  BUDGET_DISCOVER_AND_BOOK_EN_SCENARIO_IDS,
} from './ai-budget-discover-and-book-compound.fixtures.js';
import type { BudgetDiscoverAndBookStepAction } from './ai-budget-discover-and-book-compound.util.js';

export type BudgetDiscoverAndBookMultilingualScenario = {
  id: string;
  enScenarioId: string;
  locale: Extract<AiEvalLocale, 'hy' | 'ru'>;
  prompt: string;
  orderedActions: BudgetDiscoverAndBookStepAction[];
  paramsPartial?: Record<string, unknown>;
};

const I18N: Record<string, { hy: string; ru: string }> = {
  'budget-discover-book-haircut-50-e2e-en': {
    hy: "Budget discover and book end-to-end: show haircut options under $50, check who's free tomorrow evening, book the nearest slot",
    ru: 'Budget discover and book end-to-end: show haircut options under $50, check кто свободен tomorrow evening, book the nearest slot',
  },
  'filter-catalog-facial-60-en': {
    hy: 'Filter catalog for facials under $60, check who is free tomorrow, and book the soonest appointment',
    ru: 'Filter catalog для facials under $60, check who is free завтра, and book the soonest appointment',
  },
  'list-massage-under-40-friday-en': {
    hy: 'List services under $40 for massage, check providers available Friday, book nearest slot',
    ru: 'List services under $40 for massage, check providers available пятницу, book nearest slot',
  },
  'show-color-under-80-saturday-en': {
    hy: "Show options under $80 for color, who's free Saturday morning, book the earliest slot",
    ru: "Show options under $80 for color, who's free Saturday morning, book the earliest slot",
  },
  'semicolon-haircut-50-en': {
    hy: "Filter services under $50 for haircut; check who's free tomorrow; book nearest slot",
    ru: "Filter services under $50 for haircut; check who's free завтра; book nearest slot",
  },
  'client-styling-70-en': {
    hy: 'Client has $70 for styling — list affordable options, check availability tomorrow, book soonest',
    ru: 'Client has $70 for styling — list affordable options, check availability завтра, book soonest',
  },
  'what-book-facial-55-en': {
    hy: "What can we book under $55 for facial tomorrow — check who's free and book nearest",
    ru: "What can we book under $55 for facial завтра — check who's free and book nearest",
  },
  'discover-manicure-65-en': {
    hy: 'Discover and book under $65: options for manicure, who is free Thursday, book ASAP',
    ru: 'Discover and book under $65: options for manicure, who is free четверг, book ASAP',
  },
  'e2e-haircut-45-afternoon-en': {
    hy: 'End-to-end budget booking: haircut under $45, check providers tomorrow afternoon, book first available',
    ru: 'End-to-end budget booking: haircut under $45, check providers завтра afternoon, book first available',
  },
  'full-filter-check-book-90-en': {
    hy: 'Full filter-check-book for massage under $90 — list options, check who is free, create booking for nearest slot',
    ru: 'Full filter-check-book for massage under $90 — list options, check who is free, create booking for nearest slot',
  },
  'reception-haircut-50-en': {
    hy: "Reception: show haircut services under $50, check who's available tomorrow, create booking for nearest opening",
    ru: "Reception: show haircut services under $50, check who's available завтра, create booking for nearest opening",
  },
};

const EN_BY_ID = new Map(
  BUDGET_DISCOVER_AND_BOOK_COMPOUND_PROMPTS.map((row) => [row.id, row]),
);

function buildBudgetDiscoverAndBookMultilingualScenarios(): BudgetDiscoverAndBookMultilingualScenario[] {
  const rows: BudgetDiscoverAndBookMultilingualScenario[] = [];
  for (const enScenarioId of BUDGET_DISCOVER_AND_BOOK_EN_SCENARIO_IDS) {
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

export const BUDGET_DISCOVER_AND_BOOK_MULTILINGUAL_SCENARIOS =
  buildBudgetDiscoverAndBookMultilingualScenarios();
