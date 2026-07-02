import type { AiEvalLocale } from './eval/ai-command-eval.types.js';
import type { PreparationNotesAspect } from './ai-explain-preparation-notes.fixtures.js';

export type ExplainPreparationNotesMultilingualScenario = {
  id: string;
  locale: AiEvalLocale;
  prompt: string;
  surface: 'customer' | 'public';
  expectedAction: 'explain_preparation_notes';
  aspect: PreparationNotesAspect;
  rescueReason: 'preparation_notes';
};

export const EXPLAIN_PREPARATION_NOTES_MULTILINGUAL_CLASSIFIER_RULES = `- Armenian/Russian visit preparation (customer + public booking):
  - explain_preparation_notes: hy «Պետք է լինեմ ծոմավորո՞ւմ», «Ինչ պետք է բերեմ»; ru «Нужно ли голодать», «Что взять с собой». Fasting, prep notes, what to bring for booked visit. NOT explain_tour_meeting_point (tour meeting/arrival). NOT explain_clinic_booking (checkout form fields).`;

export const EXPLAIN_PREPARATION_NOTES_MULTILINGUAL_SCENARIOS: ExplainPreparationNotesMultilingualScenario[] =
  [
    {
      id: 'fasting-hy-customer',
      locale: 'hy',
      prompt: 'Պետք է լինեմ ծոմավորո՞ւմ իմ այցից առաջ',
      surface: 'customer',
      expectedAction: 'explain_preparation_notes',
      aspect: 'fasting',
      rescueReason: 'preparation_notes',
    },
    {
      id: 'bring-hy-customer',
      locale: 'hy',
      prompt: 'Ինչ պետք է բերեմ իմ այցի համար',
      surface: 'customer',
      expectedAction: 'explain_preparation_notes',
      aspect: 'what_to_bring',
      rescueReason: 'preparation_notes',
    },
    {
      id: 'fasting-ru-customer',
      locale: 'ru',
      prompt: 'Нужно ли голодать перед моим визитом?',
      surface: 'customer',
      expectedAction: 'explain_preparation_notes',
      aspect: 'fasting',
      rescueReason: 'preparation_notes',
    },
    {
      id: 'bring-ru-customer',
      locale: 'ru',
      prompt: 'Что взять с собой на приём?',
      surface: 'customer',
      expectedAction: 'explain_preparation_notes',
      aspect: 'what_to_bring',
      rescueReason: 'preparation_notes',
    },
    {
      id: 'prep-hy-public',
      locale: 'hy',
      prompt: 'Ինչպես պատրաստվել իմ այցի համար',
      surface: 'public',
      expectedAction: 'explain_preparation_notes',
      aspect: 'all',
      rescueReason: 'preparation_notes',
    },
    {
      id: 'prep-ru-public',
      locale: 'ru',
      prompt: 'Как подготовиться к моему визиту?',
      surface: 'public',
      expectedAction: 'explain_preparation_notes',
      aspect: 'all',
      rescueReason: 'preparation_notes',
    },
  ];
