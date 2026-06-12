import type { CommandSurface } from './ai-command-registry.types.js';

export type SemanticIntentLocale = 'en' | 'hy' | 'ru' | 'translit';

export interface IntentAnchor {
  id: string;
  action: string;
  phrase: string;
  locale: SemanticIntentLocale;
  surfaces: CommandSurface[];
  /** Param hints merged when this anchor wins (e.g. bookingFirstAvailable). */
  paramHints?: Record<string, unknown>;
  /**
   * Synonymous token groups — deterministic matcher scores coverage across groups.
   * No entity names; generic booking/schedule vocabulary only.
   */
  conceptGroups?: string[][];
  /** Provenance for anchor bank auditing (acc-3.11 / acc-3.12). */
  source?: 'canonical' | 'eval';
}

export interface SemanticIntentMatchOptions {
  businessId: string;
  userId?: string;
  /** Raw or normalized prompt text used for matching. */
  prompt: string;
  /** When set, skips AiPromptNormalizationService (caller already normalized). */
  normalizedPrompt?: string;
  surface: CommandSurface;
  allowedActions?: string[];
  lastAction?: string;
}

export interface SemanticIntentMatch {
  action: string;
  confidence: number;
  anchorId: string;
  paramHints: Record<string, unknown>;
  reasoning: string;
  rescueReason: 'semantic_match';
}

export interface RankedAnchorMatch {
  anchor: IntentAnchor;
  score: number;
}
