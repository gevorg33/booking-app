import { AI_COMMAND_EVAL_SEMANTIC_INTENT_CASES } from './eval/ai-command-eval.cases.js';
import { evaluateDeterministicEvalCase } from './eval/ai-command-eval.runner.js';
import { INTENT_ANCHOR_EN_FIRST_SCENARIOS } from './intent-anchor.bank.fixtures.js';
import {
  clearIntentAnchorBankCache,
  getIntentAnchorBank,
  INTENT_ANCHOR_BANK_PIPE_MARKER,
} from './intent-anchor.bank.js';
import {
  CORE_SEMANTIC_INTENT_ACTIONS,
  findAnchorsWithNonGenericPhrases,
  findConceptGroupsWithEntityNames,
  groupIntentAnchorsByAction,
  sortIntentAnchorsEnFirst,
} from './intent-anchor.bank.util.js';
import {
  evalCaseToIntentAnchor,
  isGenericSemanticAnchorPrompt,
} from './intent-anchor.seed.util.js';
import { harvestEvalPhrasingAnchors } from './intent-phrasing-bank.util.js';

describe('intent-anchor.bank (pipe-1.4.1)', () => {
  afterEach(() => {
    clearIntentAnchorBankCache();
  });

  it('exports pipe-1.4.1 boundary marker', () => {
    expect(INTENT_ANCHOR_BANK_PIPE_MARKER).toBe('pipe-1.4.1');
  });

  it('sorts EN anchors before HY/RU for the same action', () => {
    const bank = getIntentAnchorBank();
    const grouped = groupIntentAnchorsByAction(bank);

    for (const action of CORE_SEMANTIC_INTENT_ACTIONS) {
      const anchors = grouped.get(action) ?? [];
      expect(anchors.length).toBeGreaterThan(0);
      const firstLocale = anchors[0]?.locale;
      expect(firstLocale).toBe('en');
    }
  });

  it.each(INTENT_ANCHOR_EN_FIRST_SCENARIOS)(
    '$id — canonical EN anchor exists for $action',
    ({ action, expectedCanonicalEnAnchorId }) => {
      const bank = getIntentAnchorBank();
      const primary = bank.find(
        (anchor) => anchor.id === expectedCanonicalEnAnchorId,
      );
      expect(primary).toMatchObject({
        action,
        locale: 'en',
        source: 'canonical',
      });
    },
  );

  it('contains no entity names in anchor phrases or concept groups', () => {
    const bank = getIntentAnchorBank();
    expect(findAnchorsWithNonGenericPhrases(bank)).toEqual([]);
    expect(findConceptGroupsWithEntityNames(bank)).toEqual([]);
  });

  it('seeds eval paraphrases flagged useSemanticIntentMatch', () => {
    const bank = getIntentAnchorBank();
    const evalAnchors = bank.filter((anchor) => anchor.source === 'eval');
    const harvested = harvestEvalPhrasingAnchors(
      AI_COMMAND_EVAL_SEMANTIC_INTENT_CASES,
    );

    expect(evalAnchors.length).toBeGreaterThan(0);
    expect(evalAnchors.length).toBe(harvested.length);
    expect(
      evalAnchors.every((anchor) => anchor.id.startsWith('eval-semantic-')),
    ).toBe(true);
  });

  it.each(AI_COMMAND_EVAL_SEMANTIC_INTENT_CASES)(
    'eval case $id contributes generic anchor when harvestable',
    (evalCase) => {
      if (!isGenericSemanticAnchorPrompt(evalCase.prompt)) return;

      const anchor = evalCaseToIntentAnchor(evalCase);
      expect(anchor).not.toBeNull();
      expect(anchor?.source).toBe('eval');

      const bank = getIntentAnchorBank();
      expect(bank.some((entry) => entry.id === anchor?.id)).toBe(true);
    },
  );

  it.each(AI_COMMAND_EVAL_SEMANTIC_INTENT_CASES)(
    'eval case $id passes deterministic semantic matcher',
    (evalCase) => {
      const result = evaluateDeterministicEvalCase(evalCase);
      expect(result.errors).toEqual([]);
    },
  );

  it('sortIntentAnchorsEnFirst places canonical EN before eval HY for same action', () => {
    const sample = sortIntentAnchorsEnFirst([
      {
        id: 'eval-semantic-hy-gap',
        action: 'create_booking',
        phrase: 'hy eval phrase',
        locale: 'hy',
        surfaces: ['dashboard'],
        source: 'eval',
      },
      {
        id: 'en-book-first-available',
        action: 'create_booking',
        phrase: 'book the first available appointment slot',
        locale: 'en',
        surfaces: ['dashboard'],
        source: 'canonical',
      },
    ]);

    expect(sample[0]?.locale).toBe('en');
    expect(sample[0]?.source).toBe('canonical');
  });
});
