import type { AiCommandEvalCase } from './eval/ai-command-eval.types.js';
import { AI_COMMAND_EVAL_SEMANTIC_INTENT_CASES } from './eval/ai-command-eval.cases.js';
import {
  buildCanonicalPhrasingBank,
  canonicalBankToAnchors,
  getCanonicalPhrasingBankStats,
  harvestEvalPhrasingAnchors,
  phrasingEntryToIntentAnchor,
} from './intent-phrasing-bank.util.js';
import { CANONICAL_PHRASING_BANK } from './intent-phrasing.bank.js';
import {
  clearIntentAnchorBankCache,
  getIntentAnchorBank,
} from './intent-anchor.bank.js';
import {
  rankAnchorsDeterministic,
  resolveSemanticMatch,
  SEMANTIC_CONCEPT_THRESHOLD,
} from './ai-semantic-intent.util.js';

const CORE_SEMANTIC_INTENTS = [
  'create_booking',
  'book_nearest_slot',
  'check_providers_for_service',
  'create_direct_schedule',
] as const;

describe('intent-phrasing-bank.util (acc-3.12)', () => {
  afterEach(() => {
    clearIntentAnchorBankCache();
  });

  it('maps canonical entries to anchors with source=canonical', () => {
    const anchor = phrasingEntryToIntentAnchor(
      CANONICAL_PHRASING_BANK.entries[0],
    );
    expect(anchor.source).toBe('canonical');
    expect(anchor.id).toBe('en-book-first-available');
    expect(anchor.action).toBe('create_booking');
  });

  it('reports EN/HY/RU coverage for core semantic intents', () => {
    const stats = getCanonicalPhrasingBankStats();
    expect(stats.totalEntries).toBe(CANONICAL_PHRASING_BANK.entries.length);
    for (const action of CORE_SEMANTIC_INTENTS) {
      expect(stats.intentsWithEnHyRu).toContain(action);
    }
    expect(stats.byLocale.en).toBeGreaterThan(0);
    expect(stats.byLocale.hy).toBeGreaterThan(0);
    expect(stats.byLocale.ru).toBeGreaterThan(0);
  });

  it('harvests eval cases flagged useSemanticIntentMatch without seed-util code changes', () => {
    const harvested = harvestEvalPhrasingAnchors(
      AI_COMMAND_EVAL_SEMANTIC_INTENT_CASES,
    );
    expect(harvested.length).toBeGreaterThan(0);
    expect(harvested.every((anchor) => anchor.source === 'eval')).toBe(true);
    expect(
      harvested.some((anchor) => anchor.id.startsWith('eval-semantic-')),
    ).toBe(true);
  });

  it('adds new eval paraphrases to the bank without touching seed util', () => {
    const extraCase: AiCommandEvalCase = {
      id: 'semantic-acc312-extra-paraphrase',
      prompt: 'please put me on the soonest open chair for any stylist',
      surface: 'dashboard',
      expect: {
        useSemanticIntentMatch: true,
        semanticMatchAction: 'create_booking',
        semanticMatchParamsPartial: { bookingFirstAvailable: true },
      },
    };
    const bank = buildCanonicalPhrasingBank([
      ...AI_COMMAND_EVAL_SEMANTIC_INTENT_CASES,
      extraCase,
    ]);
    expect(
      bank.some(
        (anchor) =>
          anchor.id === 'eval-semantic-acc312-extra-paraphrase' &&
          anchor.source === 'eval',
      ),
    ).toBe(true);
    expect(bank.length).toBeGreaterThan(canonicalBankToAnchors().length);
  });

  it('dedupes canonical and eval anchors on action+phrase key', () => {
    const duplicateEval: AiCommandEvalCase = {
      id: 'semantic-dup-canonical',
      prompt: CANONICAL_PHRASING_BANK.entries.find(
        (e) => e.id === 'en-book-first-available',
      )!.phrase,
      surface: 'dashboard',
      expect: {
        useSemanticIntentMatch: true,
        semanticMatchAction: 'create_booking',
      },
    };
    const bank = buildCanonicalPhrasingBank([duplicateEval]);
    const dupes = bank.filter(
      (anchor) =>
        anchor.action === 'create_booking' &&
        anchor.phrase.toLowerCase() ===
          'book the first available appointment slot'.toLowerCase(),
    );
    expect(dupes).toHaveLength(1);
    expect(dupes[0]?.source).toBe('canonical');
  });

  it.each([
    {
      locale: 'hy',
      phrase: 'ամենաառաջին ազատ ժամանակին գրանցել',
      action: 'create_booking',
    },
    {
      locale: 'ru',
      phrase: 'записать на ближайшее свободное время',
      action: 'create_booking',
    },
    {
      locale: 'hy',
      phrase: 'ամրագրիր մոտակա ազատ slot-ը',
      action: 'book_nearest_slot',
    },
    {
      locale: 'ru',
      phrase: 'запиши ближайший свободный слот',
      action: 'book_nearest_slot',
    },
    {
      locale: 'hy',
      phrase: 'ով է ազատ վաղը համար ծառայության',
      action: 'check_providers_for_service',
    },
    {
      locale: 'ru',
      phrase: 'кто свободен завтра для услуги',
      action: 'check_providers_for_service',
    },
    {
      locale: 'hy',
      phrase: 'սահմանել աշխատանքային ժամերը հաջորդ շաբաթվա համար',
      action: 'create_direct_schedule',
    },
    {
      locale: 'ru',
      phrase: 'установить рабочие часы на следующую неделю',
      action: 'create_direct_schedule',
    },
  ])(
    'canonical $locale anchor resolves $action via deterministic matcher',
    ({ phrase, action }) => {
      const match = resolveSemanticMatch(
        rankAnchorsDeterministic(phrase, getIntentAnchorBank()),
        { threshold: SEMANTIC_CONCEPT_THRESHOLD },
      );
      expect(match?.action).toBe(action);
    },
  );
});
