/**
 * AI-ROADMAP Phase 3 — the steal guard, driven through the real pipeline.
 *
 * `ai-rescue-steal-guard.spec.ts` tests the rule in isolation. This file proves
 * the rule is actually *wired*: it runs `CommandUnderstandingPipelineService`
 * end to end with a rescue service that tries to steal, and asserts the stolen
 * action never reaches the caller.
 *
 * Without this, "no test regressions" would be indistinguishable from
 * "the guard is never reached".
 */
import { CommandUnderstandingPipelineService } from './command-understanding-pipeline.service.js';
import type { PipelineUnderstandInput } from './command-understanding.types.js';

type RescueStub = {
  action: string;
  rescueReason: string;
  params?: Record<string, unknown>;
};

function buildPipeline(rescue: RescueStub | null) {
  const promptNormalization = {
    normalizeForClassifier: async (
      _businessId: string,
      _userId: string | undefined,
      prompt: string,
    ) => ({
      original: prompt,
      normalized: prompt,
      method: 'passthrough',
      classifierContext: undefined,
    }),
  };
  const fastHeuristics = { score: () => [] };
  const semanticIntent = { match: async () => null };
  const intentRescue = {
    rescue: () =>
      rescue
        ? {
            rescued: true,
            action: rescue.action,
            params: rescue.params ?? {},
            reasoning: `stubbed ${rescue.action}`,
            rescueReason: rescue.rescueReason,
          }
        : { rescued: false },
  };

  return new CommandUnderstandingPipelineService(
    promptNormalization as never,
    fastHeuristics as never,
    semanticIntent as never,
    intentRescue as never,
  );
}

function buildInput(
  classifiedAction: string,
  overrides: Partial<PipelineUnderstandInput> = {},
): PipelineUnderstandInput {
  return {
    businessId: 'biz-1',
    effectivePrompt: 'create a hair category with a cut for 30 min at $40',
    surface: 'dashboard',
    confidenceLow: 0.4,
    confidenceHigh: 0.8,
    classify: async () => ({
      action: classifiedAction,
      params: { categoryName: 'Hair' },
      reasoning: 'stubbed classify',
      confidence: 0.92,
    }),
    ...overrides,
  };
}

describe('steal guard — wired into the understand pipeline', () => {
  it('blocks the e2e-bug.347 steal: bulk_create_catalog stays put', async () => {
    // 16 production traces: the classifier had `bulk_create_catalog` right and
    // rescue replaced it with `create_service_category`, dropping the services.
    const pipeline = buildPipeline({
      action: 'create_service_category',
      rescueReason: 'service_category',
    });

    const result = await pipeline.understand(buildInput('bulk_create_catalog'));

    expect(result.action).toBe('bulk_create_catalog');
  });

  it('records the blocked steal in the trace, naming both sides', async () => {
    const pipeline = buildPipeline({
      action: 'mark_paid',
      rescueReason: 'mark_paid',
    });

    const result = await pipeline.understand(buildInput('update_bookings'));
    const rescueTrace = result.trace.filter((t) => t.stage === 'rescue');

    expect(rescueTrace).toHaveLength(1);
    expect(rescueTrace[0].action).toBe('update_bookings');
    expect(rescueTrace[0].detail).toContain('rescue blocked');
    expect(rescueTrace[0].detail).toContain('mark_paid');
  });

  it('keeps the params rescue extracted even when the action is blocked', async () => {
    // Structural enrichment is the part of rescue that survives the roadmap.
    const pipeline = buildPipeline({
      action: 'create_employee',
      rescueReason: 'create_employee',
      params: { employeeName: 'Dana' },
    });

    const result = await pipeline.understand(buildInput('create_service'));

    expect(result.action).toBe('create_service');
    expect(result.params).toMatchObject({ employeeName: 'Dana' });
  });

  it('still lets rescue resolve an unknown into a mutating command', async () => {
    const pipeline = buildPipeline({
      action: 'create_booking',
      rescueReason: 'create_booking_pattern',
    });

    const result = await pipeline.understand(buildInput('unknown'));

    expect(result.action).toBe('create_booking');
  });

  it('still lets read-only rescues through (Phase 8 retires those)', async () => {
    const pipeline = buildPipeline({
      action: 'list_tour_calendar_week',
      rescueReason: 'list_tour_calendar_week',
    });

    const result = await pipeline.understand(
      buildInput('list_upcoming_tour_departures'),
    );

    expect(result.action).toBe('list_tour_calendar_week');
  });

  it('is a no-op when rescue does not fire at all', async () => {
    const pipeline = buildPipeline(null);
    const result = await pipeline.understand(buildInput('bulk_create_catalog'));

    expect(result.action).toBe('bulk_create_catalog');
    const rescueTrace = result.trace.filter((t) => t.stage === 'rescue');
    expect(rescueTrace[0].detail).toContain('no rescue applied');
  });
});
