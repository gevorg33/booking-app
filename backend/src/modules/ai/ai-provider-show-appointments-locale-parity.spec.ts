import {
  AI_COMMAND_EVAL_DETERMINISTIC_CASES,
  AI_COMMAND_EVAL_PROVIDER_SHOW_APPOINTMENTS_CASES,
} from './eval/ai-command-eval.cases.js';
import {
  AI_COMMAND_EVAL_PROVIDER_SHOW_APPOINTMENTS_MULTILINGUAL_CASES,
  listProviderShowAppointmentsEvalLocaleParityGaps,
  providerShowAppointmentsMultilingualEvalCaseId,
} from './ai-provider-show-appointments-multilingual.eval.util.js';
import { PROVIDER_SHOW_APPOINTMENTS_MULTILINGUAL_SCENARIOS } from './ai-provider-show-appointments-multilingual.fixtures.js';
import { listProviderShowAppointmentsLocaleParityGaps } from './ai-provider-show-appointments-locale-parity.util.js';
import {
  isShowAppointmentsPrompt,
  rescueShowAppointmentsIntent,
} from './ai-provider-show-appointments.util.js';
import { evaluateDeterministicEvalCase } from './eval/ai-command-eval.runner.js';

describe('ai provider show_appointments locale parity (acc-2.4 / ai-cmd-provider-5.0.3)', () => {
  it('ships HY and RU fixture siblings for every EN provider show_appointments scenario', () => {
    expect(listProviderShowAppointmentsLocaleParityGaps()).toEqual([]);
  });

  it('maps every provider show_appointments i18n fixture row to an eval golden case', () => {
    expect(
      listProviderShowAppointmentsEvalLocaleParityGaps(
        AI_COMMAND_EVAL_DETERMINISTIC_CASES,
      ),
    ).toEqual([]);
  });

  it.each(
    PROVIDER_SHOW_APPOINTMENTS_MULTILINGUAL_SCENARIOS.map((scenario) => [
      scenario.id,
      scenario,
    ]),
  )('passes provider show_appointments i18n eval case %s', (_id, scenario) => {
    const evalCase =
      AI_COMMAND_EVAL_PROVIDER_SHOW_APPOINTMENTS_MULTILINGUAL_CASES.find(
        (row) =>
          row.id === providerShowAppointmentsMultilingualEvalCaseId(scenario),
      );
    expect(evalCase).toBeDefined();
    const result = evaluateDeterministicEvalCase(evalCase!);
    expect(result.passed).toBe(true);
  });

  it.each(
    PROVIDER_SHOW_APPOINTMENTS_MULTILINGUAL_SCENARIOS.map((scenario) => [
      scenario.id,
      scenario,
    ]),
  )('rescues provider show_appointments i18n prompt %s', (_id, scenario) => {
    expect(
      rescueShowAppointmentsIntent(scenario.prompt, 'unknown'),
    ).toMatchObject({
      action: scenario.expectedAction,
      rescueReason: scenario.rescueReason,
    });
  });

  it.each(
    PROVIDER_SHOW_APPOINTMENTS_MULTILINGUAL_SCENARIOS.map((scenario) => [
      scenario.id,
      scenario.prompt,
    ]),
  )('detects show_appointments i18n prompt %s', (_id, prompt) => {
    expect(isShowAppointmentsPrompt(prompt)).toBe(true);
  });

  it('tags HY/RU provider show_appointments eval rows with provider surface and locale', () => {
    const hyCases = [
      ...AI_COMMAND_EVAL_PROVIDER_SHOW_APPOINTMENTS_CASES.filter(
        (row) => row.locale === 'hy',
      ),
      ...AI_COMMAND_EVAL_PROVIDER_SHOW_APPOINTMENTS_MULTILINGUAL_CASES.filter(
        (row) => row.locale === 'hy',
      ),
    ];
    const ruCases = [
      ...AI_COMMAND_EVAL_PROVIDER_SHOW_APPOINTMENTS_CASES.filter(
        (row) => row.locale === 'ru',
      ),
      ...AI_COMMAND_EVAL_PROVIDER_SHOW_APPOINTMENTS_MULTILINGUAL_CASES.filter(
        (row) => row.locale === 'ru',
      ),
    ];

    expect(hyCases.length).toBe(12);
    expect(ruCases.length).toBe(12);
    expect(hyCases.every((row) => row.surface === 'provider')).toBe(true);
    expect(ruCases.every((row) => row.surface === 'provider')).toBe(true);
    expect(
      AI_COMMAND_EVAL_PROVIDER_SHOW_APPOINTMENTS_MULTILINGUAL_CASES.every(
        (row) => row.expect.needsMultilingual === true,
      ),
    ).toBe(true);
  });
});
