import {
  buildClarifyTraceMetadata,
  buildEntityDisambiguationClarify,
  buildHonestFailureClarify,
  buildSuggestedActionFallbackClarify,
  buildIntentDisambiguationClarify,
  buildSmartClarifySessionContext,
  buildTargetedSlotClarify,
  detectEntityAmbiguity,
  getClarifyRound,
  mergeClarifyFollowUpPrompt,
  mergeClarifyPartialParams,
  recordClarifyAnswerInSession,
  resolveSmartClarify,
} from './ai-smart-clarify.util.js';
import { SMART_CLARIFY_SCENARIOS } from './ai-smart-clarify.fixtures.js';

describe('ai-smart-clarify.util', () => {
  it.each(SMART_CLARIFY_SCENARIOS)('$id exposes scenario kind $kind', (scenario) => {
    expect(scenario.kind).toBeTruthy();
    expect(scenario.surface).toBeTruthy();
  });

  it('mergeClarifyFollowUpPrompt appends follow-up to original prompt', () => {
    const merged = mergeClarifyFollowUpPrompt('tomorrow at 10', {
      _clarifyContext: {
        originalPrompt: 'book massage with Anna',
        originalAction: 'create_booking',
        partialParams: { serviceName: 'massage' },
        clarifyRound: 1,
        clarifyKind: 'targeted_slots',
      },
    });
    expect(merged).toBe('book massage with Anna. tomorrow at 10');
  });

  it('mergeClarifyPartialParams keeps earlier slot values', () => {
    const merged = mergeClarifyPartialParams(
      { timeSlot: null },
      {
        _clarifyContext: {
          originalPrompt: 'book massage',
          originalAction: 'create_booking',
          partialParams: { serviceName: 'Swedish Massage', date: '2026-06-08' },
          clarifyRound: 1,
          clarifyKind: 'targeted_slots',
        },
      },
    );
    expect(merged.serviceName).toBe('Swedish Massage');
    expect(merged.date).toBe('2026-06-08');
  });

  it('recordClarifyAnswerInSession persists answered fields', () => {
    const session = recordClarifyAnswerInSession(
      { _clarifyMemory: { date: '2026-06-08' } },
      { serviceName: 'Facemassage' },
    );
    expect(session._clarifyMemory).toEqual({
      date: '2026-06-08',
      serviceName: 'Facemassage',
    });
  });

  it('detectEntityAmbiguity finds two Annas', () => {
    const options = detectEntityAmbiguity({
      prompt: 'book massage with Anna tomorrow',
      params: {},
      employees: [
        { id: '1', name: 'Anna Smith' },
        { id: '2', name: 'Anna Jones' },
      ],
    });
    expect(options.length).toBeGreaterThanOrEqual(2);
    expect(options.every((row) => row.field === 'employeeName')).toBe(true);
  });

  it('buildEntityDisambiguationClarify returns selectable options', () => {
    const clarify = buildEntityDisambiguationClarify({
      prompt: 'book with Anna',
      surface: 'dashboard',
      action: 'create_booking',
      params: {},
      employees: [
        { id: '1', name: 'Anna Smith' },
        { id: '2', name: 'Anna Jones' },
      ],
    });
    expect(clarify?.details.entityOptions?.length).toBeGreaterThanOrEqual(2);
    expect(clarify?.details.clarifyKind).toBe('entity_disambiguation');
  });

  it('buildHonestFailureClarify triggers after clarify round exhausted', () => {
    const clarify = buildHonestFailureClarify({
      prompt: 'hmm maybe something',
      surface: 'customer',
      action: 'unknown',
      params: { _semanticClarify: true },
      sessionContext: {
        _clarifyContext: {
          originalPrompt: 'hmm maybe something',
          originalAction: 'unknown',
          partialParams: {},
          clarifyRound: 1,
          clarifyKind: 'intent_disambiguation',
        },
      },
    });
    expect(clarify?.details.suggestedCommands?.length).toBeGreaterThanOrEqual(2);
    expect(clarify?.details.clarifyKind).toBe('honest_failure');
  });

  it('buildSuggestedActionFallbackClarify offers chips on first-turn unknown', () => {
    const clarify = buildSuggestedActionFallbackClarify({
      prompt: 'asdfgh booking maybe',
      surface: 'dashboard',
      action: 'unknown',
      params: {},
      confidence: 0.25,
    });
    expect(clarify?.details.suggestedCommands?.length).toBeGreaterThanOrEqual(2);
    expect(clarify?.details.clarifyKind).toBe('suggested_action_fallback');
  });

  it('resolveSmartClarify early phase prefers intent disambiguation', () => {
    const clarify = resolveSmartClarify({
      prompt: 'maybe cancel or move my booking',
      surface: 'customer',
      action: 'cancel_booking',
      params: {
        _semanticClarify: true,
        _semanticMatchConfidence: 0.62,
        _semanticClarifyCandidates: [
          { action: 'cancel_booking', label: 'Cancel booking', score: 0.62 },
          { action: 'reschedule_booking', label: 'Reschedule booking', score: 0.61 },
        ],
      },
      phase: 'early',
    });
    expect(clarify?.details.clarifyKind).toBe('intent_disambiguation');
    expect(clarify?.details.clarifyCandidates?.length).toBeGreaterThanOrEqual(2);
  });

  it('intent disambiguation attaches something-else escape alternatives (n99-1.8)', () => {
    const clarify = buildIntentDisambiguationClarify({
      prompt: 'move my thing tomorrow',
      surface: 'dashboard',
      action: 'create_booking',
      params: {
        _semanticClarify: true,
        _semanticClarifyCandidates: [
          { action: 'reschedule_booking', label: 'Reschedule booking', score: 0.55 },
          { action: 'cancel_booking', label: 'Cancel booking', score: 0.54 },
        ],
      },
      shortlist: ['reschedule_booking', 'cancel_booking', 'create_booking', 'list_bookings'],
    });
    expect(clarify?.details.showSomethingElseEscape).toBe(true);
    expect(clarify?.details.somethingElseAlternatives?.length).toBeGreaterThanOrEqual(2);
  });

  it('resolveSmartClarify late phase asks only missing validator fields', () => {
    const clarify = resolveSmartClarify({
      prompt: 'book massage tomorrow',
      surface: 'dashboard',
      action: 'create_booking',
      params: { serviceName: 'Swedish Massage', date: '2026-06-08', allProviders: false },
      resolved: {
        action: 'create_booking',
        prompt: 'book massage tomorrow',
        businessId: 'b1',
        params: { serviceName: 'Swedish Massage', date: '2026-06-08', allProviders: false },
        entities: {
          employees: [{ id: 'e1', name: 'Gevorg' } as any],
          services: [{ id: 's1', name: 'Swedish Massage' } as any],
        },
        enrichedParams: {
          serviceId: 's1',
          serviceName: 'Swedish Massage',
          date: '2026-06-08',
          allProviders: false,
        },
        reasoning: 'booking',
      },
      phase: 'late',
    });
    expect(clarify?.details.clarifyKind).toBe('targeted_slots');
    expect(clarify?.details.missing?.length).toBeGreaterThan(0);
  });

  it('buildSmartClarifySessionContext carries partial params for next turn', () => {
    const result = buildTargetedSlotClarify({
      prompt: 'book massage',
      surface: 'dashboard',
      action: 'create_booking',
      params: { serviceName: 'Swedish Massage' },
    });
    expect(result).not.toBeNull();
    const session = buildSmartClarifySessionContext({}, result!);
    expect(session._clarifyContext).toBeTruthy();
    expect(session.serviceName).toBe('Swedish Massage');
  });

  it('buildClarifyTraceMetadata exposes clarify quality fields', () => {
    const meta = buildClarifyTraceMetadata({
      success: false,
      action: 'clarify',
      summary: 'Which provider?',
      details: {
        clarifyKind: 'entity_disambiguation',
        clarifySource: 'entity_disambiguation',
        clarifyRound: 1,
        entityOptions: [{ id: '1', field: 'employeeName', label: 'Anna', value: 'Anna' }],
      },
    });
    expect(meta.entityOptionCount).toBe(1);
    expect(meta.clarifyKind).toBe('entity_disambiguation');
  });

  it('getClarifyRound reads prior round from session', () => {
    expect(
      getClarifyRound({
        _clarifyContext: {
          originalPrompt: 'x',
          originalAction: 'create_booking',
          partialParams: {},
          clarifyRound: 1,
          clarifyKind: 'targeted_slots',
        },
      }),
    ).toBe(1);
  });

  it('buildIntentDisambiguationClarify returns null when semantic score is high', () => {
    const clarify = buildIntentDisambiguationClarify({
      prompt: 'show appointments today',
      surface: 'dashboard',
      action: 'list_bookings',
      params: { _semanticMatchScore: 0.95 },
    });
    expect(clarify).toBeNull();
  });
});
