import type { PromptNormalizationResult } from './ai-prompt-normalization.service.js';
import type { PipelineContext } from './command-understanding.types.js';

/** Build pipeline context from normalize-stage output (pipe-1.1.1). */
export function buildPipelineContext(
  effectivePrompt: string,
  normalization: PromptNormalizationResult,
): PipelineContext {
  const trimmed = effectivePrompt.trim();
  return {
    originalPrompt: normalization.original || trimmed,
    normalizedPrompt: normalization.normalized,
    classifierContext: normalization.classifierContext,
    method: normalization.method,
  };
}

export function pipelineContextFromNormalization(
  normalization: PromptNormalizationResult,
): PipelineContext {
  return buildPipelineContext(normalization.original, normalization);
}
