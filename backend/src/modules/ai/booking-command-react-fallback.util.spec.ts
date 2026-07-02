import {
  REACT_FALLBACK_PIPE_MARKER,
  REACT_FALLBACK_SCENARIOS,
} from './booking-command-react-fallback.fixtures.js';
import {
  attachReactFallbackTelemetry,
  isStillUnknownAfterSemanticRescue,
  shouldUseReactAgentFallback,
} from './booking-command-react-fallback.util.js';

describe('booking-command-react-fallback.util (pipe-1.9.2)', () => {
  it('exports pipe marker', () => {
    expect(REACT_FALLBACK_PIPE_MARKER).toBe('pipe-1.9.2');
  });

  it('detects unknown pipeline terminal action', () => {
    expect(isStillUnknownAfterSemanticRescue({ action: 'unknown' })).toBe(true);
    expect(
      isStillUnknownAfterSemanticRescue({ action: 'create_booking' }),
    ).toBe(false);
  });

  it.each(REACT_FALLBACK_SCENARIOS)(
    'shouldUseReactAgentFallback $id',
    (scenario) => {
      expect(
        shouldUseReactAgentFallback({
          reactEnabled: scenario.reactEnabled,
          complexityTier: scenario.complexityTier,
          pipelineResult: scenario.result,
        }),
      ).toBe(scenario.expectFallback);
    },
  );

  it('attachReactFallbackTelemetry stamps pipe marker', () => {
    const stamped = attachReactFallbackTelemetry({
      success: true,
      action: 'react_agent',
      summary: 'proposal',
      details: { langGraphPath: 'react_agent' },
    });
    expect(stamped.details.reactFallback).toBe(true);
    expect(stamped.details.pipeMarker).toBe('pipe-1.9.2');
  });
});
