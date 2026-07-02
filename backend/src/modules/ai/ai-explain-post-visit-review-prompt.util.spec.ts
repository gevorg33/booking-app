import {
  EXPLAIN_POST_VISIT_REVIEW_PROMPT_BOUNDARY_PROMPTS,
  EXPLAIN_POST_VISIT_REVIEW_PROMPT_PROMPTS,
  EXPLAIN_POST_VISIT_REVIEW_PROMPT_RESCUE_SCENARIOS,
} from './ai-explain-post-visit-review-prompt.fixtures.js';
import { EXPLAIN_POST_VISIT_REVIEW_PROMPT_MULTILINGUAL_SCENARIOS } from './ai-explain-post-visit-review-prompt-multilingual.fixtures.js';
import {
  assemblePostVisitReviewPromptSummary,
  isExplainPostVisitReviewPrompt,
  isExplainPostVisitReviewPromptIntent,
  parseExplainPostVisitReviewPromptFromPrompt,
  rescueExplainPostVisitReviewPromptIntent,
  resolveExplainPostVisitReviewAspect,
} from './ai-explain-post-visit-review-prompt.util.js';

describe('ai-explain-post-visit-review-prompt.util (ai-cmd-customer-4.12.2)', () => {
  it.each(
    EXPLAIN_POST_VISIT_REVIEW_PROMPT_PROMPTS.map((row) => [row.id, row.prompt]),
  )('detects prompt %s', (_id, prompt) => {
    expect(isExplainPostVisitReviewPrompt(prompt)).toBe(true);
  });

  it.each(
    EXPLAIN_POST_VISIT_REVIEW_PROMPT_MULTILINGUAL_SCENARIOS.map((row) => [
      row.id,
      row.prompt,
    ]),
  )('detects multilingual prompt %s', (_id, prompt) => {
    expect(isExplainPostVisitReviewPrompt(prompt)).toBe(true);
  });

  it.each(EXPLAIN_POST_VISIT_REVIEW_PROMPT_BOUNDARY_PROMPTS)(
    'rejects boundary prompt $id',
    ({ prompt }) => {
      expect(isExplainPostVisitReviewPrompt(prompt)).toBe(false);
    },
  );

  it.each(EXPLAIN_POST_VISIT_REVIEW_PROMPT_RESCUE_SCENARIOS)(
    'rescues $id',
    ({ prompt, misclassifiedAction, expectedAction }) => {
      expect(
        rescueExplainPostVisitReviewPromptIntent(prompt, misclassifiedAction)
          ?.action,
      ).toBe(expectedAction);
    },
  );

  it('parses aspect and builds summary', () => {
    expect(
      resolveExplainPostVisitReviewAspect('Why am I seeing a review popup?'),
    ).toBe('why_popup');
    const parsed = parseExplainPostVisitReviewPromptFromPrompt(
      'Can I skip the rating?',
    );
    expect(parsed?.aspect).toBe('skip_dismiss');
    expect(assemblePostVisitReviewPromptSummary('skip_dismiss')).toMatch(
      /Not now/i,
    );
  });

  it('recognizes explain_post_visit_review_prompt intent', () => {
    expect(
      isExplainPostVisitReviewPromptIntent('explain_post_visit_review_prompt'),
    ).toBe(true);
  });

  it('builds aspect-specific summaries', () => {
    expect(assemblePostVisitReviewPromptSummary('store_review')).toMatch(
      /App Store/i,
    );
    expect(assemblePostVisitReviewPromptSummary('unhappy_path')).toMatch(
      /Not great/i,
    );
    expect(
      assemblePostVisitReviewPromptSummary(
        'why_popup',
        'You currently have a completed Haircut visit that can still be reviewed from Account.',
      ),
    ).toMatch(/Haircut/);
  });

  it('resolves aspects from free-form prompts', () => {
    expect(
      resolveExplainPostVisitReviewAspect(
        'Will this open the App Store review?',
      ),
    ).toBe('store_review');
    expect(
      resolveExplainPostVisitReviewAspect('What happens if I tap Not great?'),
    ).toBe('unhappy_path');
    expect(
      resolveExplainPostVisitReviewAspect(
        'How much notice before I can skip the rating?',
      ),
    ).toBe('skip_dismiss');
    expect(
      resolveExplainPostVisitReviewAspect(
        'Why am I seeing this review popup again?',
      ),
    ).toBe('why_popup');
    expect(
      isExplainPostVisitReviewPrompt('Ինչու է review popup-ը ցույց տալիս'),
    ).toBe(true);
    expect(
      isExplainPostVisitReviewPrompt(
        'Почему приложение показывает окно отзыва',
      ),
    ).toBe(true);
  });
});
