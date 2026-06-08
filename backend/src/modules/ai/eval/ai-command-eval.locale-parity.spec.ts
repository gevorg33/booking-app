import {
  AI_COMMAND_EVAL_DETERMINISTIC_CASES,
  AI_COMMAND_EVAL_LOCALE_PARITY_CASES,
} from './ai-command-eval.cases.js';
import {
  assertLocaleParityGate,
  buildEvalParityKey,
  buildLocaleParityReport,
  stripLocaleFromEvalId,
  translateEvalPromptForLocale,
} from './ai-command-eval.locale-parity.util.js';
import { evaluateDeterministicEvalCase } from './ai-command-eval.runner.js';

describe('ai-command-eval.locale-parity.util (acc-2.4)', () => {
  it('stripLocaleFromEvalId normalizes parity suffixes only', () => {
    expect(stripLocaleFromEvalId('show-today-parity-hy')).toBe('show-today');
    expect(stripLocaleFromEvalId('dashboard-ops-nails-10-hy-ru')).toBe(
      'dashboard-ops-nails-10-hy-ru',
    );
  });

  it('buildEvalParityKey groups explicit locale ids without breaking hy-ru scenario names', () => {
    expect(
      buildEvalParityKey({
        id: 'dashboard-ops-nails-10-hy-ru',
        prompt: 'p',
        locale: 'en',
        expect: {},
      }),
    ).toBe('dashboard-ops-nails-10-hy-ru');
    expect(
      buildEvalParityKey({
        id: 'business-currency-hy-configure',
        prompt: 'p',
        locale: 'hy',
        expect: {},
      }),
    ).toBe('business-currency-configure');
    expect(
      buildEvalParityKey({
        id: 'tax-display-en-provider-appointment-tax-lines',
        prompt: 'p',
        locale: 'en',
        expect: {},
      }),
    ).toBe('tax-display-provider-appointment-tax-lines');
  });

  it('translateEvalPromptForLocale returns curated HY/RU for core routing prompts', () => {
    expect(translateEvalPromptForLocale('Show all appointments today', 'hy')).toBe(
      'Ցույց տուր բոլոր ամրագրումները այսօր',
    );
    expect(translateEvalPromptForLocale('Show all appointments today', 'ru')).toBe(
      'Покажи все записи на сегодня',
    );
    expect(
      translateEvalPromptForLocale('Show all appointments today', 'translit'),
    ).toBe('pokazhi vse zapisi na segodnya');
  });

  it('generated locale parity cases pass deterministic eval', () => {
    const failures = AI_COMMAND_EVAL_LOCALE_PARITY_CASES.map((evalCase) =>
      evaluateDeterministicEvalCase(evalCase),
    ).filter((result) => !result.passed);
    if (failures.length > 0) {
      throw new Error(
        failures
          .slice(0, 10)
          .map((entry) => `${entry.id}: ${entry.errors.join('; ')}`)
          .join('\n'),
      );
    }
  });

  it('acc-2.4 — every EN golden case has HY and RU siblings', () => {
    assertLocaleParityGate(AI_COMMAND_EVAL_DETERMINISTIC_CASES);
    const report = buildLocaleParityReport(AI_COMMAND_EVAL_DETERMINISTIC_CASES);
    expect(report.parityPassed).toBe(true);
    expect(report.enGoldenCases).toBeGreaterThan(0);
  });

  it('parity siblings share family key with EN golden source', () => {
    for (const parityCase of AI_COMMAND_EVAL_LOCALE_PARITY_CASES.slice(0, 50)) {
      expect(parityCase.id).toContain('-parity-');
      expect(buildEvalParityKey(parityCase)).not.toContain('parity');
    }
  });
});
