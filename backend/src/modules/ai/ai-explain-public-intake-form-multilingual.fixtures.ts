import type { AiEvalLocale } from './eval/ai-command-eval.types.js';
import type { ExplainPublicIntakeFormAspect } from './ai-explain-public-intake-form.fixtures.js';

export type ExplainPublicIntakeFormMultilingualScenario = {
  id: string;
  locale: AiEvalLocale;
  prompt: string;
  surface: 'customer' | 'public';
  expectedAction: 'explain_public_intake_form';
  rescueReason: 'public_intake_form';
  aspect?: ExplainPublicIntakeFormAspect;
};

export const EXPLAIN_PUBLIC_INTAKE_FORM_MULTILINGUAL_CLASSIFIER_RULES = `- Armenian/Russian explain public intake form (customer + public):
  - explain_public_intake_form: hy «Ինչու են այս առողջության հարցերը», «Կարո՞ղ եմ բաց թողնել ձևը»; ru «Почему эти вопросы о здоровье», «Можно пропустить анкету». READ publicIntakeCheckout — NOT explain_clinic_booking_fields ID fields.`;

export const EXPLAIN_PUBLIC_INTAKE_FORM_MULTILINGUAL_SCENARIOS: readonly ExplainPublicIntakeFormMultilingualScenario[] =
  [
    {
      id: 'why-questions-hy-public',
      locale: 'hy',
      prompt: 'Ինչու են այս առողջության հարցերը',
      surface: 'public',
      expectedAction: 'explain_public_intake_form',
      rescueReason: 'public_intake_form',
      aspect: 'why_questions',
    },
    {
      id: 'skip-form-hy-customer',
      locale: 'hy',
      prompt: 'Կարո՞ղ եմ բաց թողնել ձևը',
      surface: 'customer',
      expectedAction: 'explain_public_intake_form',
      rescueReason: 'public_intake_form',
      aspect: 'skip_form',
    },
    {
      id: 'what-questionnaire-hy-customer',
      locale: 'hy',
      prompt: 'Ինչ է նախապոստ այցի հարցաթերթիկը',
      surface: 'customer',
      expectedAction: 'explain_public_intake_form',
      rescueReason: 'public_intake_form',
      aspect: 'what_is_form',
    },
    {
      id: 'why-questions-ru-public',
      locale: 'ru',
      prompt: 'Почему эти вопросы о здоровье?',
      surface: 'public',
      expectedAction: 'explain_public_intake_form',
      rescueReason: 'public_intake_form',
      aspect: 'why_questions',
    },
    {
      id: 'skip-form-ru-customer',
      locale: 'ru',
      prompt: 'Можно пропустить анкету?',
      surface: 'customer',
      expectedAction: 'explain_public_intake_form',
      rescueReason: 'public_intake_form',
      aspect: 'skip_form',
    },
    {
      id: 'how-works-ru-public',
      locale: 'ru',
      prompt: 'Как работает анкета перед визитом?',
      surface: 'public',
      expectedAction: 'explain_public_intake_form',
      rescueReason: 'public_intake_form',
      aspect: 'how_it_works',
    },
  ];
