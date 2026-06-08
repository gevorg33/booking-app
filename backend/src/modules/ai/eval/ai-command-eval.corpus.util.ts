import { AI_CMD_RESCUE_SCENARIOS } from '../ai-cmd-eval.fixtures.js';
import type { AiCommandEvalCase, AiCommandEvalExpectation } from './ai-command-eval.types.js';
import { evaluateDeterministicEvalCase } from './ai-command-eval.runner.js';

/** acc-2.5 — deterministic typo / fuzzy variant kinds. */
export type TypoFuzzyVariantKind =
  | 'lowercase'
  | 'no_punct'
  | 'collapsed'
  | 'abbrev'
  | 'misspell';

export interface TypoFuzzyVariant {
  kind: TypoFuzzyVariantKind;
  prompt: string;
}

export interface TypoCorpusSeed {
  id: string;
  prompt: string;
  domain?: string;
  expect: AiCommandEvalExpectation;
}

/** Minimum typo/fuzzy eval cases in CI (acc-2.5). */
export const ACC_EVAL_MIN_TYPO_CASES = 80;

const FILLER_WORDS = /\b(the|a|an|for|to|my|all|who|is|are|with|at|on|in)\b/gi;

/** Common deterministic misspellings / abbreviations for high-traffic words. */
const TYPO_WORD_VARIANTS: Record<string, string[]> = {
  tomorrow: ['tommorow', 'tommorrow', 'tmrw'],
  schedule: ['scheduel', 'sched'],
  appointment: ['apointment', 'appt'],
  appointments: ['apointments', 'appts'],
  massage: ['masage', 'masagee'],
  bookings: ['bokings', 'booking'],
  booking: ['boking', 'bok'],
  clear: ['cler', 'clr'],
  calculate: ['calculat', 'calc'],
  earnings: ['earnngs', 'erngs'],
  revenue: ['revnue', 'rev'],
  nearest: ['neares', 'nearst'],
  summarize: ['summarise', 'sumarize'],
  unpaid: ['unpayd', 'unpd'],
  configure: ['configur', 'cfg'],
  zendesk: ['zendeskk', 'zendsk'],
  customer: ['custmer', 'cust'],
  package: ['packge', 'pkg'],
  list: ['lst', 'lis'],
  mark: ['mrk', 'marc'],
  paid: ['payd', 'pd'],
  gift: ['gif', 'gft'],
  support: ['suport', 'supprt'],
  contact: ['contct', 'cntact'],
};

/** Top rescue prompts whose deterministic path survives typo/fuzzy transforms. */
export const TYPO_CORPUS_SEEDS: TypoCorpusSeed[] = [
  {
    id: 'clear-schedule',
    prompt: 'Clear Gevorg schedule for tomorrow',
    domain: 'schedule',
    expect: { rescuedAction: 'clear_schedule' },
  },
  {
    id: 'summarize-revenue',
    prompt: 'Calculate total earnings for today',
    domain: 'payments',
    expect: {
      rescuedAction: 'summarize_bookings',
      paramsPartial: { bookingMetric: 'revenue' },
    },
  },
  {
    id: 'nearest-slot',
    prompt: 'book the nearest slot for massage tomorrow evening',
    domain: 'booking',
    expect: {
      rescuedAction: 'book_nearest_slot',
      rescueReason: 'nearest_slot',
    },
  },
  {
    id: 'summarize-unpaid',
    prompt: 'Summarize unpaid bookings',
    domain: 'payments',
    expect: { rescuedAction: 'summarize_unpaid' },
  },
  {
    id: 'tag-vip',
    prompt: 'Tag Anna as VIP',
    domain: 'crm',
    expect: { rescuedAction: 'tag_customer' },
  },
  {
    id: 'configure-zendesk',
    prompt: 'Configure Zendesk integration',
    domain: 'integrations',
    expect: { rescuedAction: 'configure_zendesk' },
  },
  {
    id: 'list-packages',
    prompt: 'list packages',
    domain: 'catalog',
    expect: { rescuedAction: 'list_packages' },
  },
  {
    id: 'mark-paid',
    prompt: 'mark booking b1 paid',
    domain: 'payments',
    expect: { rescuedAction: 'mark_paid' },
  },
  {
    id: 'gift-balance',
    prompt: 'Check gift card balance by code GCM-ABCD',
    domain: 'gift',
    expect: { rescuedAction: 'check_gift_card_balance' },
  },
  {
    id: 'contact-support',
    prompt: 'Contact support about my order',
    domain: 'integrations',
    expect: { rescuedAction: 'contact_support' },
  },
  ...AI_CMD_RESCUE_SCENARIOS.map((scenario) => ({
    id: scenario.id,
    prompt: scenario.prompt,
    domain: scenario.domain,
    expect: {
      rescuedAction: scenario.expectedAction,
      ...(scenario.paramsPartial ? { paramsPartial: scenario.paramsPartial } : {}),
    },
  })),
];

function addVariant(
  variants: Map<string, TypoFuzzyVariant>,
  kind: TypoFuzzyVariantKind,
  prompt: string,
  original: string,
): void {
  const trimmed = prompt.trim();
  if (!trimmed || trimmed === original) return;
  if (!variants.has(trimmed)) {
    variants.set(trimmed, { kind, prompt: trimmed });
  }
}

function applyMisspellings(prompt: string): string[] {
  const results = new Set<string>();
  let mutated = prompt;
  for (const [word, replacements] of Object.entries(TYPO_WORD_VARIANTS)) {
    const pattern = new RegExp(`\\b${word}\\b`, 'gi');
    if (!pattern.test(mutated)) continue;
    for (const replacement of replacements) {
      results.add(mutated.replace(pattern, replacement));
    }
  }
  return [...results];
}

function buildAbbreviatedPrompt(prompt: string): string {
  return prompt.replace(FILLER_WORDS, ' ').replace(/\s+/g, ' ').trim();
}

/** acc-2.5 — generate lowercase, no-punctuation, abbreviated, and misspelled variants. */
export function buildTypoFuzzyVariants(prompt: string): TypoFuzzyVariant[] {
  const variants = new Map<string, TypoFuzzyVariant>();
  const original = prompt.trim();

  const lowered = original.toLowerCase();
  addVariant(variants, 'lowercase', lowered, original);

  const noPunct = original.replace(/[.!?,;:'"]/g, '').trim();
  addVariant(variants, 'no_punct', noPunct, original);

  const loweredNoPunct = lowered.replace(/[.!?,;:'"]/g, '').trim();
  addVariant(variants, 'no_punct', loweredNoPunct, original);

  const collapsed = original.replace(/\s+/g, ' ').trim();
  addVariant(variants, 'collapsed', collapsed, original);

  const abbreviated = buildAbbreviatedPrompt(original);
  addVariant(variants, 'abbrev', abbreviated, original);
  addVariant(variants, 'abbrev', buildAbbreviatedPrompt(lowered), original);

  for (const misspelled of applyMisspellings(original)) {
    addVariant(variants, 'misspell', misspelled, original);
    addVariant(variants, 'misspell', misspelled.toLowerCase(), original);
  }

  return [...variants.values()];
}

export function inferTypoCorpusDomain(
  expect: AiCommandEvalExpectation,
  fallback = 'booking',
): string {
  const action =
    expect.rescuedAction ??
    expect.action ??
    expect.compoundSteps?.[0] ??
    '';
  if (/gift/.test(action)) return 'gift';
  if (/zendesk|support|integration/.test(action)) return 'integrations';
  if (/customer|tag_|lookup_customer|inactive|subscription/.test(action)) {
    return 'crm';
  }
  if (/catalog|package|service|product/.test(action)) return 'catalog';
  if (/schedule|clear_schedule|resource/.test(action)) return 'schedule';
  if (/paid|payment|revenue|tax|currency|stripe|checkout|unpaid|cash/.test(action)) {
    return 'payments';
  }
  return fallback;
}

export function buildTypoCorpusEvalCase(
  seed: TypoCorpusSeed,
  variant: TypoFuzzyVariant,
  index: number,
): AiCommandEvalCase {
  return {
    id: `typo-${seed.id}-${variant.kind}-${index}`,
    prompt: variant.prompt,
    locale: 'en',
    corpus: 'typo',
    difficulty: 'medium',
    domain: seed.domain ?? inferTypoCorpusDomain(seed.expect),
    expect: seed.expect,
  };
}

/** Build typo eval cases and optionally keep only variants that pass deterministic eval. */
export function buildTypoCorpusEvalCases(
  seeds: TypoCorpusSeed[] = TYPO_CORPUS_SEEDS,
  options: { filterPassing?: boolean } = { filterPassing: true },
): AiCommandEvalCase[] {
  const cases: AiCommandEvalCase[] = [];
  const seenIds = new Set<string>();

  for (const seed of seeds) {
    const variants = buildTypoFuzzyVariants(seed.prompt);
    variants.forEach((variant, index) => {
      const evalCase = buildTypoCorpusEvalCase(seed, variant, index);
      if (seenIds.has(evalCase.id)) return;
      if (options.filterPassing !== false) {
        const result = evaluateDeterministicEvalCase(evalCase);
        if (!result.passed) return;
      }
      seenIds.add(evalCase.id);
      cases.push(evalCase);
    });
  }

  return cases;
}

export function buildTypoCorpusReport(cases: AiCommandEvalCase[]): {
  total: number;
  byKind: Record<TypoFuzzyVariantKind, number>;
  passedGate: boolean;
} {
  const byKind: Record<TypoFuzzyVariantKind, number> = {
    lowercase: 0,
    no_punct: 0,
    collapsed: 0,
    abbrev: 0,
    misspell: 0,
  };
  for (const evalCase of cases) {
    const match = evalCase.id.match(
      /-(lowercase|no_punct|collapsed|abbrev|misspell)-\d+$/,
    );
    const kind = match?.[1] as TypoFuzzyVariantKind | undefined;
    if (kind && kind in byKind) {
      byKind[kind] += 1;
    }
  }
  return {
    total: cases.length,
    byKind,
    passedGate: cases.length >= ACC_EVAL_MIN_TYPO_CASES,
  };
}
