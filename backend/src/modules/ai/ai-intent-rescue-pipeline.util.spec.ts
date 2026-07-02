import {
  RESCUE_PIPELINE_PHASES,
  RESCUE_PIPELINE_PIPE_MARKER,
  buildRescuePipelineContext,
  runIntentRescuePipeline,
  type IntentRescuePipelineHost,
  type RescuePipelineContext,
} from './ai-intent-rescue-pipeline.util.js';
import type {
  IntentRescueInput,
  IntentRescueResult,
} from './ai-intent-rescue.service.js';

function rescueResult(action: string): IntentRescueResult {
  return {
    action,
    params: {},
    rescued: true,
    rescueReason: 'test',
  };
}

type RescuePipelinePhase = (typeof RESCUE_PIPELINE_PHASES)[number];

function createTrackingHost(): IntentRescuePipelineHost & {
  calls: RescuePipelinePhase[];
} {
  const calls: RescuePipelinePhase[] = [];
  return {
    calls,
    runRescueProviderPhase: () => {
      calls.push('provider_surface');
      return null;
    },
    runRescueClassifiedPhase: () => {
      calls.push('classified_disambiguation');
      return null;
    },
    runRescueUnknownPhase: () => {
      calls.push('unknown_domain');
      return null;
    },
  };
}

describe('ai-intent-rescue-pipeline.util (pipe-1.5.1)', () => {
  it('exports pipe marker and domain-first phase order', () => {
    expect(RESCUE_PIPELINE_PIPE_MARKER).toBe('pipe-1.5.1');
    expect(RESCUE_PIPELINE_PHASES[0]).toBe('provider_surface');
    expect(RESCUE_PIPELINE_PHASES[1]).toBe('classified_disambiguation');
    expect(RESCUE_PIPELINE_PHASES[2]).toBe('unknown_domain');
  });

  it('buildRescuePipelineContext derives budgetSurface from input surface', () => {
    const ctx = buildRescuePipelineContext({
      prompt: 'book anna',
      action: 'unknown',
      params: {},
      surface: 'customer',
    });
    expect(ctx.budgetSurface).toBe('customer');
    expect(ctx.timeZone).toBe('UTC');
  });

  it('runs provider then unknown when action is unknown (skips classified)', () => {
    const host = createTrackingHost();
    runIntentRescuePipeline(host, {
      prompt: 'x',
      action: 'unknown',
      params: {},
    });
    expect(host.calls).toEqual(['provider_surface', 'unknown_domain']);
  });

  it('runs provider then classified when action is known', () => {
    const host = createTrackingHost();
    runIntentRescuePipeline(host, {
      prompt: 'x',
      action: 'summarize_bookings',
      params: {},
    });
    expect(host.calls).toEqual([
      'provider_surface',
      'classified_disambiguation',
    ]);
  });

  it('stops after provider hit without later phases', () => {
    const host = createTrackingHost();
    host.runRescueProviderPhase = () => {
      host.calls.push('provider_surface');
      return rescueResult('list_my_bookings');
    };
    const result = runIntentRescuePipeline(host, {
      prompt: 'my bookings',
      action: 'unknown',
      params: {},
      surface: 'provider',
    });
    expect(result?.action).toBe('list_my_bookings');
    expect(host.calls).toEqual(['provider_surface']);
  });

  it('skips unknown phase when classified action has no domain rescue', () => {
    const host = createTrackingHost();
    const result = runIntentRescuePipeline(host, {
      prompt: 'show revenue',
      action: 'summarize_bookings',
      params: {},
    });
    expect(result).toBeNull();
    expect(host.calls).toEqual([
      'provider_surface',
      'classified_disambiguation',
    ]);
  });

  it('runs unknown phase only when action is unknown', () => {
    const host = createTrackingHost();
    host.runRescueUnknownPhase = (
      _input: IntentRescueInput,
      _ctx: RescuePipelineContext,
    ) => {
      host.calls.push('unknown_domain');
      return rescueResult('create_booking');
    };
    const result = runIntentRescuePipeline(host, {
      prompt: 'book anna tomorrow',
      action: 'unknown',
      params: {},
    });
    expect(result?.action).toBe('create_booking');
    expect(host.calls).toEqual(['provider_surface', 'unknown_domain']);
    expect(host.calls).not.toContain('classified_disambiguation');
  });

  it('pipe-1.5.2 threads semantic param hints through rescue phases', () => {
    const host = createTrackingHost();
    host.runRescueUnknownPhase = (input) => {
      host.calls.push('unknown_domain');
      expect(input.params).toEqual({ bookingFirstAvailable: true });
      return {
        action: 'create_booking',
        params: { employeeName: 'Anna' },
        rescued: true,
        rescueReason: 'create_booking_pattern',
      };
    };

    const result = runIntentRescuePipeline(host, {
      prompt: 'schedule anna for trim',
      action: 'unknown',
      params: {},
      semanticParamHints: { bookingFirstAvailable: true },
    });

    expect(result?.params).toEqual({
      employeeName: 'Anna',
      bookingFirstAvailable: true,
    });
  });
});
