import {
  buildMisrouteTelemetryPayload,
  matchTopMisrouteScenario,
  recordMisrouteTelemetry,
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
  });

  it('recordMisrouteTelemetry emits via AiEventsService', () => {
    const emitMisrouteTelemetry = jest.fn();
    recordMisrouteTelemetry(
      { emitMisrouteTelemetry },
      'biz-1',
      {
        surface: 'dashboard',
        prompt:
          'check who is free tomorrow evening for permanent lashes, book the nearest slot',
        classifierAction: 'create_booking',
        rescuedAction: 'create_booking',
        rescueReason: 'check_and_book_compound',
        classifierConfidence: 0.71,
        compoundStepCount: 2,
      },
    );
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
      }),
    );
  });

  it('skips emit for non-curated prompts', () => {
    const emitMisrouteTelemetry = jest.fn();
    recordMisrouteTelemetry(
      { emitMisrouteTelemetry },
      'biz-1',
      {
        surface: 'dashboard',
        prompt: 'summarize unpaid appointments',
        classifierAction: 'summarize_unpaid',
        rescuedAction: 'summarize_unpaid',
      },
    );
    expect(emitMisrouteTelemetry).not.toHaveBeenCalled();
  });
});
