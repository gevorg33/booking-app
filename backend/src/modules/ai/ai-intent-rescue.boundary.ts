/**
 * pipe-1.5.1 — semantic match is a pipeline stage only; domain rescues run in AiIntentRescueService.
 * @see docs/INTENT_RESCUE_PIPELINE_BOUNDARY.md
 */
export const RESCUE_PIPELINE_BOUNDARY_MARKER = 'pipe-1.5.1';

export const INTENT_RESCUE_PIPELINE_BOUNDARY_DOC =
  'backend/docs/INTENT_RESCUE_PIPELINE_BOUNDARY.md';

/** Production rescue files subject to the semantic-exclusion guard. */
export const RESCUE_BOUNDARY_RELATIVE_FILES = [
  'ai-intent-rescue.service.ts',
] as const;

/** Must not appear in rescue service — semantic runs in CommandUnderstandingPipelineService only. */
export const RESCUE_FORBIDDEN_IMPORT_SUBSTRINGS = [
  'ai-semantic-intent.service',
  'ai-semantic-intent-rescue',
  'trySemanticIntentRescue',
  'semanticMatchToClassifiedIntent',
  'AiSemanticIntentService',
] as const;

/** Must not appear in rescue service source — no semantic tier inside rescue(). */
export const RESCUE_FORBIDDEN_SOURCE_SUBSTRINGS = [
  'trySemanticIntentRescue',
  'semanticIntent.match',
  'AiSemanticIntentService',
] as const;
