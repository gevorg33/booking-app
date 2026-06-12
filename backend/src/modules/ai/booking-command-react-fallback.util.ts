import type { CommandResult } from './command-completion.types.js';
import type { ComplexityRoute } from './booking-command-graph.service.js';
import { REACT_FALLBACK_PIPE_MARKER } from './booking-command-react-fallback.fixtures.js';

export { REACT_FALLBACK_PIPE_MARKER };

export type ReactFallbackGateInput = {
  reactEnabled: boolean;
  complexityTier?: ComplexityRoute['tier'];
  pipelineResult: Pick<CommandResult, 'action'>;
};

/**
 * True when understand pipeline (semantic + rescue) left intent unresolved (pipe-1.9.2).
 */
export function isStillUnknownAfterSemanticRescue(
  result: Pick<CommandResult, 'action'>,
): boolean {
  return result.action === 'unknown';
}

/** ReAct runs only as fallback — never before pipeline classify/rescue (pipe-1.9.2). */
export function shouldUseReactAgentFallback(
  input: ReactFallbackGateInput,
): boolean {
  if (!input.reactEnabled) return false;
  if (input.complexityTier === 'compound') return false;
  return isStillUnknownAfterSemanticRescue(input.pipelineResult);
}

export function attachReactFallbackTelemetry(
  result: CommandResult,
): CommandResult {
  return {
    ...result,
    details: {
      ...result.details,
      reactFallback: true,
      pipeMarker: REACT_FALLBACK_PIPE_MARKER,
    },
  };
}
