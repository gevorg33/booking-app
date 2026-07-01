import type { AiEvalLocale } from './eval/ai-command-eval.types.js';

export type LeaveVisitReviewMultilingualScenario = {
  id: string;
  locale: AiEvalLocale;
  prompt: string;
  surface: 'customer';
  expectedAction: 'leave_visit_review';
  rescueReason: 'leave_visit_review';
  rating?: number;
  serviceName?: string;
};

export const LEAVE_VISIT_REVIEW_MULTILINGUAL_CLASSIFIER_RULES = `- Armenian/Russian post-visit review (customer mobile):
  - leave_visit_review: hy «գնահատիր վերջին այցը», «թողեք կարծիք այսօրվա սանրվածքի համար»; ru «оцените мой последний визит», «оставьте отзыв о стрижке». Customer rates completed visit — NOT explain_post_visit_review_prompt, NOT report_booking_problem.`;

export const LEAVE_VISIT_REVIEW_MULTILINGUAL_SCENARIOS: readonly LeaveVisitReviewMultilingualScenario[] =
  [
    {
      id: 'rate-last-visit-hy-customer',
      locale: 'hy',
      prompt: 'Գնահատիր վերջին այցը',
      surface: 'customer',
      expectedAction: 'leave_visit_review',
      rescueReason: 'leave_visit_review',
    },
    {
      id: 'leave-review-haircut-hy-customer',
      locale: 'hy',
      prompt: 'Թողեք կարծիք այսօրվա սանրվածքի համար',
      surface: 'customer',
      expectedAction: 'leave_visit_review',
      rescueReason: 'leave_visit_review',
      serviceName: 'haircut',
    },
    {
      id: 'five-stars-hy-customer',
      locale: 'hy',
      prompt: '5 աստղ վերջին այցի համար',
      surface: 'customer',
      expectedAction: 'leave_visit_review',
      rescueReason: 'leave_visit_review',
      rating: 5,
    },
    {
      id: 'rate-last-visit-ru-customer',
      locale: 'ru',
      prompt: 'Оцените мой последний визит',
      surface: 'customer',
      expectedAction: 'leave_visit_review',
      rescueReason: 'leave_visit_review',
    },
    {
      id: 'leave-review-haircut-ru-customer',
      locale: 'ru',
      prompt: 'Оставьте отзыв о сегодняшней стрижке',
      surface: 'customer',
      expectedAction: 'leave_visit_review',
      rescueReason: 'leave_visit_review',
      serviceName: 'haircut',
    },
    {
      id: 'five-stars-ru-customer',
      locale: 'ru',
      prompt: 'Поставьте 5 звёзд за мой визит',
      surface: 'customer',
      expectedAction: 'leave_visit_review',
      rescueReason: 'leave_visit_review',
      rating: 5,
    },
  ];
