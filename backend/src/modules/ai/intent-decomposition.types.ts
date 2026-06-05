import type { CommandSurface } from './ai-command-registry.types.js';

export type DecompositionSurface = CommandSurface;

export type DecompositionSource = 'deterministic' | 'golden' | 'llm';

/** Normalized sub-intent produced by deterministic, golden, or LLM decomposition. */
export interface DecomposedIntentStep {
  action: string;
  params: Record<string, unknown>;
  reasoning: string;
  segment?: string;
}

export interface CompoundDecompositionResult {
  surface: DecompositionSurface;
  recipeId?: string;
  source: DecompositionSource;
  steps: DecomposedIntentStep[];
}

/** Documented multi-command NL patterns for eval and golden routing (ai-cmd-0.4). */
export interface GoldenCompoundPattern {
  id: string;
  surface: DecompositionSurface;
  recipeId: string;
  /** Returns true when this pattern should handle the prompt. */
  matches: (prompt: string) => boolean;
  buildSteps: (prompt: string) => DecomposedIntentStep[];
}

export interface DecompositionSchemaView {
  surface: DecompositionSurface;
  allowedActions: readonly string[];
  maxSteps: number;
  sharedEntityBlock: string;
  recipeIds: readonly string[];
  goldenPatternIds: readonly string[];
  promptBlock: string;
}
