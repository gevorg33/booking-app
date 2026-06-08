import {
  extractPipelineTraceId,
  stampPipelineTrace,
} from './ai-pipeline-trace.util.js';
import type { PipelineTrace } from './command-completion.types.js';

describe('ai-pipeline-trace.util (acc-1.3)', () => {
  it('extractPipelineTraceId reads _traceId from context', () => {
    expect(extractPipelineTraceId({ _traceId: 'trace-abc' })).toBe('trace-abc');
    expect(extractPipelineTraceId({ _traceId: '' })).toBeUndefined();
    expect(extractPipelineTraceId({ other: 'x' })).toBeUndefined();
    expect(extractPipelineTraceId(undefined)).toBeUndefined();
    expect(extractPipelineTraceId(null)).toBeUndefined();
  });

  it('stampPipelineTrace adds traceId to every stage', () => {
    const stages: PipelineTrace[] = [
      { stage: 'classify', action: 'list_bookings', at: 't1' },
      { stage: 'resolve', action: 'list_bookings', at: 't2', traceId: 'trace-1' },
    ];
    expect(stampPipelineTrace(stages, 'trace-1')).toEqual([
      { stage: 'classify', action: 'list_bookings', at: 't1', traceId: 'trace-1' },
      { stage: 'resolve', action: 'list_bookings', at: 't2', traceId: 'trace-1' },
    ]);
  });

  it('stampPipelineTrace is a no-op without traceId or trace array', () => {
    const stages = [{ stage: 'classify' as const, action: 'x', at: 't' }];
    expect(stampPipelineTrace(undefined, 'trace-1')).toBeUndefined();
    expect(stampPipelineTrace(stages, undefined)).toBe(stages);
    expect(stampPipelineTrace(undefined, undefined)).toBeUndefined();
  });
});
