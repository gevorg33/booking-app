import {
  COMMAND_TRACE_RECORDER_SCENARIOS,
  MISROUTE_TRACE_PAYLOAD_FIXTURE,
} from './ai-command-trace-recorder.fixtures.js';
import {
  appendMisrouteTelemetryTrace,
  buildGatewayCommandTraceInput,
  buildPersistedCommandTraceRow,
  COMMAND_TRACE_ID_CONTEXT_KEY,
  COMMAND_TRACE_RECORDER_PIPE_MARKER,
  extractCommandTraceMetadata,
  finalizeCommandTraceResult,
  resolveCommandTraceId,
  resolvePersistedTraceOutcome,
  stampCommandTraceDetails,
} from './ai-command-trace-recorder.util.js';
import type { CommandResult } from './command-completion.types.js';

describe('ai-command-trace-recorder.util (pipe-1.10.3)', () => {
  it('uses context trace id when present', () => {
    expect(
      resolveCommandTraceId({ [COMMAND_TRACE_ID_CONTEXT_KEY]: 'trace-ctx-1' }),
    ).toBe('trace-ctx-1');
  });

  it('generates trace id when context missing', () => {
    const id = resolveCommandTraceId(undefined);
    expect(id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    );
  });

  it.each(COMMAND_TRACE_RECORDER_SCENARIOS)(
    'maps outcome $id → $expectedOutcome',
    ({ result, expectedOutcome }) => {
      expect(resolvePersistedTraceOutcome(result)).toBe(expectedOutcome);
    },
  );

  it('appends misroute telemetry stage to pipeline trace', () => {
    const trace = appendMisrouteTelemetryTrace(
      [{ stage: 'classify', action: 'create_booking', at: 't0' }],
      MISROUTE_TRACE_PAYLOAD_FIXTURE,
    );
    expect(trace.at(-1)).toEqual(
      expect.objectContaining({
        stage: 'telemetry',
        action: 'check_providers_for_service',
        detail: expect.stringContaining('misroute'),
      }),
    );
  });

  it('stamps trace recorder marker on clarify result', () => {
    const result: CommandResult = {
      success: false,
      action: 'create_booking',
      summary: 'need more detail',
      details: { needsClarification: true },
    };
    const stamped = stampCommandTraceDetails(result, {
      traceId: 'trace-1',
      pipelineTrace: [{ stage: 'clarify', action: 'create_booking', at: 't1' }],
    });
    expect(stamped.details?.traceId).toBe('trace-1');
    expect(stamped.details?.traceRecorder).toBe(COMMAND_TRACE_RECORDER_PIPE_MARKER);
  });

  it('finalize merges misroute into pipeline trace once', () => {
    const result: CommandResult = {
      success: true,
      action: 'check_providers_for_service',
      summary: 'ok',
      details: {
        pipelineTrace: [{ stage: 'execute', action: 'check_providers_for_service', at: 't2' }],
      },
    };
    const finalized = finalizeCommandTraceResult(result, {
      traceId: 'trace-2',
      misrouteTelemetry: MISROUTE_TRACE_PAYLOAD_FIXTURE,
    });
    const trace = finalized.details?.pipelineTrace as Array<{ stage: string }>;
    expect(trace.filter((step) => step.stage === 'telemetry')).toHaveLength(1);
    expect(finalized.details?.misrouteTelemetry).toEqual(
      MISROUTE_TRACE_PAYLOAD_FIXTURE,
    );
  });

  it('buildGatewayCommandTraceInput extracts metadata from result details', () => {
    const result: CommandResult = {
      success: true,
      action: 'list_bookings',
      summary: 'ok',
      details: {
        traceId: 'trace-3',
        confidence: 0.91,
        routingTier: 'read_only',
        candidateSource: 'fast_heuristic',
        partialParams: { date: 'today' },
        pipelineTrace: [{ stage: 'execute', action: 'list_bookings', at: 't3' }],
      },
    };
    const input = buildGatewayCommandTraceInput({
      params: {
        surface: 'dashboard',
        businessId: 'biz-1',
        prompt: 'show appointments today',
        userId: 'user-1',
      },
      result,
      surface: 'dashboard',
      traceId: 'trace-3',
      latencyMs: 42,
    });
    expect(input.confidence).toBe(0.91);
    expect(input.routingTier).toBe('read_only');
    expect(input.candidateSource).toBe('fast_heuristic');
    expect(input.params).toEqual({ date: 'today' });
    const row = buildPersistedCommandTraceRow(input);
    expect(row.outcome).toBe('executed');
    expect(row.traceId).toBe('trace-3');
    expect(row.latencyMs).toBe(42);
  });

  it('extractCommandTraceMetadata reads nested details', () => {
    const metadata = extractCommandTraceMetadata({
      details: {
        traceId: 't-4',
        confidence: 0.5,
        misrouteTelemetry: MISROUTE_TRACE_PAYLOAD_FIXTURE,
      },
    });
    expect(metadata.traceId).toBe('t-4');
    expect(metadata.misrouteTelemetry?.scenarioId).toBe(
      'dashboard-create-to-check-providers',
    );
  });
});
