import type { ClassificationSurface } from './ai-classification-engine.types.js';
import { N99_SCREEN_GROUNDING_SCENARIOS } from './ai-n99-screen-grounding.fixtures.js';

export { N99_NO_CLARIFY_OVER_ASK_SCENARIOS } from './ai-n99-over-ask.fixtures.js';

/** n99-2 — near-99% completion without clarify. */
export const NO_CLARIFY_NEAR_99_TARGET = 0.99;
export const NO_CLARIFY_EVAL_FLOOR = 0.9;
export const NO_CLARIFY_WRONG_EXEC_CEILING = 0.01;
export const NO_CLARIFY_NEAR_99_MIN_SAMPLE = 20;
export const NO_CLARIFY_NEAR_99_LOCALE_SPREAD_MAX = 0.03;
export const NO_CLARIFY_NEAR_99_PRIMARY_LOCALES = ['en', 'hy', 'ru'] as const;

export const N99_NO_CLARIFY_AUTOFILL_SCENARIOS = [
  {
    id: 'en-last-provider',
    prompt: 'book massage tomorrow at 10',
    action: 'create_booking',
    params: { serviceName: 'Massage', date: '2026-06-09', timeSlot: '10:00' },
    sessionContext: { lastEmployeeName: 'Anna Smith' },
    expectFilled: { employeeName: 'Anna Smith' },
  },
  {
    id: 'en-usual-service',
    prompt: 'book the usual with gevorg tomorrow at 2pm',
    action: 'create_booking',
    params: { employeeName: 'Gevorg Gasparyan', date: '2026-06-09' },
    entityMemory: {
      aliases: { 'the usual': { serviceName: 'Facemassage' } },
    },
    expectFilled: { serviceName: 'Facemassage' },
  },
  {
    id: 'en-first-available',
    prompt: 'book haircut tomorrow first available',
    action: 'create_booking',
    params: { serviceName: 'Haircut', date: '2026-06-09' },
    expectFilled: { bookingFirstAvailable: true },
  },
  {
    id: 'hy-usual-alias',
    prompt: 'ամրագրել սովորականը gevorg-ի հետ',
    action: 'create_booking',
    params: { employeeName: 'Gevorg Gasparyan' },
    entityMemory: {
      aliases: { 'սովորական': { serviceName: 'Massage' } },
    },
    expectFilled: { serviceName: 'Massage' },
  },
  {
    id: 'ru-default-duration',
    prompt: 'записаться на стрижку завтра в 11:00',
    action: 'create_booking',
    params: { serviceName: 'Haircut', date: '2026-06-09', timeSlot: '11:00' },
    sessionContext: { lastEmployeeName: 'Maria Lopez' },
    expectFilled: { employeeName: 'Maria Lopez' },
  },
  {
    id: 'en-all-providers-slot',
    prompt: 'any provider for color tomorrow 9am',
    action: 'create_booking',
    params: { serviceName: 'Color', date: '2026-06-09', timeSlot: '09:00' },
    expectFilled: { allProviders: true },
  },
] as const;

export {
  N99_AUTOFILL_PREVIEW_SCENARIOS,
  N99_AUTOFILL_WATCHDOG_SCENARIOS,
  N99_AUTOFILL_WATCHDOG_TRACE_SCENARIOS,
  N99_NO_CLARIFY_WATCHDOG_SCENARIOS,
} from './ai-n99-wrong-execution-watchdog.fixtures.js';
export {
  N99_AMBIGUOUS_DESTRUCTIVE_SCENARIOS,
  N99_NO_CLARIFY_GUARDRAIL_SCENARIOS,
} from './ai-n99-ambiguous-destructive-clarify.fixtures.js';

export const N99_NO_CLARIFY_GATE_SCENARIOS = [
  {
    id: 'all-met',
    input: {
      noClarifyRate: 0.995,
      wrongExecutionRate: 0.004,
      sampleSize: 120,
      localeSpread: 0.02,
      insufficientLocales: [] as string[],
    },
    expectMet: true,
  },
  {
    id: 'low-no-clarify',
    input: {
      noClarifyRate: 0.88,
      wrongExecutionRate: 0.004,
      sampleSize: 120,
      localeSpread: 0.02,
      insufficientLocales: [] as string[],
    },
    expectMet: false,
  },
  {
    id: 'high-wrong-exec',
    input: {
      noClarifyRate: 0.995,
      wrongExecutionRate: 0.015,
      sampleSize: 120,
      localeSpread: 0.02,
      insufficientLocales: [] as string[],
    },
    expectMet: false,
  },
] as const;

export type N99NoClarifySurface = ClassificationSurface;

export { N99_SCREEN_GROUNDING_SCENARIOS };
