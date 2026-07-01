import type { AiEvalLocale } from './eval/ai-command-eval.types.js';
import type { ReportBookingProblemAspect } from './ai-report-booking-problem.fixtures.js';

export type ReportBookingProblemMultilingualScenario = {
  id: string;
  locale: AiEvalLocale;
  prompt: string;
  surface: 'customer';
  expectedAction: 'report_booking_problem';
  rescueReason: 'report_booking_problem';
  aspect?: ReportBookingProblemAspect;
};

export const REPORT_BOOKING_PROBLEM_MULTILINGUAL_CLASSIFIER_RULES = `- Armenian/Russian booking problem reports (customer mobile):
  - report_booking_problem: hy «ինչ-որ բան սխալ էր իմ այցի հետ», «երկու անգամ գանձվել է»; ru «что-то пошло не так с визитом», «меня списали дважды». Visit/billing issue on own booking — NOT leave_visit_review, NOT contact_support.`;

export const REPORT_BOOKING_PROBLEM_MULTILINGUAL_SCENARIOS: readonly ReportBookingProblemMultilingualScenario[] =
  [
    {
      id: 'something-wrong-hy-customer',
      locale: 'hy',
      prompt: 'Ինչ-որ բան սխալ էր իմ այցի հետ',
      surface: 'customer',
      expectedAction: 'report_booking_problem',
      rescueReason: 'report_booking_problem',
      aspect: 'visit_issue',
    },
    {
      id: 'charged-twice-hy-customer',
      locale: 'hy',
      prompt: 'Երկու անգամ գանձվել է',
      surface: 'customer',
      expectedAction: 'report_booking_problem',
      rescueReason: 'report_booking_problem',
      aspect: 'billing_issue',
    },
    {
      id: 'report-problem-hy-customer',
      locale: 'hy',
      prompt: 'Զեկուցել խնդիր իմ ամրագրումի մասին',
      surface: 'customer',
      expectedAction: 'report_booking_problem',
      rescueReason: 'report_booking_problem',
    },
    {
      id: 'something-wrong-ru-customer',
      locale: 'ru',
      prompt: 'Что-то пошло не так с моим визитом',
      surface: 'customer',
      expectedAction: 'report_booking_problem',
      rescueReason: 'report_booking_problem',
      aspect: 'visit_issue',
    },
    {
      id: 'charged-twice-ru-customer',
      locale: 'ru',
      prompt: 'Меня списали дважды',
      surface: 'customer',
      expectedAction: 'report_booking_problem',
      rescueReason: 'report_booking_problem',
      aspect: 'billing_issue',
    },
    {
      id: 'report-problem-ru-customer',
      locale: 'ru',
      prompt: 'Сообщить о проблеме с моей записью',
      surface: 'customer',
      expectedAction: 'report_booking_problem',
      rescueReason: 'report_booking_problem',
    },
  ];
