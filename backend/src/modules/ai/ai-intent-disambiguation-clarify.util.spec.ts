import {
  applySelectedIntentFromSession,
  buildIntentDisambiguationCandidates,
  buildIntentDisambiguationClarifyResult,
  composeIntentDisambiguationFollowUp,
  detectPatternIntentPair,
  normalizeIntentDisambiguationCandidates,
} from './ai-intent-disambiguation-clarify.util.js';
import { INTENT_DISAMBIGUATION_SCENARIOS } from './ai-intent-disambiguation-clarify.fixtures.js';
import { buildIntentDisambiguationClarify } from './ai-smart-clarify.util.js';
import { markSemanticClarifyIntent } from './ai-semantic-confidence.util.js';

describe('ai-intent-disambiguation-clarify.util (acc-4.2)', () => {
  it.each(INTENT_DISAMBIGUATION_SCENARIOS)(
    '$id top-2 intent disambiguation',
    (scenario) => {
      const params: Record<string, unknown> = {
        _fieldConfidence: { action: scenario.classifierConfidence },
      };

      if (scenario.semanticAction && scenario.semanticConfidence != null) {
        markSemanticClarifyIntent({
          intent: {
            action: scenario.classifierAction,
            confidence: scenario.classifierConfidence,
            params,
          },
          classifierAction: scenario.classifierAction,
          classifierConfidence: scenario.classifierConfidence,
          semanticMatch: {
            action: scenario.semanticAction,
            confidence: scenario.semanticConfidence,
            matchedPhraseId: 'sem-test',
            source: 'canonical',
          },
        });
      }

      const clarify = buildIntentDisambiguationClarifyResult({
        prompt: scenario.prompt,
        surface: scenario.surface,
        action: scenario.classifierAction,
        params,
        confidence: scenario.classifierConfidence,
        shortlist: scenario.shortlist,
      });

      if (!scenario.expectClarify) {
        expect(clarify).toBeNull();
        return;
      }

      expect(clarify).not.toBeNull();
      const candidates = clarify?.details.clarifyCandidates as Array<{ action: string }>;
      expect(candidates?.length).toBeGreaterThanOrEqual(2);

      if (scenario.expectCandidateActions) {
        const actions = candidates!.map((row) => row.action);
        expect(actions).toContain(scenario.expectCandidateActions[0]);
        expect(actions).toContain(scenario.expectCandidateActions[1]);
      }

      if (scenario.expectSummaryIncludes) {
        expect(clarify?.summary.toLowerCase()).toContain(
          scenario.expectSummaryIncludes.toLowerCase(),
        );
      }
    },
  );

  it('detectPatternIntentPair finds cancel vs reschedule on dashboard', () => {
    const pair = detectPatternIntentPair({
      prompt: 'cancel or move the booking tomorrow',
      surface: 'dashboard',
    });
    expect(pair.map((row) => row.action)).toEqual([
      'cancel_bookings',
      'reschedule_booking',
    ]);
  });

  it('composeIntentDisambiguationFollowUp preserves original prompt', () => {
    expect(
      composeIntentDisambiguationFollowUp({
        selectedAction: 'cancel_bookings',
        label: 'Cancel booking',
        originalPrompt: 'change my client appointment tomorrow',
      }),
    ).toBe('change my client appointment tomorrow. I meant cancel booking.');
  });

  it('applySelectedIntentFromSession forces chip-selected action', () => {
    const intent = applySelectedIntentFromSession(
      { action: 'unknown', confidence: 0.3, params: {} },
      { _selectedIntentAction: 'reschedule_booking' },
    );
    expect(intent.action).toBe('reschedule_booking');
    expect(intent.confidence).toBeGreaterThanOrEqual(0.92);
  });

  it('buildIntentDisambiguationClarify wraps smart clarify early path', () => {
    const clarify = buildIntentDisambiguationClarify({
      prompt: 'cancel or reschedule my booking tomorrow',
      surface: 'customer',
      action: 'cancel_my_booking',
      params: {
        _semanticClarify: true,
        _semanticClarifyCandidates: normalizeIntentDisambiguationCandidates([
          {
            action: 'cancel_my_booking',
            label: 'Cancel my booking',
            confidence: 0.55,
            source: 'classifier',
          },
          {
            action: 'reschedule_my_booking',
            label: 'Reschedule my booking',
            confidence: 0.52,
            source: 'semantic',
          },
        ]),
      },
      confidence: 0.42,
    });
    expect(clarify?.details.clarifyKind).toBe('intent_disambiguation');
    expect(clarify?.details.clarifyCandidates?.length).toBe(2);
  });

  it('buildIntentDisambiguationCandidates uses shortlist when semantic absent', () => {
    const candidates = buildIntentDisambiguationCandidates({
      prompt: 'mark paid or show my appointments today',
      surface: 'provider',
      action: 'mark_paid',
      confidence: 0.38,
      params: { _fieldConfidence: { action: 0.38 } },
      shortlist: ['mark_paid', 'list_bookings', 'show_appointments'],
    });
    expect(candidates.length).toBeGreaterThanOrEqual(2);
  });
});
