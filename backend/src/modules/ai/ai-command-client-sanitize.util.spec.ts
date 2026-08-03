import {
  INTERNAL_COMMAND_DETAIL_KEYS,
  sanitizeCommandDetailsForClient,
  sanitizeCommandResultForClient,
  sanitizeSessionContextForClient,
} from './ai-command-client-sanitize.util.js';

describe('ai-command-client-sanitize.util (e2e-bug.135)', () => {
  it('lists the known pipeline leak keys', () => {
    expect(INTERNAL_COMMAND_DETAIL_KEYS).toEqual(
      expect.arrayContaining([
        'pipelineTrace',
        'langGraphReasoning',
        'langGraphPath',
        'confidence',
        'traceId',
        'pipeMarker',
        'gateway',
        'candidateSource',
        'routingTier',
      ]),
    );
  });

  it('strips pipeline/observability fields and keeps UI fields', () => {
    const details = sanitizeCommandDetailsForClient({
      needsClarification: true,
      missing: ['date'],
      taskId: 'task-1',
      requiresApproval: true,
      navigate: { path: 'bookings' },
      availableProviders: ['Gevorg'],
      sessionContext: {
        employeeName: 'Gevorg',
        date: '18/07/2026',
        _capabilityHints: 'SECRET PROMPT',
        _entityMemoryBlock: 'mary → customer',
        _commandTraceId: 'trace-1',
        _confidenceHigh: 0.85,
      },
      params: {
        employeeName: 'Gevorg',
        _availableEmployees: 'Gevorg, Mary',
      },
      pipelineTrace: [
        {
          stage: 'classify',
          detail: 'confidence 0.9 >= high threshold 0.85',
        },
      ],
      langGraphReasoning: 'internal chain',
      langGraphPath: 'react_agent',
      confidence: 0.9,
      candidateSource: 'classifier',
      routingTier: 'read_only',
      traceId: 'trace-1',
      traceRecorder: { id: 'rec' },
      pipeMarker: 'pipe-1',
      gateway: { surface: 'dashboard', tier: 'owner' },
      _availableEmployees: 'Gevorg, Mary',
      _availableServices: 'Massage',
      reactFallback: true,
    });

    expect(details).toEqual({
      needsClarification: true,
      missing: ['date'],
      taskId: 'task-1',
      requiresApproval: true,
      navigate: { path: 'bookings' },
      availableProviders: ['Gevorg'],
      sessionContext: {
        employeeName: 'Gevorg',
        date: '18/07/2026',
      },
      params: { employeeName: 'Gevorg' },
    });
    expect(details.pipelineTrace).toBeUndefined();
    expect(details.gateway).toBeUndefined();
    expect(details.confidence).toBeUndefined();
  });

  it('e2e-bug.135 re-verification: strips reasoning/pipelineStage and internal hints nested inside partialParams/enrichedParams', () => {
    const details = sanitizeCommandDetailsForClient({
      needsClarification: true,
      missing: [{ field: 'date' }],
      reasoning: 'The user is asking for a summary of their day.',
      pipelineStage: 'clarify',
      partialParams: {
        allProviders: false,
        _structuralEnrichHints: { dateRange: false },
        _timeZone: 'Asia/Yerevan',
      },
      enrichedParams: {
        templateId: 'tpl-1',
        templateName: 'Standard Mon-Fri',
        _availableEmployees: 'Gevorg, Karo, Jujo, Mariam',
        _availableServices: 'Swedish massage, Deep tissue massage',
      },
    });

    expect(details).toEqual({
      needsClarification: true,
      missing: [{ field: 'date' }],
      partialParams: { allProviders: false },
      enrichedParams: { templateId: 'tpl-1', templateName: 'Standard Mon-Fri' },
    });
    expect(details.reasoning).toBeUndefined();
    expect(details.pipelineStage).toBeUndefined();
    expect(
      (details.partialParams as Record<string, unknown>)._structuralEnrichHints,
    ).toBeUndefined();
    expect(
      (details.enrichedParams as Record<string, unknown>)._availableEmployees,
    ).toBeUndefined();
  });

  it('sanitizeSessionContextForClient drops underscore internals', () => {
    expect(
      sanitizeSessionContextForClient({
        lastAction: 'summarize_day',
        _accessTier: 'owner',
        _roleProfile: 'owner',
        _entityMemoryAliases: { mary: {} },
      }),
    ).toEqual({ lastAction: 'summarize_day' });
  });

  it('sanitizeCommandResultForClient preserves guide and top-level shape', () => {
    const result = sanitizeCommandResultForClient({
      success: true,
      action: 'summarize_day',
      summary: 'Quiet day.',
      guide: {
        summary: 'Day summary',
        steps: [],
      },
      details: {
        pipelineTrace: [{ stage: 'execute' }],
        bookingMetric: 'count',
      },
    });
    expect(result).toEqual({
      success: true,
      action: 'summarize_day',
      summary: 'Quiet day.',
      guide: { summary: 'Day summary', steps: [] },
      details: { bookingMetric: 'count' },
    });
  });
});
