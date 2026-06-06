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
});
