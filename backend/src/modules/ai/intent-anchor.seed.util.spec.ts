import {
  detectSemanticPromptLocale,
  evalCaseToIntentAnchor,
  isGenericSemanticAnchorPrompt,
} from './intent-anchor.seed.util.js';
import {
  enrichAnchorConceptGroups,
  harvestEvalPhrasingAnchors,
} from './intent-phrasing-bank.util.js';
import {
  clearIntentAnchorBankCache,
  getIntentAnchorBank,
} from './intent-anchor.bank.js';
import { canonicalBankToAnchors } from './intent-phrasing-bank.util.js';
import { AI_COMMAND_EVAL_SEMANTIC_INTENT_CASES } from './eval/ai-command-eval.cases.js';
import { evaluateDeterministicEvalCase } from './eval/ai-command-eval.runner.js';
import type { AiCommandEvalCase } from './eval/ai-command-eval.types.js';

describe('intent-anchor.seed.util', () => {
  afterEach(() => {
    clearIntentAnchorBankCache();
  });

  it('detects locale from prompt script when eval case omits locale', () => {
    expect(detectSemanticPromptLocale('Запиши на ближайшее время')).toBe('ru');
    expect(detectSemanticPromptLocale('Վաղը ազատ ժամ')).toBe('hy');
    expect(detectSemanticPromptLocale('book first available')).toBe('en');
  });

  it('rejects prompts with person names', () => {
    expect(
      isGenericSemanticAnchorPrompt(
        'Move to June 11 nearest free time for Maria',
      ),
    ).toBe(false);
  });

  it('harvests only eval cases flagged useSemanticIntentMatch', () => {
    const harvested = harvestEvalPhrasingAnchors(
      AI_COMMAND_EVAL_SEMANTIC_INTENT_CASES,
    );
    expect(harvested.length).toBeGreaterThan(0);
    expect(harvested.every((anchor) => anchor.source === 'eval')).toBe(true);
  });

  it('merges canonical and eval banks without duplicate action+phrase keys', () => {
    const bank = getIntentAnchorBank();
    const keys = bank.map(
      (anchor) => `${anchor.action}::${anchor.phrase.toLowerCase()}`,
    );
    expect(new Set(keys).size).toBe(keys.length);
    expect(bank.length).toBeGreaterThan(canonicalBankToAnchors().length);
  });

  it('harvestEvalPhrasingAnchors skips cases without useSemanticIntentMatch flag', () => {
    const harvested = harvestEvalPhrasingAnchors([
      {
        id: 'no-semantic-flag',
        prompt: 'book the first available slot tomorrow',
        expect: { rescuedAction: 'create_booking' },
      },
    ]);
    expect(harvested).toEqual([]);
  });

  it('inherits Russian concept groups for eval anchors without explicit locale', () => {
    const anchor = enrichAnchorConceptGroups(
      evalCaseToIntentAnchor({
        id: 'semantic-ru-locale-inherit',
        prompt: 'Запиши на ближайшее свободное время на массаж завтра',
        surface: 'dashboard',
        expect: {
          useSemanticIntentMatch: true,
          semanticMatchAction: 'create_booking',
        },
      })!,
    );
    expect(anchor.locale).toBe('ru');
    expect(anchor.conceptGroups?.[0]).toContain('запис');
  });

  it('new eval case contributes anchor without seed-util code changes', () => {
    const newCase: AiCommandEvalCase = {
      id: 'semantic-seed-util-no-code-change',
      prompt: 'who on the team has the earliest gap for a service',
      surface: 'dashboard',
      expect: {
        useSemanticIntentMatch: true,
        semanticMatchAction: 'check_providers_for_service',
      },
    };
    const anchor = evalCaseToIntentAnchor(newCase);
    expect(anchor).toMatchObject({
      id: 'eval-semantic-seed-util-no-code-change',
      action: 'check_providers_for_service',
      source: 'eval',
    });
  });

  it.each(AI_COMMAND_EVAL_SEMANTIC_INTENT_CASES)(
    'semantic eval case $id passes deterministic matcher',
    (evalCase) => {
      const result = evaluateDeterministicEvalCase(evalCase);
      expect(result.errors).toEqual([]);
    },
  );
});
