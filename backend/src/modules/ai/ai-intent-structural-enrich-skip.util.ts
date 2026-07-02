import type { SelfVerifyClarifyPayload } from './ai-unknown-intent.util.js';
import type { SelfVerifyStageOutcome } from './ai-unknown-intent.util.js';
import { STRUCTURAL_ENRICH_SKIP_PIPE_MARKER } from './ai-intent-structural-enrich-skip.fixtures.js';

export { STRUCTURAL_ENRICH_SKIP_PIPE_MARKER };

/** Pipeline trace detail when structural enrich is bypassed after self-verify clarify. */
export const STRUCTURAL_ENRICH_SKIP_TRACE_DETAIL =
  'skipped; self_verify clarify (pipe-1.6.2)';

/**
 * Structural enrich runs only after self-verify passes or applies a correction.
 * Clarify outcomes skip enrich (pipe-1.7.3).
 */
export function shouldSkipStructuralEnrichAfterSelfVerify(
  selfVerify: Pick<SelfVerifyStageOutcome, 'clarify'>,
): boolean {
  return selfVerify.clarify != null;
}

export function buildStructuralEnrichSkipTraceDetail(action: string): {
  stage: 'structural_enrich';
  action: string;
  detail: string;
} {
  return {
    stage: 'structural_enrich',
    action,
    detail: STRUCTURAL_ENRICH_SKIP_TRACE_DETAIL,
  };
}

export function assertStructuralEnrichSkipped(
  clarify: SelfVerifyClarifyPayload | undefined,
): boolean {
  return clarify != null;
}
