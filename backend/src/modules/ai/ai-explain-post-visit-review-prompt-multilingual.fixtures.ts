import type { AiEvalLocale } from './eval/ai-command-eval.types.js';
import type { ExplainPostVisitReviewPromptAspect } from './ai-explain-post-visit-review-prompt.fixtures.js';

export type ExplainPostVisitReviewPromptMultilingualScenario = {
  id: string;
  locale: AiEvalLocale;
  prompt: string;
  surface: 'customer';
  expectedAction: 'explain_post_visit_review_prompt';
  rescueReason: 'post_visit_review_prompt';
  aspect?: ExplainPostVisitReviewPromptAspect;
};

export const EXPLAIN_POST_VISIT_REVIEW_PROMPT_MULTILINGUAL_CLASSIFIER_RULES = `- Armenian/Russian post-visit review popup explain (customer mobile):
  - explain_post_visit_review_prompt: hy «ինչու է ցուցադրվում գնահատման պատուհանը», «կարո՞ղ եմ բաց թողնել գնահատումը»; ru «почему появляется окно отзыва», «можно ли пропустить оценку». READ popup behavior — NOT leave_visit_review, NOT report_booking_problem.`;

export const EXPLAIN_POST_VISIT_REVIEW_PROMPT_MULTILINGUAL_SCENARIOS: readonly ExplainPostVisitReviewPromptMultilingualScenario[] =
  [
    {
      id: 'why-popup-hy-customer',
      locale: 'hy',
      prompt: 'Ինչու է ցուցադրվում գնահատման պատուհանը',
      surface: 'customer',
      expectedAction: 'explain_post_visit_review_prompt',
      rescueReason: 'post_visit_review_prompt',
      aspect: 'why_popup',
    },
    {
      id: 'skip-rating-hy-customer',
      locale: 'hy',
      prompt: 'Կարո՞ղ եմ բաց թողնել գնահատումը',
      surface: 'customer',
      expectedAction: 'explain_post_visit_review_prompt',
      rescueReason: 'post_visit_review_prompt',
      aspect: 'skip_dismiss',
    },
    {
      id: 'dismiss-hy-customer',
      locale: 'hy',
      prompt: 'Ինչպես փակել review popup-ը',
      surface: 'customer',
      expectedAction: 'explain_post_visit_review_prompt',
      rescueReason: 'post_visit_review_prompt',
      aspect: 'skip_dismiss',
    },
    {
      id: 'why-popup-ru-customer',
      locale: 'ru',
      prompt: 'Почему появляется окно с отзывом?',
      surface: 'customer',
      expectedAction: 'explain_post_visit_review_prompt',
      rescueReason: 'post_visit_review_prompt',
      aspect: 'why_popup',
    },
    {
      id: 'skip-rating-ru-customer',
      locale: 'ru',
      prompt: 'Можно ли пропустить оценку?',
      surface: 'customer',
      expectedAction: 'explain_post_visit_review_prompt',
      rescueReason: 'post_visit_review_prompt',
      aspect: 'skip_dismiss',
    },
    {
      id: 'how-flow-ru-customer',
      locale: 'ru',
      prompt: 'Как работает оценка визита в приложении?',
      surface: 'customer',
      expectedAction: 'explain_post_visit_review_prompt',
      rescueReason: 'post_visit_review_prompt',
      aspect: 'how_it_works',
    },
  ];
