import type { CommandSurface } from './ai-command-registry.types.js';
import type { ClassifiedIntent } from './ai-command-routing.util.js';
import type { CommandResult } from './command-completion.types.js';
import type { ValidationIssue } from './command-completion.types.js';
import type {
  PipelineUnderstandResult,
  PipelineUnderstandInput,
} from './command-understanding.types.js';
import type { PipelineContext } from './command-understanding.types.js';
import type { PromptNormalizationResult } from './ai-prompt-normalization.service.js';
import type { ConfidenceGateResult } from './command-understanding.types.js';
import type { PipelineTrace } from './command-completion.types.js';
import {
  applySelfVerifyCorrection,
  type SelfVerifyResult,
} from './ai-intent-self-verify.util.js';
import { UNKNOWN_INTENT_PIPE_MARKER } from './ai-unknown-intent.fixtures.js';

export { UNKNOWN_INTENT_PIPE_MARKER };

/** pipe-1.8.1 — block `unknown` from handler switch. */
export const UNKNOWN_INTENT_GUARD_PIPE_MARKER = 'pipe-1.8.1';

/** pipe-1.6.2 / acc-3.4 — clarify when self-verify fails and confidence is below this. */
export const SELF_VERIFY_CLARIFY_CONFIDENCE_THRESHOLD = 0.55;

export type SelfVerifyClarifyPayload = {
  summary: string;
  clarifyFields: string[];
  suggestions: string[];
  loweredConfidence: number;
  ruleId: string;
  reason: string;
};

export type SelfVerifyStageOutcome = {
  intent: ClassifiedIntent | null;
  result: SelfVerifyResult;
  clarify?: SelfVerifyClarifyPayload;
};

export function shouldEmitSelfVerifyClarify(
  result: SelfVerifyResult,
  confidence: number,
): boolean {
  return (
    !result.passed &&
    !result.correctedAction &&
    confidence < SELF_VERIFY_CLARIFY_CONFIDENCE_THRESHOLD
  );
}

export function lowerConfidenceAfterSelfVerifyFailure(
  confidence: number,
): number {
  return Math.min(confidence, SELF_VERIFY_CLARIFY_CONFIDENCE_THRESHOLD - 0.01);
}

function intentChoiceLabel(surface: CommandSurface): string {
  if (surface === 'provider') return 'What should I do?';
  if (surface === 'customer' || surface === 'public') {
    return 'What would you like to do?';
  }
  return 'Which action did you mean?';
}

function buildClarifyIssues(
  clarifyFields: string[],
  summary: string,
  surface: CommandSurface,
): ValidationIssue[] {
  return clarifyFields.map((field) => ({
    field,
    label: field === 'intentChoice' ? intentChoiceLabel(surface) : field,
    message: summary,
  }));
}

function suggestionsForRule(
  ruleId: string | undefined,
  surface: CommandSurface,
): string[] {
  if (ruleId === 'booking_vs_clear_mismatch') {
    return [
      'Book Anna for a haircut tomorrow at 3pm',
      'Clear Gevorg schedule for tomorrow',
      'Hide done appointments from the calendar this week',
    ];
  }

  if (ruleId === 'schedule_vocab_mismatch') {
    if (surface === 'provider') {
      return [
        'Show my bookings for today',
        'Block my schedule tomorrow afternoon',
      ];
    }
    return [
      'Create work time for Gevorg next week',
      'Book Anna for a haircut tomorrow at 3pm',
      'Clear Gevorg schedule for tomorrow',
    ];
  }

  return [
    'Book Anna for a haircut tomorrow at 3pm',
    "Show today's appointments",
    'Clear Gevorg schedule for tomorrow',
  ].slice(0, 3);
}

function summaryForUnknownIntent(surface: CommandSurface): string {
  if (surface === 'provider') {
    return "I'm not sure what you meant. Pick one of these, or rephrase your request.";
  }
  if (surface === 'customer' || surface === 'public') {
    return "I didn't fully understand that. What would you like to do?";
  }
  return "I didn't fully understand that command. Which of these did you mean?";
}

/** True when dispatch must not enter the handler switch (pipe-1.8.1). */
export function isUnknownIntentForHandlerBlock(
  action: string | undefined,
): boolean {
  return !action || action === 'unknown';
}

export function shouldBlockUnknownFromHandlerSwitch(
  action: string | undefined,
): boolean {
  return isUnknownIntentForHandlerBlock(action);
}

/** Clarify payload when intent remains unknown after understand + post-rescue (acc-4.7). */
export function buildUnknownIntentClarifyPayload(
  surface: CommandSurface,
  options: { confidence?: number; reasoning?: string } = {},
): SelfVerifyClarifyPayload {
  return {
    summary: summaryForUnknownIntent(surface),
    clarifyFields: ['intentChoice'],
    suggestions: suggestionsForRule(undefined, surface),
    loweredConfidence:
      typeof options.confidence === 'number' ? options.confidence : 0,
    ruleId: 'unknown_intent',
    reason: options.reasoning ?? 'intent_remained_unknown',
  };
}

export function buildUnknownIntentClarifyResult(opts: {
  surface: CommandSurface;
  prompt: string;
  params?: Record<string, unknown>;
  reasoning?: string;
  confidence?: number;
  trace?: PipelineTrace[];
}): CommandResult {
  const payload = buildUnknownIntentClarifyPayload(opts.surface, {
    confidence: opts.confidence,
    reasoning: opts.reasoning,
  });

  const understood: PipelineUnderstandResult = {
    status: 'clarify',
    action: 'unknown',
    params: opts.params ?? {},
    reasoning: opts.reasoning ?? payload.summary,
    confidence: payload.loweredConfidence,
    candidates: [],
    trace: opts.trace ?? [],
    gate: {
      action: 'unknown',
      confidence: payload.loweredConfidence,
      shouldEscalateToSemantic: true,
      decision: 'escalate_semantic',
      lowThreshold: SELF_VERIFY_CLARIFY_CONFIDENCE_THRESHOLD,
      highThreshold: 0.85,
      reason: 'unknown intent',
    },
    context: {
      originalPrompt: opts.prompt,
      normalizedPrompt: opts.prompt,
      classifierContext: null,
      method: 'passthrough',
    },
    normalization: {
      original: opts.prompt,
      normalized: opts.prompt,
      method: 'passthrough',
      classifierContext: null,
    },
    surface: opts.surface,
    clarifyFields: payload.clarifyFields,
    clarifySummary: payload.summary,
    clarifySuggestions: payload.suggestions,
    blockReason: 'unknown intent clarify (pipe-1.8.1)',
  };

  const result = buildPipelineClarifyCommandResult(understood, payload);
  result.action = 'unknown';
  result.details.pipelineStage = 'unknown_intent_clarify';
  result.details.pipeMarker = UNKNOWN_INTENT_GUARD_PIPE_MARKER;
  result.details.prompt = opts.prompt;
  return result;
}

function summaryForSelfVerifyFailure(
  result: SelfVerifyResult,
  action: string,
): string {
  if (result.ruleId === 'booking_vs_clear_mismatch') {
    return `I'm not sure whether you want to book an appointment or change the provider schedule (classified as "${action.replace(/_/g, ' ')}").`;
  }
  if (result.ruleId === 'schedule_vocab_mismatch') {
    return `This sounds like a schedule change, but I couldn't tell which schedule action you meant (classified as "${action.replace(/_/g, ' ')}").`;
  }
  return `I'm not fully confident I understood that command (classified as "${action.replace(/_/g, ' ')}").`;
}

/** Targeted clarify when self-verify fails without a deterministic correction (acc-3.4, acc-4.7). */
export function buildTargetedClarifyFromSelfVerifyFailure(
  intent: Pick<ClassifiedIntent, 'action' | 'confidence'>,
  result: SelfVerifyResult,
  surface: CommandSurface,
): SelfVerifyClarifyPayload {
  const loweredConfidence = lowerConfidenceAfterSelfVerifyFailure(
    typeof intent.confidence === 'number' ? intent.confidence : 0,
  );
  const summary = summaryForSelfVerifyFailure(result, intent.action);
  const suggestions = suggestionsForRule(result.ruleId, surface).slice(0, 3);

  return {
    summary,
    clarifyFields: ['intentChoice'],
    suggestions,
    loweredConfidence,
    ruleId: result.ruleId ?? 'unknown',
    reason: result.reason ?? 'self_verify_mismatch',
  };
}

/** Resolve self-verify stage: apply correction or emit targeted clarify payload. */
export function resolveSelfVerifyStageOutcome(
  prompt: string,
  working: ClassifiedIntent,
  surface: CommandSurface,
): SelfVerifyStageOutcome {
  const { intent, result } = applySelfVerifyCorrection(prompt, working);
  const confidence =
    typeof intent.confidence === 'number' ? intent.confidence : 0;

  if (!shouldEmitSelfVerifyClarify(result, confidence)) {
    return { intent, result };
  }

  return {
    intent: {
      ...intent,
      confidence: lowerConfidenceAfterSelfVerifyFailure(confidence),
    },
    result,
    clarify: buildTargetedClarifyFromSelfVerifyFailure(intent, result, surface),
  };
}

export function buildSelfVerifyClarifyUnderstandResult(opts: {
  input: PipelineUnderstandInput;
  trace: PipelineTrace[];
  normalization: PromptNormalizationResult;
  context: PipelineContext;
  gate: ConfidenceGateResult;
  intent: ClassifiedIntent;
  clarify: SelfVerifyClarifyPayload;
  candidates: PipelineUnderstandResult['candidates'];
  complexityRoute?: PipelineUnderstandResult['complexityRoute'];
}): PipelineUnderstandResult {
  return {
    status: 'clarify',
    action: opts.intent.action,
    params: opts.intent.params ?? {},
    reasoning:
      opts.intent.reasoning ??
      `Self-verify clarify (${opts.clarify.ruleId}: ${opts.clarify.reason})`,
    confidence: opts.clarify.loweredConfidence,
    candidates: opts.candidates,
    trace: opts.trace,
    gate: opts.gate,
    context: opts.context,
    normalization: opts.normalization,
    surface: opts.input.surface,
    complexityRoute: opts.complexityRoute,
    clarifyFields: opts.clarify.clarifyFields,
    clarifySummary: opts.clarify.summary,
    clarifySuggestions: opts.clarify.suggestions,
    blockReason: `self_verify clarify: ${opts.clarify.ruleId}`,
  };
}

/** Map pipeline clarify status to a CommandResult for AiCommandService. */
export function buildPipelineClarifyCommandResult(
  understood: PipelineUnderstandResult,
  clarify: SelfVerifyClarifyPayload,
): CommandResult {
  const issues = buildClarifyIssues(
    clarify.clarifyFields,
    clarify.summary,
    understood.surface,
  );

  return {
    success: false,
    action: understood.action,
    summary: clarify.summary,
    details: {
      needsClarification: true,
      missing: issues,
      partialParams: understood.params,
      reasoning: understood.reasoning,
      confidence: understood.confidence,
      pipelineStage: 'self_verify_clarify',
      pipelineTrace: understood.trace,
      clarifyFields: clarify.clarifyFields,
      suggestions: clarify.suggestions,
      selfVerifyRuleId: clarify.ruleId,
      selfVerifyReason: clarify.reason,
      pipeMarker: UNKNOWN_INTENT_PIPE_MARKER,
    },
  };
}
