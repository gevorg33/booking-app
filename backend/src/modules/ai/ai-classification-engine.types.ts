import type { CommandSurface } from './ai-command-registry.types.js';
import type { ComplexityRoute } from './command-complexity-router.service.js';
import type { ClassifiedIntent } from './ai-command-routing.util.js';
import type { EntityMemory } from './ai-settings.types.js';
import type { ClassificationTieBreakerResult } from './ai-classification-escalation.util.js';

export type ClassificationSurface = CommandSurface;

export interface FewShotExample {
  id: string;
  prompt: string;
  action: string;
  surface: ClassificationSurface;
  locale?: string;
}

export interface SemanticPhraseEntry {
  id: string;
  action: string;
  surface: ClassificationSurface;
  phrase: string;
  locale?: string;
  /** acc-3.12 — canonical JSON bank vs eval/harvest pipeline row. */
  source?: 'canonical' | 'eval_paraphrase' | 'harvested' | 'business_learned';
}

export interface SemanticIntentMatch {
  action: string;
  confidence: number;
  matchedPhraseId: string;
  source:
    | 'canonical'
    | 'eval_paraphrase'
    | 'business_alias'
    | 'business_learned'
    | 'embedding';
}

export interface FieldLevelConfidence {
  action: number;
  date?: number;
  timeSlot?: number;
  employeeName?: number;
  serviceName?: number;
}

export interface ClassificationVerification {
  ok: boolean;
  confidence: number;
  fieldConfidence: FieldLevelConfidence;
  reasons: string[];
  source?: 'rules' | 'llm' | 'rules+llm';
  llmVerified?: boolean;
}

export interface ClassificationConsensus {
  needsEscalation: boolean;
  deterministicHint?: string;
  deterministicPreferredAction?: string;
  llmAction: string;
  reason?: string;
}

export interface ClassificationEngineAppendix {
  block: string;
  fewShotCount: number;
  shortlistCount: number;
  shortlist: string[];
  abVariantId?: string;
}

export interface BuildClassifierAppendixInput {
  businessId: string;
  prompt: string;
  surface: ClassificationSurface;
  entityMemory?: EntityMemory;
  abVariantId?: string;
}

export interface EnrichClassificationInput {
  businessId?: string;
  prompt: string;
  surface: ClassificationSurface;
  intent: ClassifiedIntent;
  deterministicRoute?: ComplexityRoute;
  entityMemory?: EntityMemory;
  shortlist?: string[];
  skipLlmSelfCheck?: boolean;
  skipEscalationTieBreaker?: boolean;
  /** acc-6.2 — business-specific rescue rules from failure closure pipeline. */
  learnedRescueRules?: import('./ai-settings.types.js').LearnedTelemetryRescueRule[];
  /** acc-3.11 — optional embedding semantic matcher (AiSemanticIntentService). */
  semanticMatcher?: (
    input: EnrichClassificationInput,
  ) => Promise<SemanticIntentMatch | null>;
}

export interface EnrichedClassification {
  intent: ClassifiedIntent;
  verification: ClassificationVerification;
  consensus: ClassificationConsensus;
  semanticMatch?: SemanticIntentMatch;
  tieBreaker?: ClassificationTieBreakerResult;
}
