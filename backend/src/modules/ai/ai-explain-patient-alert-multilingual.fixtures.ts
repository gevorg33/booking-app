import type { ExplainPatientAlertFixture } from './ai-explain-patient-alert.fixtures.js';
import type { AiEvalLocale } from './eval/ai-command-eval.types.js';

export type ExplainPatientAlertMultilingualScenario =
  ExplainPatientAlertFixture & {
    locale: AiEvalLocale;
  };

export const EXPLAIN_PATIENT_ALERT_MULTILINGUAL_CLASSIFIER_RULES = `- Armenian/Russian explain patient alert (customer only):
  - explain_patient_alert: hy «Ինչ է այս կարմիր բաները», «Արդյունքները պատրաստ են — ինչ անեմ»; ru «Что это за красный баннер», «Результаты готовы — что делать». READ ConsumerPatientAlertsBanner — NOT list_my_test_results.`;

export const EXPLAIN_PATIENT_ALERT_MULTILINGUAL_SCENARIOS: readonly ExplainPatientAlertMultilingualScenario[] =
  [
    {
      id: 'red-banner-hy-customer',
      locale: 'hy',
      prompt: 'Ինչ է այս կարմիր բաները',
      surface: 'customer',
      expectedAction: 'explain_patient_alert',
      rescueReason: 'patient_alert',
      aspect: 'what_is_banner',
    },
    {
      id: 'results-ready-hy-customer',
      locale: 'hy',
      prompt: 'Արդյունքները պատրաստ են — ինչ անեմ',
      surface: 'customer',
      expectedAction: 'explain_patient_alert',
      rescueReason: 'patient_alert',
      aspect: 'results_ready',
      alertType: 'TestResultReleased',
    },
    {
      id: 'dismiss-hy-customer',
      locale: 'hy',
      prompt: 'Ինչպե՞ս փակել կլինիկայի ծանուցումը',
      surface: 'customer',
      expectedAction: 'explain_patient_alert',
      rescueReason: 'patient_alert',
      aspect: 'dismiss_alert',
    },
    {
      id: 'red-banner-ru-customer',
      locale: 'ru',
      prompt: 'Что это за красный баннер?',
      surface: 'customer',
      expectedAction: 'explain_patient_alert',
      rescueReason: 'patient_alert',
      aspect: 'what_is_banner',
    },
    {
      id: 'results-ready-ru-customer',
      locale: 'ru',
      prompt: 'Результаты готовы — что делать?',
      surface: 'customer',
      expectedAction: 'explain_patient_alert',
      rescueReason: 'patient_alert',
      aspect: 'results_ready',
      alertType: 'TestResultReleased',
    },
    {
      id: 'lab-book-ru-customer',
      locale: 'ru',
      prompt: 'Почему пишет записаться на забор крови?',
      surface: 'customer',
      expectedAction: 'explain_patient_alert',
      rescueReason: 'patient_alert',
      aspect: 'lab_booking_pending',
      alertType: 'LabBookingRequestPending',
    },
  ];
