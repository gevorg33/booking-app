import {
  EXPLAIN_SALON_PROFILE_PROMPTS,
  EXPLAIN_SALON_PROFILE_RESCUE_SCENARIOS,
} from './ai-explain-salon-profile.fixtures.js';
import { EXPLAIN_SALON_PROFILE_MULTILINGUAL_SCENARIOS } from './ai-explain-salon-profile-multilingual.fixtures.js';
import {
  inferSalonProfileAspect,
  isExplainSalonProfileIntent,
  isExplainSalonProfilePrompt,
  parseExplainSalonProfileFromPrompt,
  rescueExplainSalonProfileIntent,
} from './ai-explain-salon-profile.util.js';
import { isExplainBusinessHoursAndLocationPrompt } from './ai-explain-business-hours-and-location.util.js';

describe('ai-explain-salon-profile.util (ai-cmd-customer-4.20.5)', () => {
  it.each(EXPLAIN_SALON_PROFILE_PROMPTS)(
    'detects prompt $id',
    ({ prompt, aspect }) => {
      expect(isExplainSalonProfilePrompt(prompt)).toBe(true);
      expect(parseExplainSalonProfileFromPrompt(prompt)).toMatchObject({
        aspect,
      });
    },
  );

  it.each(EXPLAIN_SALON_PROFILE_MULTILINGUAL_SCENARIOS)(
    'detects multilingual prompt $id',
    ({ prompt }) => {
      expect(isExplainSalonProfilePrompt(prompt)).toBe(true);
    },
  );

  it.each(EXPLAIN_SALON_PROFILE_RESCUE_SCENARIOS)(
    'rescues $id',
    ({ prompt, misclassifiedAction, expectedAction }) => {
      expect(
        rescueExplainSalonProfileIntent(prompt, misclassifiedAction),
      ).toEqual({
        action: expectedAction,
        rescueReason: 'salon_profile',
      });
    },
  );

  it('does not steal hours/address or provider specialty prompts', () => {
    expect(isExplainSalonProfilePrompt('When are you open Saturday?')).toBe(
      false,
    );
    expect(
      isExplainBusinessHoursAndLocationPrompt('When are you open Saturday?'),
    ).toBe(true);
    expect(isExplainSalonProfilePrompt('Tell me about Anna')).toBe(false);
    expect(isExplainSalonProfilePrompt('Directions to the salon')).toBe(false);
  });

  it('returns null rescue when already classified correctly', () => {
    expect(
      rescueExplainSalonProfileIntent(
        'Tell me about this salon',
        'explain_salon_profile',
      ),
    ).toBeNull();
  });

  it('recognizes explain_salon_profile intent', () => {
    expect(isExplainSalonProfileIntent('explain_salon_profile')).toBe(true);
    expect(isExplainSalonProfileIntent('business_info')).toBe(false);
  });

  it('infers social aspect from social media phrasing', () => {
    expect(inferSalonProfileAspect('Show social media links')).toBe('social');
  });
});
