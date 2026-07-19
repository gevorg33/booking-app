import {
  EXPLAIN_POST_VISIT_REVIEW_PROMPT_PROMPTS,
  type ExplainPostVisitReviewPromptAspect,
  type ExplainPostVisitReviewPromptFixture,
} from './ai-explain-post-visit-review-prompt.fixtures.js';
import { EXPLAIN_POST_VISIT_REVIEW_PROMPT_MULTILINGUAL_SCENARIOS } from './ai-explain-post-visit-review-prompt-multilingual.fixtures.js';
import { isLeaveVisitReviewPrompt } from './ai-leave-visit-review.util.js';
import { isExplainCheckoutRecommendationsPrompt } from './ai-checkout-recommendations.util.js';

export const EXPLAIN_POST_VISIT_REVIEW_PROMPT_INTENTS = [
  'explain_post_visit_review_prompt',
] as const;

export type ExplainPostVisitReviewPromptIntent =
  (typeof EXPLAIN_POST_VISIT_REVIEW_PROMPT_INTENTS)[number];

export { CUSTOMER_EXPLAIN_POST_VISIT_REVIEW_PROMPT_CLASSIFIER_RULES } from './ai-explain-post-visit-review-prompt.fixtures.js';

const REPORT_PROBLEM_CUE =
  /\b(something went wrong|charged twice|wrong charge|complaint|refund|dispute|problem with my visit|issue with my visit)\b/i;

const EXPLAIN_POST_VISIT_REVIEW_CUE =
  /\b(why am i seeing|review popup|post-visit review|rating popup|satisfaction (?:survey|prompt)|skip the rating|can i skip the rating|can i skip the review|dismiss the review|dismiss the review prompt|close the post-visit review|not now on the review|ask(?:ing)? me to rate|ask me again if i skip|do i have to (?:rate|review|leave a review)|how does the visit rating|visit rating flow|explain the post-visit review|what is this satisfaction|why did i get a review notification|why is the app asking)\b/i;

const WHY_POPUP_CUE =
  /\b(why am i seeing|why is the app asking|why did i get a review|review notification|review popup)\b/i;

const SKIP_DISMISS_CUE =
  /\b(skip the rating|can i skip|dismiss|not now|close the post-visit|do i have to|ask me again if i skip|must i rate|have to leave a review)\b/i;

const HOW_IT_WORKS_CUE =
  /\b(how does.*(?:rating|review)|rating flow|satisfaction survey|explain the post-visit review|how it works)\b/i;

const STORE_REVIEW_CUE =
  /\b(app store|play store|store review|rate the app)\b/i;

const UNHAPPY_PATH_CUE =
  /\b(not great|unhappy|something wrong|support ticket|report a problem)\b/i;

function matchExplainPostVisitReviewScenario(
  prompt: string,
): ExplainPostVisitReviewPromptFixture | null {
  const normalized = prompt.trim().toLowerCase();
  for (const scenario of EXPLAIN_POST_VISIT_REVIEW_PROMPT_PROMPTS) {
    if (scenario.prompt.trim().toLowerCase() === normalized) {
      return scenario;
    }
  }
  for (const scenario of EXPLAIN_POST_VISIT_REVIEW_PROMPT_MULTILINGUAL_SCENARIOS) {
    if (scenario.prompt.trim().toLowerCase() === normalized) {
      return scenario;
    }
  }
  return null;
}

function containsArmenianScript(prompt: string): boolean {
  return /[\u0530-\u058F]/.test(prompt);
}

function containsCyrillicScript(prompt: string): boolean {
  return /[\u0400-\u04FF]/.test(prompt);
}

export function resolveExplainPostVisitReviewAspect(
  prompt: string,
): ExplainPostVisitReviewPromptAspect {
  const scenario = matchExplainPostVisitReviewScenario(prompt);
  if (scenario?.aspect) return scenario.aspect;
  if (STORE_REVIEW_CUE.test(prompt)) return 'store_review';
  if (UNHAPPY_PATH_CUE.test(prompt)) return 'unhappy_path';
  if (SKIP_DISMISS_CUE.test(prompt)) return 'skip_dismiss';
  if (WHY_POPUP_CUE.test(prompt)) return 'why_popup';
  if (HOW_IT_WORKS_CUE.test(prompt)) return 'how_it_works';
  return 'how_it_works';
}

export function isExplainPostVisitReviewPrompt(prompt: string): boolean {
  if (isExplainCheckoutRecommendationsPrompt(prompt)) return false;
  if (matchExplainPostVisitReviewScenario(prompt)) return true;
  if (isLeaveVisitReviewPrompt(prompt)) return false;
  if (REPORT_PROBLEM_CUE.test(prompt)) return false;

  if (
    (containsArmenianScript(prompt) &&
      /(ինչու|բաց թողնել|փակել)/i.test(prompt) &&
      /(պատուհան|review|գնահատ)/i.test(prompt)) ||
    (containsCyrillicScript(prompt) &&
      /(почему|пропустить|как работает)/i.test(prompt) &&
      /(окно|отзыв|оценк)/i.test(prompt))
  ) {
    return true;
  }

  return EXPLAIN_POST_VISIT_REVIEW_CUE.test(prompt);
}

export function isExplainPostVisitReviewPromptIntent(
  action: string,
): action is ExplainPostVisitReviewPromptIntent {
  return (
    EXPLAIN_POST_VISIT_REVIEW_PROMPT_INTENTS as readonly string[]
  ).includes(action);
}

export interface ParsedExplainPostVisitReviewPrompt {
  aspect: ExplainPostVisitReviewPromptAspect;
}

export function parseExplainPostVisitReviewPromptFromPrompt(
  prompt: string,
): ParsedExplainPostVisitReviewPrompt | null {
  if (!isExplainPostVisitReviewPrompt(prompt)) return null;
  return { aspect: resolveExplainPostVisitReviewAspect(prompt) };
}

export function rescueExplainPostVisitReviewPromptIntent(
  prompt: string,
  action: string,
): { action: ExplainPostVisitReviewPromptIntent; rescueReason: string } | null {
  if (isExplainPostVisitReviewPromptIntent(action)) return null;
  if (!parseExplainPostVisitReviewPromptFromPrompt(prompt)) return null;
  return {
    action: 'explain_post_visit_review_prompt',
    rescueReason: 'post_visit_review_prompt',
  };
}

export function buildPostVisitReviewWhyPopupLines(): string[] {
  return [
    'After a completed visit, the app may show a short satisfaction prompt on Account when a review is still available for that booking.',
    'It appears once per visit — usually right after you open Account and we detect a completed appointment you have not reviewed yet.',
  ];
}

export function buildPostVisitReviewSkipDismissLines(): string[] {
  return [
    'You can tap Not now or dismiss the popup — it is optional and you do not have to rate.',
    'Dismissing marks that visit as prompted on this device, so we will not show the same popup again for that booking.',
    'You can still leave a review later from Account or by asking the assistant to rate a visit.',
  ];
}

export function buildPostVisitReviewHowItWorksLines(): string[] {
  return [
    'Step 1: quick satisfaction check (Great / Not great / Not now).',
    'Step 2: if you choose Great while signed in, pick 1–5 stars for the salon visit.',
    'Step 3: after submitting stars, the app may offer an optional App Store or Play Store review.',
  ];
}

export function buildPostVisitReviewStoreReviewLines(): string[] {
  return [
    'Salon star ratings are saved to your booking; App Store or Play Store reviews are separate and optional.',
    'The store review step only opens when your device has a store link configured and you finish the in-app star rating.',
  ];
}

export function buildPostVisitReviewUnhappyPathLines(): string[] {
  return [
    'If you tap Not great, the app can open support — a Zendesk ticket when you are signed in with email, or a web support form otherwise.',
    'That path is for visit issues, not for skipping the rating. Use Not now to dismiss without contacting support.',
  ];
}

export function assemblePostVisitReviewPromptSummary(
  aspect: ExplainPostVisitReviewPromptAspect,
  pendingReviewLine?: string | null,
): string {
  const lines: string[] = [];
  switch (aspect) {
    case 'why_popup':
      lines.push(...buildPostVisitReviewWhyPopupLines());
      break;
    case 'skip_dismiss':
      lines.push(...buildPostVisitReviewSkipDismissLines());
      break;
    case 'store_review':
      lines.push(...buildPostVisitReviewStoreReviewLines());
      break;
    case 'unhappy_path':
      lines.push(...buildPostVisitReviewUnhappyPathLines());
      break;
    case 'how_it_works':
    default:
      lines.push(...buildPostVisitReviewHowItWorksLines());
      break;
  }

  if (aspect !== 'unhappy_path' && aspect !== 'store_review') {
    lines.push(
      'Choose Not great only if something went wrong — otherwise use Not now to skip.',
    );
  }

  if (pendingReviewLine) {
    lines.push(pendingReviewLine);
  }

  return lines.join(' ');
}
