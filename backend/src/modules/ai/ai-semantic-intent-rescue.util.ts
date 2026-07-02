import type { ClassifiedIntent } from './ai-command-routing.util.js';
import type { CommandSurface } from './ai-command-registry.types.js';
import { enrichBookingTimeHintsFromPrompt } from './ai-intent-heuristics.js';
import type { AiSemanticIntentService } from './ai-semantic-intent.service.js';
import { shouldEscalateToSemantic } from './confidence-gate.util.js';
import type { PromptNormalizationResult } from './ai-prompt-normalization.service.js';
import type { SemanticIntentMatch } from './ai-semantic-intent.types.js';

export interface SemanticIntentRescueInput {
  businessId: string;
  userId?: string;
  effectivePrompt: string;
  parsed: ClassifiedIntent;
  surface: CommandSurface;
  confidenceLow: number;
  confidenceHigh: number;
  promptNorm?: PromptNormalizationResult;
  lastAction?: string;
  normalizePrompt: () => Promise<PromptNormalizationResult>;
}

export interface SemanticIntentRescueResult {
  parsed: ClassifiedIntent;
  semantic: SemanticIntentMatch;
}

export async function trySemanticIntentRescue(
  semanticIntent: AiSemanticIntentService,
  input: SemanticIntentRescueInput,
): Promise<SemanticIntentRescueResult | null> {
  if (
    !shouldEscalateToSemantic(input.parsed.action, input.parsed.confidence, {
      low: input.confidenceLow,
      high: input.confidenceHigh,
    })
  ) {
    return null;
  }

  const norm = input.promptNorm ?? (await input.normalizePrompt());
  const semantic = await semanticIntent.match({
    businessId: input.businessId,
    userId: input.userId,
    prompt: norm.normalized,
    surface: input.surface,
    lastAction: input.lastAction,
  });
  if (!semantic) return null;

  const parsed: ClassifiedIntent = {
    ...input.parsed,
    action: semantic.action,
    params: { ...input.parsed.params, ...semantic.paramHints },
    reasoning: semantic.reasoning,
    confidence: Math.max(
      typeof input.parsed.confidence === 'number' ? input.parsed.confidence : 0,
      semantic.confidence,
    ),
  };
  enrichBookingTimeHintsFromPrompt(
    parsed.action,
    parsed.params,
    input.effectivePrompt,
  );

  return { parsed, semantic };
}

export function semanticMatchToClassifiedIntent(
  semantic: SemanticIntentMatch,
  prompt: string,
): ClassifiedIntent {
  const params = { ...semantic.paramHints };
  enrichBookingTimeHintsFromPrompt(semantic.action, params, prompt);
  return {
    action: semantic.action,
    params,
    reasoning: semantic.reasoning,
    confidence: semantic.confidence,
  };
}
