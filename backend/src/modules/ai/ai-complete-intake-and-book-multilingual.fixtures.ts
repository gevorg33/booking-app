import type { CompleteIntakeAndBookPromptFixture } from './ai-complete-intake-and-book.fixtures.js';
import type { AiEvalLocale } from './eval/ai-command-eval.types.js';

export const COMPLETE_INTAKE_AND_BOOK_MULTILINGUAL_CLASSIFIER_RULES = `- Armenian/Russian complete_intake_and_book (customer + public):
  - complete_intake_and_book: hy «Լրացրու հարցաթերթիկը և ամրագրիր արյան վերցում», «Լրացնել անկետը և գրանցել լաբ թեստ»; ru «Заполни анкету и забронируй забор крови», «Заполнить форму и записаться на анализ». Mutate intake → book — NOT explain_public_intake_form.`;

export type CompleteIntakeAndBookMultilingualScenario =
  CompleteIntakeAndBookPromptFixture & {
    locale: AiEvalLocale;
  };

const HY_PROMPTS: Array<{
  id: string;
  prompt: string;
  serviceName: string;
}> = [
  {
    id: 'fill-intake-book-hy-customer',
    prompt: 'Լրացրու հարցաթերթիկը և ամրագրիր արյան վերցում',
    serviceName: 'blood draw',
  },
  {
    id: 'complete-form-lab-hy-customer',
    prompt: 'Լրացնել անկետը և գրանցել լաբ թեստ',
    serviceName: 'lab test',
  },
  {
    id: 'fill-intake-book-hy-public',
    prompt: 'Լրացրու հարցաթերթիկը և ամրագրիր արյան վերցում',
    serviceName: 'blood draw',
  },
];

const RU_PROMPTS: Array<{
  id: string;
  prompt: string;
  serviceName: string;
}> = [
  {
    id: 'fill-intake-book-ru-customer',
    prompt: 'Заполни анкету и забронируй забор крови',
    serviceName: 'blood draw',
  },
  {
    id: 'complete-form-lab-ru-public',
    prompt: 'Заполнить форму и записаться на анализ крови',
    serviceName: 'blood test',
  },
  {
    id: 'intake-then-lab-ru-customer',
    prompt: 'Заполни анкету и запиши на лабораторный тест',
    serviceName: 'lab test',
  },
];

function buildCompleteIntakeAndBookMultilingualScenarios(): CompleteIntakeAndBookMultilingualScenario[] {
  const rows: CompleteIntakeAndBookMultilingualScenario[] = [];
  for (const entry of HY_PROMPTS) {
    const surface = entry.id.endsWith('-public') ? 'public' : 'customer';
    rows.push({
      id: entry.id,
      locale: 'hy',
      prompt: entry.prompt,
      surface,
      orderedActions:
        surface === 'public'
          ? ['complete_intake_and_book', 'book_appointment']
          : ['complete_intake_and_book', 'book_nearest_slot'],
      serviceName: entry.serviceName,
      rescueReason: 'complete_intake_and_book_compound',
    });
  }
  for (const entry of RU_PROMPTS) {
    const surface = entry.id.endsWith('-public') ? 'public' : 'customer';
    rows.push({
      id: entry.id,
      locale: 'ru',
      prompt: entry.prompt,
      surface,
      orderedActions:
        surface === 'public'
          ? ['complete_intake_and_book', 'book_appointment']
          : ['complete_intake_and_book', 'book_nearest_slot'],
      serviceName: entry.serviceName,
      rescueReason: 'complete_intake_and_book_compound',
    });
  }
  return rows;
}

export const COMPLETE_INTAKE_AND_BOOK_MULTILINGUAL_SCENARIOS: CompleteIntakeAndBookMultilingualScenario[] =
  buildCompleteIntakeAndBookMultilingualScenarios();
