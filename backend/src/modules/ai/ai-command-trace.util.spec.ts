import {
  AI_COMMAND_TRACE_PIPE_MARKER,
  COMMAND_TRACE_OUTCOME_SCENARIOS,
  COMMAND_TRACE_REDACT_SCENARIOS,
} from './ai-command-trace.fixtures.js';
import {
  buildAiCommandTraceRow,
  redactCommandTraceParams,
  redactCommandTracePrompt,
  resolveCommandTraceOutcome,
  resolveCommandTraceSource,
} from './ai-command-trace.util.js';

describe('ai-command-trace.util (pipe-1.10.1)', () => {
  it('exports pipe marker', () => {
    expect(AI_COMMAND_TRACE_PIPE_MARKER).toBe('pipe-1.10.1');
  });

  it.each(COMMAND_TRACE_OUTCOME_SCENARIOS)(
    'resolveCommandTraceOutcome $id',
    (scenario) => {
      expect(resolveCommandTraceOutcome(scenario.result)).toBe(
        scenario.expectedOutcome,
      );
    },
  );

  it('resolveCommandTraceSource maps fast heuristics to deterministic', () => {
    expect(resolveCommandTraceSource('fast_heuristic')).toBe('deterministic');
    expect(resolveCommandTraceSource('classifier')).toBe('llm');
    expect(resolveCommandTraceSource('semantic_match')).toBe('llm');
  });

  it.each(COMMAND_TRACE_REDACT_SCENARIOS)(
    'redactCommandTraceParams $id',
    (scenario) => {
      const redacted = redactCommandTraceParams(scenario.params);
      for (const key of scenario.expectKeys) {
        expect(redacted).toHaveProperty(key);
      }
      for (const key of scenario.forbiddenKeys) {
        expect(redacted).not.toHaveProperty(key);
      }
      if (scenario.id === 'phi-field-redacted') {
        for (const key of scenario.redactedPhiKeys ?? []) {
          expect(redacted?.[key]).toBe('[REDACTED_PHI]');
        }
      }
    },
  );

  it('redactCommandTracePrompt redacts embedded PHI kv pairs', () => {
    const redacted = redactCommandTracePrompt(
      'Book Anna; symptoms: migraine for tomorrow',
    );
    expect(redacted).toContain('[REDACTED_PHI]');
    expect(redacted).not.toContain('migraine');
  });

  it('buildAiCommandTraceRow shapes persisted columns', () => {
    const row = buildAiCommandTraceRow({
      businessId: 'biz-1',
      surface: 'dashboard',
      userId: 'user-1',
      role: 'owner',
      promptRaw: 'Book Anna for haircut tomorrow',
      promptNormalized: 'book anna for haircut tomorrow',
      locale: 'en',
      action: 'create_booking',
      confidence: 0.91,
      params: { serviceName: 'Haircut', _availableEmployees: 'Anna' },
      routingTier: 'simple_mutate',
      candidateSource: 'classifier',
      result: { success: true, action: 'create_booking', details: {} },
      latencyMs: 420,
      model: 'gpt-4.1-mini',
      promptTokens: 120,
      completionTokens: 40,
      tokenCostUsd: 0.0025,
      pipelineTrace: [
        {
          stage: 'classify',
          action: 'create_booking',
          at: '2026-06-12T12:00:00.000Z',
        },
      ],
      traceId: 'trace-uuid-1',
    });

    expect(row.traceId).toBe('trace-uuid-1');
    expect(row.businessId).toBe('biz-1');
    expect(row.outcome).toBe('executed');
    expect(row.source).toBe('llm');
    expect(row.params).toEqual({ serviceName: 'Haircut' });
    expect(row.pipelineTrace?.[0]?.stage).toBe('classify');
  });
});
