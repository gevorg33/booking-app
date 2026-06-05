import type { AiCommandEvalCase } from './ai-command-eval.types.js';

/** Golden NL prompts — deterministic expectations (no live OpenAI in CI). */
export const AI_COMMAND_EVAL_CASES: AiCommandEvalCase[] = [
  {
    id: 'en-show-today',
    prompt: 'Show all appointments today',
    locale: 'en',
    expect: { routeTier: 'read_only', needsMultilingual: false },
  },
  {
    id: 'en-simple-book',
    prompt: 'Book facemassage with Gevorg tomorrow at 10:00',
    locale: 'en',
    expect: { routeTier: 'simple_mutate', needsMultilingual: false },
  },
  {
    id: 'en-fallback-orchestration',
    prompt:
      'Book facemassage on Gevorg tomorrow at 9; if not available then Mary at 9; if not whoever is free',
    locale: 'en',
    expect: { routeTier: 'orchestration' },
  },
  {
    id: 'en-compound-cancel-clear',
    prompt: 'Cancel all appointments and then clear schedule for Gevorg',
    locale: 'en',
    expect: { routeTier: 'compound' },
  },
  {
    id: 'en-reschedule-am',
    prompt: "Move Maria's appointment to tomorrow at 9 AM",
    locale: 'en',
    expect: { rescheduleTimeSlot: '09:00' },
  },
  {
    id: 'en-reschedule-pm',
    prompt: 'Reschedule Jujo to Friday at 2:30 pm',
    locale: 'en',
    expect: { rescheduleTimeSlot: '14:30' },
  },
  {
    id: 'en-reschedule-to-at-pm',
    prompt: 'Move the 16:00 appointment to tomorrow at 3pm',
    locale: 'en',
    expect: { rescheduleTimeSlot: '15:00' },
  },
  {
    id: 'hy-show-today',
    prompt: 'Ցույց տուր բոլոր ամրագրումները այսօր',
    locale: 'hy',
    expect: { needsMultilingual: true },
  },
  {
    id: 'ru-book-tomorrow',
    prompt: 'Запиши массаж на Геворга завтра в 10:00',
    locale: 'ru',
    expect: { needsMultilingual: true, routeTier: 'simple_mutate' },
  },
  {
    id: 'translit-show',
    prompt: 'pokazhi vse zapisi gevorg na vagh@',
    locale: 'translit',
    expect: { needsMultilingual: true },
  },
  {
    id: 'en-clear-schedule-rescue',
    prompt: 'Clear Gevorg schedule for tomorrow',
    locale: 'en',
    expect: { rescuedAction: 'clear_schedule' },
  },
  {
    id: 'en-payment-sweep-rescue',
    prompt: 'Run payment sweep for today',
    locale: 'en',
    expect: { rescuedAction: 'payment_sweep' },
  },
];

/** Documented LLM-only cases (skipped in CI regression). */
export const AI_COMMAND_EVAL_LLM_CASES: AiCommandEvalCase[] = [
  {
    id: 'llm-hy-conditional-book',
    prompt:
      'Ամրագրիր facemassage Գևորգի հետ վաղը 09:00, եթե զբաղված է՝ Մարիայի հետ 09:00',
    locale: 'hy',
    requiresLlm: true,
    expect: { action: 'create_booking' },
  },
  {
    id: 'llm-en-bulk-cancel',
    prompt: 'Cancel all of Maria appointments next Friday between 16:30 and 17:30',
    locale: 'en',
    requiresLlm: true,
    expect: { action: 'cancel_bookings' },
  },
];
