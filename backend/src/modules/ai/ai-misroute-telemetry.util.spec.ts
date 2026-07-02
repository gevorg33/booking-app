import {
  MISROUTE_PIPELINE_TRACE_FIXTURE,
  MISROUTE_SEMANTIC_FIXTURE_CANDIDATES,
  MISROUTE_TELEMETRY_PIPE_MARKER,
} from './ai-misroute-telemetry.fixtures.js';
import {
  buildMisrouteTelemetryPayload,
  enrichMisrouteTelemetryFromUnderstand,
  matchTopMisrouteScenario,
  recordMisrouteTelemetry,
  resolveMisroutePipelineStage,
  resolveSemanticTelemetry,
  shouldRecordMisrouteTelemetry,
} from './ai-misroute-telemetry.util.js';

describe('ai-misroute-telemetry.util (ai-cmd-h4.4)', () => {
  it('matches curated availability disambiguation prompts', () => {
    const match = matchTopMisrouteScenario(
      'who is free tomorrow evening for permanent lashes',
      'dashboard',
    );
    expect(match?.id).toBe('dashboard-team-check-providers');
    expect(match?.rescueReason).toBe('providers_for_service');
  });

  it('records only for top mis-route prompts', () => {
    expect(
      shouldRecordMisrouteTelemetry({
        surface: 'dashboard',
        prompt: 'who is free tomorrow evening for permanent lashes',
        classifierAction: 'create_booking',
        rescuedAction: 'check_providers_for_service',
        rescueReason: 'create_booking_to_check_providers',
      }),
    ).toBe(true);
    expect(
      shouldRecordMisrouteTelemetry({
        surface: 'dashboard',
        prompt: 'show me revenue for last month',
        classifierAction: 'summarize_day',
        rescuedAction: 'summarize_day',
      }),
    ).toBe(false);
  });

  it('buildMisrouteTelemetryPayload includes rescue metadata', () => {
    const payload = buildMisrouteTelemetryPayload({
      surface: 'customer',
      prompt: 'book the nearest slot for massage tomorrow evening',
      classifierAction: 'unknown',
      rescuedAction: 'book_nearest_slot',
      rescueReason: 'nearest_slot',
      classifierConfidence: 0.62,
      compoundStepCount: 2,
    });
    expect(payload.scenarioId).toBe('customer-flexible-book-nearest');
    expect(payload.misrouted).toBe(true);
    expect(payload.classifierConfidence).toBe(0.62);
    expect(payload.compoundStepCount).toBe(2);
    expect(payload.rescueReason).toBe('nearest_slot');
    expect(payload.pipeMarker).toBe('pipe-1.10.2');
  });

  it('recordMisrouteTelemetry emits via AiEventsService', () => {
    const emitMisrouteTelemetry = jest.fn();
    recordMisrouteTelemetry({ emitMisrouteTelemetry }, 'biz-1', {
      surface: 'dashboard',
      prompt:
        'check who is free tomorrow evening for permanent lashes, book the nearest slot',
      classifierAction: 'create_booking',
      rescuedAction: 'create_booking',
      rescueReason: 'check_and_book_compound',
      classifierConfidence: 0.71,
      compoundStepCount: 2,
    });
    expect(emitMisrouteTelemetry).toHaveBeenCalledWith(
      'biz-1',
      expect.objectContaining({
        surface: 'dashboard',
        classifierAction: 'create_booking',
        rescuedAction: 'create_booking',
        rescueReason: 'check_and_book_compound',
        classifierConfidence: 0.71,
        compoundStepCount: 2,
        misrouted: false,
        pipeMarker: 'pipe-1.10.2',
      }),
    );
  });

  it('skips emit for non-curated prompts', () => {
    const emitMisrouteTelemetry = jest.fn();
    recordMisrouteTelemetry({ emitMisrouteTelemetry }, 'biz-1', {
      surface: 'dashboard',
      prompt: 'summarize unpaid appointments',
      classifierAction: 'summarize_unpaid',
      rescuedAction: 'summarize_unpaid',
    });
    expect(emitMisrouteTelemetry).not.toHaveBeenCalled();
  });
});

describe('ai-misroute-telemetry.util (pipe-1.10.2)', () => {
  it('exports pipe marker', () => {
    expect(MISROUTE_TELEMETRY_PIPE_MARKER).toBe('pipe-1.10.2');
  });

  it('resolveSemanticTelemetry picks highest semantic_match candidate', () => {
    const semantic = resolveSemanticTelemetry(
      MISROUTE_SEMANTIC_FIXTURE_CANDIDATES,
    );
    expect(semantic.semanticAction).toBe('create_booking');
    expect(semantic.semanticConfidence).toBe(0.84);
  });

  it('resolveMisroutePipelineStage uses last pipeline trace stage', () => {
    expect(resolveMisroutePipelineStage(MISROUTE_PIPELINE_TRACE_FIXTURE)).toBe(
      'structural_enrich',
    );
  });

  it('resolveMisroutePipelineStage maps clarify result stages', () => {
    expect(
      resolveMisroutePipelineStage(undefined, {
        resultPipelineStage: 'unknown_intent_clarify',
      }),
    ).toBe('clarify');
  });

  it('enrichMisrouteTelemetryFromUnderstand merges semantic + stage', () => {
    const enriched = enrichMisrouteTelemetryFromUnderstand(
      {
        surface: 'dashboard',
        prompt: 'book nearest haircut tomorrow',
        classifierAction: 'unknown',
        rescuedAction: 'book_nearest_slot',
      },
      {
        status: 'resolved',
        action: 'book_nearest_slot',
        params: {},
        reasoning: 'semantic+rescue',
        confidence: 0.88,
        candidates: MISROUTE_SEMANTIC_FIXTURE_CANDIDATES,
        trace: MISROUTE_PIPELINE_TRACE_FIXTURE,
        gate: {
          action: 'unknown',
          confidence: 0.2,
          shouldEscalateToSemantic: true,
          decision: 'escalate_semantic',
          lowThreshold: 0.55,
          highThreshold: 0.85,
          reason: 'unknown',
        },
        context: {
          originalPrompt: 'book nearest haircut tomorrow',
          normalizedPrompt: 'book nearest haircut tomorrow',
          classifierContext: null,
          method: 'none',
        },
        normalization: {
          normalizedPrompt: 'book nearest haircut tomorrow',
          method: 'none',
          classifierContext: null,
        },
        surface: 'dashboard',
      },
      MISROUTE_PIPELINE_TRACE_FIXTURE,
    );

    expect(enriched.semanticAction).toBe('create_booking');
    expect(enriched.semanticConfidence).toBe(0.84);
    expect(enriched.pipelineStage).toBe('structural_enrich');
  });

  it('buildMisrouteTelemetryPayload includes semantic and pipelineStage', () => {
    const payload = buildMisrouteTelemetryPayload({
      surface: 'dashboard',
      prompt: 'who is free tomorrow evening for permanent lashes',
      classifierAction: 'create_booking',
      rescuedAction: 'check_providers_for_service',
      semanticAction: 'check_providers_for_service',
      semanticConfidence: 0.79,
      pipelineStage: 'semantic_match',
    });

    expect(payload.semanticAction).toBe('check_providers_for_service');
    expect(payload.semanticConfidence).toBe(0.79);
    expect(payload.pipelineStage).toBe('semantic_match');
  });
});
