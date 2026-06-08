/** acc-3.15 — minimum score to consider a semantic match at all. */
export const SEMANTIC_CLARIFY_MIN_CONFIDENCE = 0.55;

/** acc-3.15 — auto-adopt semantic rescue at or above this score (read-only intents). */
export const SEMANTIC_EXECUTE_MIN_CONFIDENCE = 0.72;

/** acc-3.15 — higher bar for mutating/destructive semantic rescues (wrong-execution guardrail). */
export const SEMANTIC_MUTATING_EXECUTE_MIN_CONFIDENCE = 0.78;

/** Minimum classifier confidence to include LLM action in top-2 semantic clarify. */
export const SEMANTIC_CLARIFY_CLASSIFIER_MIN = 0.35;

export interface SemanticClarifyCandidate {
  action: string;
  confidence: number;
  source: 'semantic' | 'classifier';
  label: string;
}

export interface SemanticConfidenceScenario {
  id: string;
  semanticConfidence: number;
  action: string;
  mutating?: boolean;
  expectedDisposition: 'execute' | 'clarify' | 'reject';
}

export const SEMANTIC_CONFIDENCE_SCENARIOS: SemanticConfidenceScenario[] = [
  {
    id: 'execute-read-only-high',
    semanticConfidence: 0.86,
    action: 'check_providers_for_service',
    expectedDisposition: 'execute',
  },
  {
    id: 'clarify-mutating-medium',
    semanticConfidence: 0.74,
    action: 'create_booking',
    mutating: true,
    expectedDisposition: 'clarify',
  },
  {
    id: 'clarify-read-only-medium',
    semanticConfidence: 0.62,
    action: 'list_bookings',
    expectedDisposition: 'clarify',
  },
  {
    id: 'reject-weak',
    semanticConfidence: 0.48,
    action: 'create_booking',
    expectedDisposition: 'reject',
  },
];

export const SEMANTIC_CLARIFY_PROMPT_SCENARIOS: ReadonlyArray<{
  id: string;
  prompt: string;
  surface: 'dashboard' | 'customer' | 'provider' | 'public';
  classifierAction: string;
  classifierConfidence: number;
  semanticAction: string;
  semanticConfidence: number;
  expectClarify: boolean;
  expectCandidateCount?: number;
}> = [
  {
    id: 'unknown-weak-semantic',
    prompt: 'maybe something about appointments tomorrow',
    surface: 'dashboard',
    classifierAction: 'unknown',
    classifierConfidence: 0.2,
    semanticAction: 'list_bookings',
    semanticConfidence: 0.61,
    expectClarify: true,
    expectCandidateCount: 1,
  },
  {
    id: 'classifier-vs-semantic-top2',
    prompt: 'who can do lashes tomorrow evening',
    surface: 'dashboard',
    classifierAction: 'create_booking',
    classifierConfidence: 0.46,
    semanticAction: 'check_providers_for_service',
    semanticConfidence: 0.63,
    expectClarify: true,
    expectCandidateCount: 2,
  },
  {
    id: 'strong-semantic-no-clarify',
    prompt: 'book massage with Gevorg tomorrow at 10',
    surface: 'dashboard',
    classifierAction: 'unknown',
    classifierConfidence: 0.1,
    semanticAction: 'create_booking',
    semanticConfidence: 0.84,
    expectClarify: false,
  },
];
