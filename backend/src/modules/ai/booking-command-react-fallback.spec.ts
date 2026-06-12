import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { REACT_FALLBACK_PIPE_MARKER } from './booking-command-react-fallback.fixtures.js';

const GRAPH_SOURCE = readFileSync(
  join(__dirname, 'booking-command-graph.service.ts'),
  'utf8',
);

describe('BookingCommandGraphService ReAct fallback wiring (pipe-1.9.2)', () => {
  it('runs pipeline before ReAct and gates on unknown result', () => {
    expect(GRAPH_SOURCE).toContain('shouldUseReactAgentFallback({');
    expect(GRAPH_SOURCE).toContain('attachReactFallbackTelemetry(');
    expect(GRAPH_SOURCE).not.toContain('shouldUseReactAgent(');
    expect(GRAPH_SOURCE).not.toContain('AMBIGUOUS_PATTERNS');
    expect(GRAPH_SOURCE).not.toContain('ORCHESTRATION_INTENT_HINTS');

    const executeIndex = GRAPH_SOURCE.indexOf(
      'input.delegates.executeSingleIntent()',
    );
    const fallbackIndex = GRAPH_SOURCE.indexOf('shouldUseReactAgentFallback({');
    expect(executeIndex).toBeGreaterThan(-1);
    expect(fallbackIndex).toBeGreaterThan(executeIndex);
  });

  it('uses pipe-1.9.2 marker contract', () => {
    expect(REACT_FALLBACK_PIPE_MARKER).toBe('pipe-1.9.2');
  });
});
