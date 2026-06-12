import type { CommandSurface } from './ai-command-registry.types.js';
import type { SemanticIntentLocale } from './ai-semantic-intent.types.js';

/** One canonical utterance in the phrasing bank (acc-3.12). */
export interface CanonicalPhrasingEntry {
  id: string;
  action: string;
  locale: SemanticIntentLocale;
  phrase: string;
  surfaces: CommandSurface[];
  paramHints?: Record<string, unknown>;
  /** Shared concept groups for deterministic CI matching (optional per entry). */
  conceptGroups?: string[][];
}

export interface CanonicalPhrasingBankDocument {
  version: number;
  entries: CanonicalPhrasingEntry[];
}

export interface CanonicalPhrasingBankStats {
  version: number;
  totalEntries: number;
  byAction: Record<string, number>;
  byLocale: Record<SemanticIntentLocale, number>;
  intentsWithEnHyRu: string[];
}
