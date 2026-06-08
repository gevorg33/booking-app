import { ESCALATION_CONSENSUS_SCENARIOS } from './ai-classification-escalation.fixtures.js';
import {
  applyEscalationTieBreakerToIntent,
  assessClassificationConsensus,
  buildEscalationTieBreakerSystemPrompt,
  inferDeterministicPreferredAction,
  isMutatingClassificationAction,
  resolveAllowedEscalationActions,
} from './ai-classification-escalation.util.js';

describe('ai-classification-escalation.util (acc-3.5)', () => {
  it.each(
    ESCALATION_CONSENSUS_SCENARIOS.map((scenario) => [scenario.id, scenario]),
  )('consensus scenario %s', (_id, scenario) => {
    const consensus = assessClassificationConsensus(
      { action: scenario.llmAction, params: {} },
      { tier: scenario.routeTier, reasoning: 'test' },
      scenario.prompt,
      scenario.surface,
    );
    expect(consensus.needsEscalation).toBe(scenario.expectEscalation);
  });

  it('inferDeterministicPreferredAction maps availability prompts to read-only intents', () => {
    expect(
      inferDeterministicPreferredAction(
        'Who is free tomorrow evening for permanent lashes',
        'dashboard',
        { tier: 'read_only', reasoning: 'Read-only query pattern' },
      ),
    ).toBe('check_providers_for_service');
  });

  it('isMutatingClassificationAction distinguishes read vs mutate', () => {
    expect(isMutatingClassificationAction('create_booking')).toBe(true);
    expect(isMutatingClassificationAction('check_providers_for_service')).toBe(
      false,
    );
    expect(isMutatingClassificationAction('explain_checkout_currency')).toBe(
      false,
    );
  });

  it('applyEscalationTieBreakerToIntent replaces action and clears escalate flag', () => {
    const updated = applyEscalationTieBreakerToIntent(
      {
        action: 'create_booking',
        params: { _classificationEscalate: true },
        confidence: 0.9,
      },
      {
        action: 'check_providers_for_service',
        params: { allProviders: true },
        confidence: 0.91,
        model: 'gpt-5.4',
        resolved: true,
        sideWith: 'deterministic',
      },
    );
    expect(updated.action).toBe('check_providers_for_service');
    expect(updated.params?._classificationEscalate).toBe(false);
    expect(updated.params?._classificationSource).toBe('escalation_model');
  });

  it('buildEscalationTieBreakerSystemPrompt includes allowed actions', () => {
    const prompt = buildEscalationTieBreakerSystemPrompt('dashboard', [
      'check_providers_for_service',
      'create_booking',
    ]);
    expect(prompt).toContain('acc-3.5');
    expect(prompt).toContain('check_providers_for_service');
  });

  it('resolveAllowedEscalationActions merges shortlist and preferred action', () => {
    const allowed = resolveAllowedEscalationActions(
      ['unknown', 'create_booking'],
      {
        needsEscalation: true,
        llmAction: 'create_booking',
        deterministicPreferredAction: 'check_providers_for_service',
      },
      'create_booking',
    );
    expect(allowed).toContain('check_providers_for_service');
    expect(allowed).toContain('create_booking');
  });
});
