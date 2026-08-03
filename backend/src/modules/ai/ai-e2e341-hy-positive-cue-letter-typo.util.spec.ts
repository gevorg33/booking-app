import {
  E2E341_NEGATIVE_CONTROL_CASES,
  E2E341_POSITIVE_CASES,
} from './ai-e2e341-hy-positive-cue-letter-typo.fixtures.js';
import {
  isGiveAiFeedbackPrompt,
  parseGiveAiFeedbackAspect,
  parseGiveAiFeedbackRating,
} from './ai-give-ai-feedback.util.js';

describe('e2e-bug.341: POSITIVE_CUE Armenian "was helpful" letter typo (Ե → Է)', () => {
  it.each(E2E341_POSITIVE_CASES.map((row) => [row.id, row] as const))(
    '%s',
    (_id, row) => {
      expect(isGiveAiFeedbackPrompt(row.prompt)).toBe(
        row.expectIsFeedbackPrompt,
      );
      expect(parseGiveAiFeedbackRating(row.prompt)).toBe(row.expectRating);
      expect(parseGiveAiFeedbackAspect(row.prompt)).toBe(row.expectAspect);
    },
  );

  it.each(
    E2E341_NEGATIVE_CONTROL_CASES.map((row) => [row.id, row] as const),
  )('%s — sibling negative cue unaffected', (_id, row) => {
    expect(isGiveAiFeedbackPrompt(row.prompt)).toBe(
      row.expectIsFeedbackPrompt,
    );
    expect(parseGiveAiFeedbackRating(row.prompt)).toBe(row.expectRating);
    expect(parseGiveAiFeedbackAspect(row.prompt)).toBe(row.expectAspect);
  });
});
