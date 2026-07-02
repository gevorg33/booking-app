import { EXPLAIN_PROVIDER_SPECIALTY_PROMPTS } from './ai-explain-provider-specialty.util.js';
import {
  EXPLAIN_ANY_PROVIDER_OPTION_PROMPTS,
  EXPLAIN_ANY_PROVIDER_OPTION_RESCUE_SCENARIOS,
} from './ai-explain-any-provider-option.fixtures.js';
import { EXPLAIN_ANY_PROVIDER_OPTION_MULTILINGUAL_SCENARIOS } from './ai-explain-any-provider-option-multilingual.fixtures.js';
import { isAnyProviderBookingPrompt } from './any-provider-booking.semantic.util.js';
import { isExplainProviderSpecialtyPrompt } from './ai-explain-provider-specialty.util.js';
import {
  detectExplainAnyProviderOptionAction,
  inferAnyProviderOptionAspect,
  isAnyProviderOptionIntent,
  isExplainAnyProviderOptionPrompt,
  parseExplainAnyProviderOptionFromPrompt,
  rescueExplainAnyProviderOptionIntent,
} from './ai-explain-any-provider-option.util.js';

describe('ai-explain-any-provider-option.util (ai-cmd-customer-4.11.1)', () => {
  it.each(EXPLAIN_ANY_PROVIDER_OPTION_PROMPTS)(
    'detects explain any provider option prompt $id',
    ({ prompt }) => {
      expect(isExplainAnyProviderOptionPrompt(prompt)).toBe(true);
      expect(parseExplainAnyProviderOptionFromPrompt(prompt)).not.toBeNull();
    },
  );

  it.each(EXPLAIN_ANY_PROVIDER_OPTION_MULTILINGUAL_SCENARIOS)(
    'detects multilingual any provider option prompt $id',
    ({ prompt }) => {
      expect(isExplainAnyProviderOptionPrompt(prompt)).toBe(true);
      expect(parseExplainAnyProviderOptionFromPrompt(prompt)).not.toBeNull();
    },
  );

  it.each(EXPLAIN_ANY_PROVIDER_OPTION_PROMPTS)(
    'parses aspect for $id',
    ({ prompt, aspect }) => {
      expect(parseExplainAnyProviderOptionFromPrompt(prompt)?.aspect).toBe(
        aspect,
      );
    },
  );

  it.each(EXPLAIN_ANY_PROVIDER_OPTION_PROMPTS)(
    'rescues unknown action to explain_any_provider_option for $id',
    ({ prompt }) => {
      expect(rescueExplainAnyProviderOptionIntent(prompt, 'unknown')).toEqual({
        action: 'explain_any_provider_option',
        rescueReason: 'any_provider_option',
      });
    },
  );

  it.each(EXPLAIN_ANY_PROVIDER_OPTION_RESCUE_SCENARIOS)(
    'rescues misclassified $misclassifiedAction for $id',
    ({ prompt, misclassifiedAction }) => {
      expect(
        rescueExplainAnyProviderOptionIntent(prompt, misclassifiedAction),
      ).toEqual({
        action: 'explain_any_provider_option',
        rescueReason: 'any_provider_option',
      });
    },
  );

  it('detects action from prompt', () => {
    expect(
      detectExplainAnyProviderOptionAction('What does Any stylist mean?'),
    ).toBe('explain_any_provider_option');
  });

  it('infers combined aspect when meaning and assignment are both mentioned', () => {
    expect(
      inferAnyProviderOptionAspect(
        'What does Any stylist mean and who gets assigned?',
      ),
    ).toBe('all');
  });

  it('infers picker, assignment, and meaning aspects individually', () => {
    expect(
      inferAnyProviderOptionAspect(
        'Where is the specialist picker for any stylist?',
      ),
    ).toBe('picker');
    expect(
      inferAnyProviderOptionAspect(
        'Who gets assigned when I use any provider?',
      ),
    ).toBe('assignment');
    expect(
      inferAnyProviderOptionAspect('What is the any provider option?'),
    ).toBe('what_it_means');
  });

  it('rejects roster and booking-mutate prompts', () => {
    expect(isExplainAnyProviderOptionPrompt('List all providers here')).toBe(
      false,
    );
    expect(
      isExplainAnyProviderOptionPrompt(
        'Book any stylist tomorrow evening for a haircut',
      ),
    ).toBe(false);
  });

  it('identifies registered intent actions', () => {
    expect(isAnyProviderOptionIntent('explain_any_provider_option')).toBe(true);
    expect(isAnyProviderOptionIntent('book_appointment')).toBe(false);
  });

  it('does not steal provider specialty prompts', () => {
    for (const { prompt } of EXPLAIN_PROVIDER_SPECIALTY_PROMPTS) {
      expect(isExplainAnyProviderOptionPrompt(prompt)).toBe(false);
      expect(isExplainProviderSpecialtyPrompt(prompt)).toBe(true);
    }
  });

  it('does not steal any-provider booking prompts', () => {
    expect(
      isExplainAnyProviderOptionPrompt(
        'book with any provider for lashes tomorrow evening',
      ),
    ).toBe(false);
    expect(
      isAnyProviderBookingPrompt(
        'book with any provider for lashes tomorrow evening',
      ),
    ).toBe(true);
  });

  it('parses aspect from params', () => {
    expect(
      parseExplainAnyProviderOptionFromPrompt('What does Any stylist mean?', {
        aspect: 'picker',
      }),
    ).toEqual({ aspect: 'picker' });
  });
});
