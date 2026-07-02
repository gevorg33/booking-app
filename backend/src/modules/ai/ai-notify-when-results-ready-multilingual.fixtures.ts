import type { NotifyWhenResultsReadyFixture } from './ai-notify-when-results-ready.fixtures.js';
import type { AiEvalLocale } from './eval/ai-command-eval.types.js';

export type NotifyWhenResultsReadyMultilingualScenario =
  NotifyWhenResultsReadyFixture & {
    locale: AiEvalLocale;
  };

export const NOTIFY_WHEN_RESULTS_READY_MULTILINGUAL_CLASSIFIER_RULES = `- Armenian/Russian notify when results ready (customer only):
  - notify_when_results_ready: hy «Գրիր ինձ, երբ արդյունքները պատրաստ լինեն», «Տեղեկացրիր ինձ, երբ լաբ արդյունքները պատրաստ են»; ru «Напиши мне, когда результаты будут готовы», «Уведомь меня, когда анализы готовы». READ result-ready notification explain — NOT notify_patient_result_ready.`;

export const NOTIFY_WHEN_RESULTS_READY_MULTILINGUAL_SCENARIOS: readonly NotifyWhenResultsReadyMultilingualScenario[] =
  [
    {
      id: 'text-me-hy-customer',
      locale: 'hy',
      prompt: 'Գրիր ինձ, երբ արդյունքները պատրաստ լինեն',
      surface: 'customer',
      expectedAction: 'notify_when_results_ready',
      rescueReason: 'notify_when_results_ready',
      aspect: 'subscribe_explain',
      channel: 'text',
    },
    {
      id: 'notify-me-hy-customer',
      locale: 'hy',
      prompt: 'Տեղեկացրիր ինձ, երբ լաբ արդյունքները պատրաստ են',
      surface: 'customer',
      expectedAction: 'notify_when_results_ready',
      rescueReason: 'notify_when_results_ready',
      aspect: 'subscribe_explain',
    },
    {
      id: 'how-notified-hy-customer',
      locale: 'hy',
      prompt: 'Ինչպե՞ս կտեղեկացնեք, երբ արդյունքները թողարկվեն',
      surface: 'customer',
      expectedAction: 'notify_when_results_ready',
      rescueReason: 'notify_when_results_ready',
      aspect: 'how_it_works',
    },
    {
      id: 'text-me-ru-customer',
      locale: 'ru',
      prompt: 'Напиши мне, когда результаты будут готовы',
      surface: 'customer',
      expectedAction: 'notify_when_results_ready',
      rescueReason: 'notify_when_results_ready',
      aspect: 'subscribe_explain',
      channel: 'text',
    },
    {
      id: 'notify-me-ru-customer',
      locale: 'ru',
      prompt: 'Уведомь меня, когда анализы готовы',
      surface: 'customer',
      expectedAction: 'notify_when_results_ready',
      rescueReason: 'notify_when_results_ready',
      aspect: 'subscribe_explain',
    },
    {
      id: 'push-ru-customer',
      locale: 'ru',
      prompt: 'Пришлите push, когда мои лабораторные результаты готовы',
      surface: 'customer',
      expectedAction: 'notify_when_results_ready',
      rescueReason: 'notify_when_results_ready',
      aspect: 'push_channel',
      channel: 'push',
    },
  ];
