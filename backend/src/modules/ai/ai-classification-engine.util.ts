import { tokenizeForRag } from './ai-rag.util.js';
import {
  CLASSIFICATION_AB_VARIANTS,
} from './ai-classification-engine.fixtures.js';
import { matchTelemetryRescueHint } from './ai-telemetry-rescue.util.js';
import {
  buildIntentShortlist,
  DEFAULT_SHORTLIST_LIMIT,
  formatIntentShortlistBlock,
  reconcileClassifiedActionWithShortlist,
} from './ai-classification-shortlist.util.js';
import {
  matchSemanticIntentLexical,
} from './ai-semantic-intent.util.js';
export { SEMANTIC_MATCH_THRESHOLD } from './ai-semantic-intent.util.js';
import {
  DEFAULT_FEWSHOT_LIMIT,
  getDefaultGlobalFewShotPool,
  filterFewShotPoolBySurface,
  retrieveFewShotExamplesByTokenOverlap,
} from './ai-classification-fewshot.util.js';
import {
  applyPhrasingMemoryToClassifiedIntent,
} from './ai-classification-phrasing.util.js';
import { PHRASING_CLASSIFIER_BIAS_RULES } from './ai-classification-phrasing.fixtures.js';
import type {
  BuildClassifierAppendixInput,
  ClassificationConsensus,
  ClassificationEngineAppendix,
  ClassificationSurface,
  ClassificationVerification,
  EnrichClassificationInput,
  EnrichedClassification,
  FewShotExample,
  SemanticIntentMatch,
} from './ai-classification-engine.types.js';
import type { ClassifiedIntent } from './ai-command-routing.util.js';
import {
  buildPhrasingMemoryBlock,
  findPhrasingMemoryHits,
  inferIntentBiasFromPhrasing,
} from './ai-classification-phrasing.util.js';
import {
  runClassificationSelfCheck,
  verifyClassifiedIntent,
} from './ai-classification-selfcheck.util.js';
import { attachFieldConfidenceMetadata } from './ai-classification-field-confidence.util.js';
import {
  assessClassificationConsensus,
} from './ai-classification-escalation.util.js';
import {
  applySemanticMatchToIntent,
  shouldRunSemanticMatcherForIntent,
} from './ai-semantic-confidence.util.js';

export { shouldSuppressFalseCompound } from './ai-compound-precision.util.js';
import type { EntityMemory } from './ai-settings.types.js';

export { DEFAULT_FEWSHOT_LIMIT } from './ai-classification-fewshot.util.js';
export {
  buildIntentShortlist,
  DEFAULT_SHORTLIST_LIMIT,
  formatIntentShortlistBlock,
  formatDynamicActionEnum,
  reconcileClassifiedActionWithShortlist,
} from './ai-classification-shortlist.util.js';
export {
  runClassificationSelfCheck,
  verifyClassifiedIntent,
} from './ai-classification-selfcheck.util.js';
export {
  assessClassificationConsensus,
  inferDeterministicPreferredAction,
  isMutatingClassificationAction,
} from './ai-classification-escalation.util.js';
export {
  attachFieldConfidenceMetadata,
  buildFieldConfidenceClarifyIfNeeded,
  deriveFieldLevelConfidence,
  listLowConfidenceFields,
} from './ai-classification-field-confidence.util.js';
export {
  applySemanticMatchToIntent,
  buildSemanticClarifyCandidates,
  buildSemanticClarifySummary,
  buildSemanticConfidenceClarifyIfNeeded,
  resolveSemanticMatchDisposition,
  shouldApplySemanticMatch,
  shouldRunSemanticMatcherForIntent,
} from './ai-semantic-confidence.util.js';

export type ClassificationVerifyFn = (
  input: EnrichClassificationInput,
  intent: ClassifiedIntent,
) => Promise<ClassificationVerification> | ClassificationVerification;

export function tokenizeClassificationPrompt(prompt: string): string[] {
  return tokenizeForRag(prompt);
}

/** acc-3.11 lexical semantic matcher (CI / offline fallback). */
export function matchSemanticIntent(
  prompt: string,
  surface: ClassificationSurface,
  options: {
    threshold?: number;
    entityMemory?: EntityMemory;
  } = {},
): SemanticIntentMatch | null {
  return matchSemanticIntentLexical(prompt, surface, options);
}

/** acc-3.1 lexical fallback — prefer AiClassificationFewShotService for embedding retrieval. */
export function retrieveFewShotExamples(
  prompt: string,
  surface: ClassificationSurface,
  limit = DEFAULT_FEWSHOT_LIMIT,
): FewShotExample[] {
  return retrieveFewShotExamplesByTokenOverlap(
    prompt,
    surface,
    filterFewShotPoolBySurface(getDefaultGlobalFewShotPool(), surface),
    limit,
  );
}

export function formatFewShotBlock(examples: FewShotExample[]): string {
  if (examples.length === 0) return '';
  const lines = examples.map(
    (entry) =>
      `- Prompt: "${entry.prompt}" → action "${entry.action}"`,
  );
  return `Similar labeled examples (few-shot retrieval, acc-3.1):\n${lines.join('\n')}`;
}

/** acc-3.10 — A/B appendix variant selector. */
export function resolveClassificationAbVariant(
  abVariantId?: string,
): keyof typeof CLASSIFICATION_AB_VARIANTS {
  if (abVariantId === CLASSIFICATION_AB_VARIANTS.fewshot_heavy.id) {
    return 'fewshot_heavy';
  }
  return 'control';
}

export function buildClassifierAppendix(
  input: BuildClassifierAppendixInput,
  fewShots?: FewShotExample[],
): ClassificationEngineAppendix {
  const variant = resolveClassificationAbVariant(input.abVariantId);
  const fewShotLimit =
    variant === 'fewshot_heavy' ? DEFAULT_FEWSHOT_LIMIT + 2 : DEFAULT_FEWSHOT_LIMIT;
  const resolvedFewShots =
    fewShots ??
    retrieveFewShotExamples(input.prompt, input.surface, fewShotLimit);
  const phrasingHits = findPhrasingMemoryHits(
    input.prompt,
    input.entityMemory,
    input.surface,
  );
  const phrasingBias = inferIntentBiasFromPhrasing(
    phrasingHits,
    input.prompt,
    input.surface,
  );
  const shortlist = buildIntentShortlist({
    prompt: input.prompt,
    surface: input.surface,
    limit: DEFAULT_SHORTLIST_LIMIT,
    boostIntents: phrasingBias.boostIntents,
  });
  const sections = [
    formatFewShotBlock(resolvedFewShots),
    formatIntentShortlistBlock(shortlist),
    buildPhrasingMemoryBlock(phrasingHits, input.surface),
    PHRASING_CLASSIFIER_BIAS_RULES,
    variant === 'fewshot_heavy'
      ? 'Classifier experiment: fewshot_heavy variant active (acc-3.10).'
      : '',
  ].filter(Boolean);

  return {
    block: sections.join('\n\n'),
    fewShotCount: resolvedFewShots.length,
    shortlistCount: shortlist.length,
    shortlist,
    abVariantId: CLASSIFICATION_AB_VARIANTS[variant].id,
  };
}

/** Post-classify enrichment: semantic rescue, verify, consensus, field confidence. */
export async function enrichClassifiedIntent(
  input: EnrichClassificationInput,
  verifyFn?: ClassificationVerifyFn,
): Promise<EnrichedClassification> {
  const intent: ClassifiedIntent = {
    ...input.intent,
    params: { ...(input.intent.params ?? {}) },
  };

  let semanticMatch: SemanticIntentMatch | undefined;
  const classifierAction = intent.action;
  const classifierConfidence = intent.confidence;

  if (
    shouldRunSemanticMatcherForIntent({
      action: intent.action,
      confidence: intent.confidence,
    })
  ) {
    semanticMatch =
      (input.semanticMatcher
        ? await input.semanticMatcher(input)
        : matchSemanticIntent(input.prompt, input.surface, {
            entityMemory: input.entityMemory,
          })) ?? undefined;

    if (semanticMatch) {
      applySemanticMatchToIntent({
        intent,
        semanticMatch,
        classifierAction,
        classifierConfidence,
      });
    }
  }

  const telemetryHint = matchTelemetryRescueHint(
    input.prompt,
    intent.action,
    input.surface,
    input.learnedRescueRules ?? [],
  );
  if (telemetryHint) {
    intent.action = telemetryHint.toAction;
    intent.reasoning = `Telemetry rescue hint ${telemetryHint.hintId} (acc-3.8)`;
    intent.confidence = Math.max(intent.confidence ?? 0, 0.82);
  }

  Object.assign(
    intent,
    applyPhrasingMemoryToClassifiedIntent(
      intent,
      input.prompt,
      input.surface,
      input.entityMemory,
    ),
  );

  if (input.shortlist?.length) {
    const reconciled = reconcileClassifiedActionWithShortlist(
      intent.action,
      input.prompt,
      input.surface,
      input.shortlist,
    );
    if (reconciled.adjusted) {
      intent.action = reconciled.action;
      intent.reasoning = `Shortlist reconcile (${reconciled.reason})`;
      intent.params = intent.params ?? {};
      intent.params._classificationSource = 'shortlist';
      intent.confidence = Math.max(intent.confidence ?? 0, 0.7);
    }
  }

  const defaultVerify: ClassificationVerifyFn = (_enrichInput, classified) =>
    runClassificationSelfCheck({
      prompt: input.prompt,
      surface: input.surface,
      intent: classified,
    });
  const verification = await (verifyFn ?? defaultVerify)(input, intent);
  intent.confidence = verification.confidence;
  intent.params = intent.params ?? {};
  attachFieldConfidenceMetadata(input.prompt, input.surface, intent, verification.fieldConfidence);
  if (!verification.ok) {
    intent.params._classificationNeedsClarify = true;
    intent.params._classificationVerifyReasons = verification.reasons;
  }

  const consensus = assessClassificationConsensus(
    intent,
    input.deterministicRoute,
    input.prompt,
    input.surface,
  );
  if (consensus.needsEscalation) {
    intent.params._classificationEscalate = true;
    intent.params._classificationEscalateReason = consensus.reason;
  }

  return {
    intent,
    verification,
    consensus,
    semanticMatch,
  };
}

export {
  applyTelemetryRescueRule,
  matchTelemetryRescueHint,
} from './ai-telemetry-rescue.util.js';
export {
  buildNormalizationClassifierContext,
  normalizePromptForClassifier,
  splitMixedScriptBoundaries,
} from './ai-prompt-normalization.util.js';
