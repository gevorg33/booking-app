import {
  AVAILABILITY_DISAMBIGUATION_SCENARIOS,
  AVAILABILITY_INTENT_MATRIX,
} from './ai-intent-disambiguation.fixtures.js';
import {
  disambiguateMisclassifiedAvailabilityIntent,
  isLookupServiceAssignmentPrompt,
  resolveAvailabilityIntentFromPrompt,
} from './ai-intent-disambiguation.util.js';
import { evaluateDeterministicEvalCase } from './eval/ai-command-eval.runner.js';
import { availabilityDisambiguationScenarioToEvalCase } from './eval/ai-command-eval.cases.js';

describe('ai-intent-disambiguation.util (ai-cmd-h1.4)', () => {
  it('documents the availability intent matrix', () => {
    expect(AVAILABILITY_INTENT_MATRIX.length).toBeGreaterThanOrEqual(5);
    expect(AVAILABILITY_INTENT_MATRIX[0].dashboard).toBe('check_availability');
  });

  it('resolves dashboard named provider to check_availability', () => {
    const result = resolveAvailabilityIntentFromPrompt(
      'dashboard',
      'is Gevorg available for massage tomorrow at 09:00',
    );
    expect(result?.action).toBe('check_availability');
  });

  it('resolves team-wide customer wording to check_providers_for_service', () => {
    const result = resolveAvailabilityIntentFromPrompt(
      'dashboard',
      'who is free tomorrow evening for permanent lashes',
    );
    expect(result?.action).toBe('check_providers_for_service');
  });

  it('resolves staff ops wording to lookup_service_assignment', () => {
    expect(
      isLookupServiceAssignmentPrompt('who is doing facemassage today'),
    ).toBe(true);
    const result = resolveAvailabilityIntentFromPrompt(
      'dashboard',
      'who is doing facemassage today',
    );
    expect(result?.action).toBe('lookup_service_assignment');
  });

  it('maps public team-wide free wording to check_availability', () => {
    const result = resolveAvailabilityIntentFromPrompt(
      'public',
      'who is free tomorrow evening for permanent lashes',
    );
    expect(result?.action).toBe('check_availability');
    expect(result?.params?.allProviders).toBe(true);
  });

  it('disambiguates create_booking mislabels to check_providers_for_service', () => {
    const result = disambiguateMisclassifiedAvailabilityIntent(
      'dashboard',
      'who is free tomorrow for massage',
      'create_booking',
      {},
    );
    expect(result?.action).toBe('check_providers_for_service');
    expect(result?.rescueReason).toBe('create_booking_to_check_providers');
  });

  it('disambiguates lookup_service_assignment to check_providers_for_service', () => {
    const result = disambiguateMisclassifiedAvailabilityIntent(
      'dashboard',
      'who is available tomorrow evening for lashes',
      'lookup_service_assignment',
      {},
    );
    expect(result?.action).toBe('check_providers_for_service');
    expect(result?.rescueReason).toBe('lookup_to_check_providers');
  });

  it.each(
    AVAILABILITY_DISAMBIGUATION_SCENARIOS.filter(
      (scenario) => !scenario.classifierOnly,
    ),
  )('passes eval scenario $id', (scenario) => {
    const evalCase = availabilityDisambiguationScenarioToEvalCase(scenario);
    const result = evaluateDeterministicEvalCase(evalCase);
    expect(result.passed).toBe(true);
  });

  // e2e-bug.476 — "who offers Deep tissue massage usually?" answered "no
  // providers available on 19 August 2026". A capability question has no day in
  // it, and its right answer names the provider even when nobody is scheduled.
  //
  // Before this, isLookupServiceAssignmentPrompt matched 1 of 8 natural
  // capability phrasings — including the command spec's own documented example
  // ("who does facials") — because the vocabulary only knew availability words.
  describe('capability questions route to the assignment lookup', () => {
    it.each([
      'who does facials',
      'who offers Deep tissue massage?',
      'who offers Deep tissue massage usually?',
      'who performs Deep tissue massage',
      'who provides Deep tissue massage',
      'who can perform facials',
      'which providers do Deep tissue massage',
    ])('claims %s', (prompt) => {
      expect(isLookupServiceAssignmentPrompt(prompt)).toBe(true);
    });

    // The negatives matter more than the positives: an availability word or a
    // day makes it a scheduling question, and a book verb makes it a booking.
    it.each([
      'who is free for lashes tomorrow evening',
      'who is available for a haircut today',
      'who has openings tomorrow',
      'book me with whoever does facials',
    ])('leaves %s alone', (prompt) => {
      expect(isLookupServiceAssignmentPrompt(prompt)).toBe(false);
    });

    // "specialises in" is a capability verb but belongs to
    // explain_provider_specialty; claiming it cost that command 2 corpus cases.
    it('does not claim specialty phrasing', () => {
      expect(
        isLookupServiceAssignmentPrompt(
          'who specializes in deep tissue massage',
        ),
      ).toBe(false);
    });
  });
});
