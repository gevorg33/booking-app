import { Injectable, Logger, Optional } from '@nestjs/common';
import type { EntityStore } from './ai-entity-store.util.js';
import { AiCommandPlannerService } from './ai-command-planner.service.js';
import {
  decidePlannerRoute,
  plannerExecuteDomains,
  RETIRED_DETECTOR_DOMAINS,
} from './ai-planner-route.util.js';
import { COMMAND_SPECS } from './ai-command-spec.registry.js';
import type { AccessTier } from './access-control.matrix.js';
import { AiPromptNormalizationService } from './ai-prompt-normalization.service.js';
import { AiSemanticIntentService } from './ai-semantic-intent.service.js';
import { AiIntentRescueService } from './ai-intent-rescue.service.js';
import { resolveAssistantModeFromSession } from './ai-assistant-mode.util.js';
import { FastIntentHeuristicsService } from './fast-intent-heuristics.service.js';
import type { ClassifiedIntent } from './ai-command-routing.util.js';
import {
  resolveParsedIntent,
  runParallelRouteAndClassification,
} from './ai-command-routing.util.js';
import { evaluateConfidenceGate } from './confidence-gate.util.js';
import {
  classifiedIntentToCandidate,
  PIPELINE_UNDERSTAND_STAGE_ORDER,
  type IntentCandidate,
  type PipelineContext,
  type PipelineUnderstandInput,
  type PipelineUnderstandResult,
} from './command-understanding.types.js';
import { buildPipelineContext } from './command-understanding-context.util.js';
import {
  appendPipelineTrace,
  isUnderstandTraceOrdered,
} from './command-understanding-pipeline.util.js';
import {
  candidateToClassifiedIntent,
  DEFAULT_RERANK_RUNNER_UP_MARGIN,
  filterRerankEligibleCandidates,
  mergeAndRerankIntentCandidates,
  mergeCandidateParams,
  rerankIntentCandidates,
  rescueResultToCandidate,
  semanticMatchToCandidate,
  type RerankIntentCandidatesResult,
} from './intent-candidate-rerank.util.js';
import {
  mergeSemanticParamHintsOnly,
  resolveSemanticWinnerParamHints,
} from './semantic-rescue-param-hints.util.js';
import { FAST_HEURISTIC_RERANK_MIN_CONFIDENCE } from './fast-intent-heuristics.util.js';
import { resolveSemanticAllowedActions } from './semantic-allowed-actions.util.js';
import { buildNarrowIntentShortlist } from './narrow-intent-shortlist.util.js';
import { isSemanticStealProtectedPrompt } from './semantic-steal-guard.util.js';
import {
  buildSelfVerifyClarifyUnderstandResult,
  resolveSelfVerifyStageOutcome,
} from './ai-unknown-intent.util.js';
import {
  buildStructuralEnrichSkipTraceDetail,
  shouldSkipStructuralEnrichAfterSelfVerify,
} from './ai-intent-structural-enrich-skip.util.js';
import {
  evaluateRescueActionChange,
  describeBlockedSteal,
} from './ai-rescue-steal-guard.js';
import {
  applyStructuralIntentEnrichment,
  readStructuralEnrichHints,
  summarizeStructuralEnrichTrace,
} from './ai-intent-structural-enrich.util.js';
@Injectable()
export class CommandUnderstandingPipelineService {
  private readonly logger = new Logger(
    CommandUnderstandingPipelineService.name,
  );

  constructor(
    private readonly promptNormalization: AiPromptNormalizationService,
    private readonly fastHeuristics: FastIntentHeuristicsService,
    private readonly semanticIntent: AiSemanticIntentService,
    private readonly intentRescue: AiIntentRescueService,
    /**
     * e2e-bug.392 — optional and last so every existing four-argument
     * construction keeps working. Absent means the planner stage is skipped,
     * which is the same outcome as the flag being unset.
     */
    @Optional()
    private readonly planner?: AiCommandPlannerService,
  ) {}

  async understand(
    input: PipelineUnderstandInput,
  ): Promise<PipelineUnderstandResult> {
    const trace = [] as PipelineUnderstandResult['trace'];
    const candidates: IntentCandidate[] = [];

    const { normalization, context } = await this.stageNormalize(input, trace);
    if (!context.normalizedPrompt.trim()) {
      return this.blockedResult(input, trace, normalization, context, {
        action: 'unknown',
        reason: 'empty prompt after normalization',
      });
    }

    this.stageFastHeuristics(input, context, trace, candidates);
    await this.stagePlannerRoute(input, context, trace, candidates);

    const { classified, complexityRoute } = await this.stageClassify(
      input,
      trace,
      context,
      candidates,
    );

    const gate = this.stageConfidenceGate(input, trace, classified);
    await this.stageSemanticMatch(input, trace, context, gate, candidates);

    const rerank = this.stageRerank(input.effectivePrompt, trace, candidates);
    let working = rerank?.working ?? classified;

    working = await this.stageNarrowReclassify(
      input,
      trace,
      context,
      rerank,
      working,
      candidates,
    );

    working = this.stageRescue(input, trace, working, candidates);
    const selfVerify = this.stageSelfVerify(
      input.effectivePrompt,
      input.surface,
      trace,
      working,
    );
    if (shouldSkipStructuralEnrichAfterSelfVerify(selfVerify)) {
      const skipTrace = buildStructuralEnrichSkipTraceDetail(
        selfVerify.intent?.action ?? 'unknown',
      );
      appendPipelineTrace(
        trace,
        skipTrace.stage,
        skipTrace.action,
        skipTrace.detail,
      );
      return buildSelfVerifyClarifyUnderstandResult({
        input,
        trace,
        normalization,
        context,
        gate,
        intent: selfVerify.intent!,
        clarify: selfVerify.clarify!,
        candidates,
        complexityRoute,
      });
    }
    working = selfVerify.intent;
    working = this.stageStructuralEnrich(input, trace, working);

    if (!working) {
      return this.blockedResult(input, trace, normalization, context, {
        action: 'unknown',
        reason: 'no intent resolved after understand pipeline',
        gate,
        complexityRoute,
      });
    }

    if (!isUnderstandTraceOrdered(trace)) {
      this.logger.warn(
        `Understand trace stage order mismatch: ${trace.map((t) => t.stage).join(' → ')}`,
      );
    }

    const status = working.action === 'unknown' ? 'unknown' : 'resolved';
    return {
      status,
      action: working.action,
      params: working.params ?? {},
      reasoning: working.reasoning,
      confidence:
        typeof working.confidence === 'number' ? working.confidence : 0,
      candidates,
      trace,
      gate,
      context,
      normalization,
      surface: input.surface,
      complexityRoute,
      blockReason: status === 'unknown' ? 'intent remained unknown' : undefined,
    };
  }

  private async stageNormalize(
    input: PipelineUnderstandInput,
    trace: PipelineUnderstandResult['trace'],
  ): Promise<{
    normalization: PipelineUnderstandResult['normalization'];
    context: PipelineContext;
  }> {
    const normalization =
      input.promptNorm ??
      (await this.promptNormalization.normalizeForClassifier(
        input.businessId,
        input.userId,
        input.effectivePrompt,
      ));
    const context = buildPipelineContext(input.effectivePrompt, normalization);
    appendPipelineTrace(
      trace,
      'normalize',
      context.method,
      context.classifierContext
        ? `i18n context attached; normalized=${context.normalizedPrompt.slice(0, 80)}`
        : context.normalizedPrompt.slice(0, 120),
    );
    return { normalization, context };
  }

  /**
   * AI-ROADMAP Phase 8 / e2e-bug.392 — the planner as a routing path.
   *
   * Emits an `IntentCandidate` rather than short-circuiting. The candidate then
   * goes through the same rerank, steal-guard, self-verify and structural-enrich
   * stages as every other source, which is the point: the planner earns the
   * route on the existing machinery instead of stepping around safety checks
   * that were built for good reasons.
   *
   * Every failure path is a no-op, so with the flag unset — the default — this
   * method returns before doing any work and the pipeline is bit-for-bit what it
   * was. A planner error, a timeout or a declined plan all leave the candidate
   * list untouched and the detector path decides, exactly as today.
   *
   * The confidence carried is the plan's own. It is deliberately not boosted:
   * if the planner cannot outrank a paraphrase detector on its own number, that
   * is a finding about whether the slice is ready, and inflating it here would
   * hide precisely the signal Phase 8 needs.
   */
  private async stagePlannerRoute(
    input: PipelineUnderstandInput,
    context: PipelineContext,
    trace: PipelineUnderstandResult['trace'],
    candidates: IntentCandidate[],
  ): Promise<void> {
    const domains = plannerExecuteDomains();
    if (domains.size === 0 || !this.planner) return;

    const tier = input.sessionContext?._accessTier as AccessTier | undefined;
    if (!tier) return;

    try {
      const outcome = await this.planner.plan({
        businessId: input.businessId,
        surface: input.surface,
        tier,
        message: input.effectivePrompt,
        userId: input.userId,
        context: {
          today: new Date().toISOString().slice(0, 10),
          timeZone: input.timeZone ?? 'UTC',
          // e2e-bug.370 — the store the gateway's carrier put on the command
          // context, so a single-step follow-up can bind "it" to a previous
          // turn. Absent (no carrier, flag off, anonymous) it is simply null.
          entityStore:
            (input.sessionContext?._conversationEntityStore as
              | EntityStore
              | undefined) ?? null,
          turnIndex:
            typeof input.sessionContext?._conversationTurnIndex === 'number'
              ? input.sessionContext._conversationTurnIndex
              : undefined,
        },
      });
      if (outcome.status !== 'executable') {
        appendPipelineTrace(
          trace,
          'planner',
          'skipped',
          `planner status ${outcome.status}`,
        );
        return;
      }

      const decision = decidePlannerRoute(
        outcome.plan,
        outcome.validation,
        COMMAND_SPECS,
        domains,
      );
      if (!decision.routed) {
        appendPipelineTrace(trace, 'planner', 'skipped', decision.reason);
        return;
      }

      // e2e-bug.403 — in a retired domain the planner outranks the classifier by
      // precedence, not by confidence.
      //
      // §93 locked `tour` and `guide` against rescue and gave them to the
      // planner in the same commit, because a domain routed but not locked lets
      // rescue overrule the planner. The mirror case was missed: locked but
      // *outranked* lets the classifier's answer stand — and on rescue-dependent
      // traffic that answer is by definition the one rescue used to override.
      // Measured on `tour`: routed correctly, lost 3 of 11 on a hundredth of a
      // point, 97% -> 76%.
      //
      // Outside retired domains this is 0 and the ranking is unchanged: the
      // planner still has to win on its own number, which is what keeps §90's
      // "it competes, it is not privileged" true everywhere the detectors are
      // still doing the work.
      const retired = RETIRED_DETECTOR_DOMAINS.includes(
        decision.route.domain.toLowerCase(),
      );
      candidates.push({
        action: decision.route.action,
        confidence: decision.route.confidence,
        source: 'planner',
        params: decision.route.params,
        ...(retired ? { precedence: 1 } : {}),
        reasoning: `planner routed ${decision.route.command} (${decision.route.domain})${retired ? ', retired domain' : ''}`,
      });
      appendPipelineTrace(
        trace,
        'planner',
        decision.route.action,
        // e2e-bug.404 — the confirmation note is for the trace only. The gate
        // that acts on it is in `ai-command.service.ts`, re-derived from the
        // registry, so a route reaching execute without this note still gets
        // confirmed.
        `routed ${decision.route.command}${
          decision.route.requiresConfirmation ? ' (needs confirmation)' : ''
        }`,
      );
    } catch (error) {
      // Never fail the request because the planner did. The detector path is
      // still whole and is what would have run anyway.
      this.logger.warn(
        `planner routing stage failed, falling through: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      appendPipelineTrace(trace, 'planner', 'skipped', 'planner threw');
    }
    void context;
  }

  private stageFastHeuristics(
    input: PipelineUnderstandInput,
    context: PipelineContext,
    trace: PipelineUnderstandResult['trace'],
    candidates: IntentCandidate[],
  ): void {
    const assistantMode = resolveAssistantModeFromSession({
      prompt: input.effectivePrompt,
      surface: input.surface,
      sessionContext: input.sessionContext,
    });
    const heuristicCandidates = this.fastHeuristics.score({
      prompt: context.normalizedPrompt,
      surface: input.surface,
      employees: input.employees,
      assistantMode,
    });
    candidates.push(...heuristicCandidates);

    const top = heuristicCandidates[0];
    const rerankEligible = heuristicCandidates.filter(
      (candidate) =>
        candidate.confidence >= FAST_HEURISTIC_RERANK_MIN_CONFIDENCE,
    ).length;
    appendPipelineTrace(
      trace,
      'fast_heuristics',
      top?.action ?? 'none',
      heuristicCandidates.length
        ? `${heuristicCandidates
            .map(
              (candidate) =>
                `${candidate.action}@${candidate.confidence.toFixed(2)}`,
            )
            .join(', ')}; rerank_eligible=${rerankEligible}`
        : 'no structural routing hints',
    );
  }

  private async stageClassify(
    input: PipelineUnderstandInput,
    trace: PipelineUnderstandResult['trace'],
    context: PipelineContext,
    candidates: IntentCandidate[],
  ): Promise<{
    classified: ClassifiedIntent | null;
    complexityRoute?: PipelineUnderstandResult['complexityRoute'];
  }> {
    let classified: ClassifiedIntent | null = null;
    let complexityRoute: PipelineUnderstandResult['complexityRoute'];

    const classify = async () =>
      resolveParsedIntent({
        preclassified: input.preclassified,
        classify:
          input.classify?.bind(null, context) ??
          (async () => {
            throw new Error(
              'PipelineUnderstandInput.classify is required without preclassified',
            );
          }),
      });

    if (input.resolveRoute) {
      const parallel = await runParallelRouteAndClassification({
        resolveRoute: input.resolveRoute,
        classify,
      });
      complexityRoute = parallel.route;
      classified = parallel.classification;
      appendPipelineTrace(
        trace,
        'classify',
        classified?.action ?? 'null',
        `parallel route tier=${parallel.route.tier}`,
      );
    } else {
      classified = await classify();
      appendPipelineTrace(
        trace,
        'classify',
        classified?.action ?? 'null',
        classified
          ? `confidence=${classified.confidence ?? 'n/a'}`
          : 'classifier returned null',
      );
    }

    if (classified) {
      candidates.push(classifiedIntentToCandidate(classified));
    } else if (input.preclassified) {
      appendPipelineTrace(trace, 'classify', 'preclassified-null', 'skipped');
    }

    if (!classified && !context.normalizedPrompt.trim()) {
      return { classified: null, complexityRoute };
    }

    return { classified, complexityRoute };
  }

  private stageConfidenceGate(
    input: PipelineUnderstandInput,
    trace: PipelineUnderstandResult['trace'],
    classified: ClassifiedIntent | null,
  ) {
    const gate = evaluateConfidenceGate(
      classified?.action ?? 'unknown',
      classified?.confidence,
      { low: input.confidenceLow, high: input.confidenceHigh },
    );
    appendPipelineTrace(trace, 'confidence_gate', gate.decision, gate.reason);
    return gate;
  }

  private async stageSemanticMatch(
    input: PipelineUnderstandInput,
    trace: PipelineUnderstandResult['trace'],
    context: PipelineContext,
    gate: PipelineUnderstandResult['gate'],
    candidates: IntentCandidate[],
  ): Promise<void> {
    const shouldMatch =
      gate.shouldEscalateToSemantic ||
      candidates.length === 0 ||
      candidates.every((c) => c.action === 'unknown');

    if (!shouldMatch) {
      appendPipelineTrace(trace, 'semantic_match', 'skipped', gate.reason);
      return;
    }

    const allowedActions = resolveSemanticAllowedActions(
      input.surface,
      input.lastAction,
    );
    if (allowedActions.length === 0) {
      appendPipelineTrace(
        trace,
        'semantic_match',
        'skipped',
        `no semantic anchors for surface=${input.surface}`,
      );
      return;
    }

    if (isSemanticStealProtectedPrompt(input.effectivePrompt)) {
      appendPipelineTrace(
        trace,
        'semantic_match',
        'skipped',
        'domain-protected (pipe-1.5.3)',
      );
      return;
    }

    const semantic = await this.semanticIntent.match({
      businessId: input.businessId,
      userId: input.userId,
      prompt: context.originalPrompt,
      normalizedPrompt: context.normalizedPrompt,
      surface: input.surface,
      allowedActions,
      lastAction: input.lastAction,
    });

    if (!semantic) {
      appendPipelineTrace(
        trace,
        'semantic_match',
        'no_match',
        `${gate.reason}; allowed=${allowedActions.join(',')}`,
      );
      return;
    }

    candidates.push(semanticMatchToCandidate(semantic));
    appendPipelineTrace(
      trace,
      'semantic_match',
      semantic.action,
      `anchor=${semantic.anchorId} confidence=${semantic.confidence} allowed=${allowedActions.join(',')}`,
    );
  }

  private stageRerank(
    effectivePrompt: string,
    trace: PipelineUnderstandResult['trace'],
    candidates: IntentCandidate[],
  ): {
    working: ClassifiedIntent;
    ambiguous: boolean;
    winner: IntentCandidate;
    rawRerank: RerankIntentCandidatesResult;
  } | null {
    const merged = mergeAndRerankIntentCandidates(candidates, {
      runnerUpMargin: DEFAULT_RERANK_RUNNER_UP_MARGIN,
    });

    if (!merged) {
      appendPipelineTrace(trace, 'rerank', 'no_candidates', 'skipped');
      return null;
    }

    const deferredHeuristic =
      merged.rawWinner.source === 'fast_heuristic' &&
      merged.winner.source !== 'fast_heuristic';
    appendPipelineTrace(
      trace,
      'rerank',
      merged.winner.action,
      merged.ambiguous
        ? `ambiguous top2 margin=${DEFAULT_RERANK_RUNNER_UP_MARGIN}; phase1=${merged.winner.source}; merged=${merged.merged.length} eligible=${merged.eligible.length}`
        : deferredHeuristic
          ? `phase1 deferred fast_heuristic; winner source=${merged.winner.source} confidence=${merged.winner.confidence}; merged=${merged.merged.length}`
          : `winner source=${merged.winner.source} confidence=${merged.winner.confidence}; merged=${merged.merged.length} eligible=${merged.eligible.length}`,
    );

    return {
      working: candidateToClassifiedIntent(merged.winner, effectivePrompt),
      ambiguous: merged.ambiguous,
      winner: merged.winner,
      rawRerank: {
        winner: merged.rawWinner,
        ranked: merged.ranked,
        ambiguous: merged.ambiguous,
      },
    };
  }

  private async stageNarrowReclassify(
    input: PipelineUnderstandInput,
    trace: PipelineUnderstandResult['trace'],
    context: PipelineContext,
    rerank: { working: ClassifiedIntent; ambiguous: boolean } | null,
    working: ClassifiedIntent | null,
    candidates: IntentCandidate[],
  ): Promise<ClassifiedIntent | null> {
    if (!rerank?.ambiguous) {
      appendPipelineTrace(
        trace,
        'narrow_reclassify',
        'skipped',
        'top candidate not ambiguous',
      );
      return working;
    }

    if (!input.narrowReclassify) {
      appendPipelineTrace(
        trace,
        'narrow_reclassify',
        'skipped',
        'no narrowReclassify callback',
      );
      return working;
    }

    const ranked =
      rerankIntentCandidates(filterRerankEligibleCandidates(candidates))
        ?.ranked ?? [];
    const shortlist = buildNarrowIntentShortlist(ranked, input.surface);
    if (shortlist.length === 0) {
      appendPipelineTrace(
        trace,
        'narrow_reclassify',
        'skipped',
        'empty shortlist for surface',
      );
      return working;
    }

    const reclassified = await input.narrowReclassify(shortlist, context);

    if (!reclassified) {
      appendPipelineTrace(
        trace,
        'narrow_reclassify',
        'no_match',
        `shortlist=${shortlist.join(',')}`,
      );
      return working;
    }

    candidates.push(
      classifiedIntentToCandidate(reclassified, 'narrow_reclassify'),
    );
    appendPipelineTrace(
      trace,
      'narrow_reclassify',
      reclassified.action,
      `shortlist=${shortlist.join(',')} count=${shortlist.length}`,
    );
    return reclassified;
  }

  private stageRescue(
    input: PipelineUnderstandInput,
    trace: PipelineUnderstandResult['trace'],
    working: ClassifiedIntent | null,
    candidates: IntentCandidate[],
  ): ClassifiedIntent | null {
    const base =
      working ??
      ({
        action: 'unknown',
        params: {},
        reasoning: 'rescue baseline',
        confidence: 0,
      } satisfies ClassifiedIntent);

    const semanticParamHints = resolveSemanticWinnerParamHints(candidates);
    const hasSemanticHints = Object.keys(semanticParamHints).length > 0;

    // e2e-bug.234 — page-threaded manage credentials must reach
    // tryRescueManageBookingWithToken (it treats params as the session bag).
    const rescueParams: Record<string, unknown> = { ...(base.params ?? {}) };
    const sessionCtx = input.sessionContext;
    if (
      (rescueParams.bookingId == null || rescueParams.bookingId === '') &&
      typeof sessionCtx?.bookingId === 'string' &&
      sessionCtx.bookingId.trim()
    ) {
      rescueParams.bookingId = sessionCtx.bookingId.trim();
    }
    if (
      (rescueParams.manageToken == null || rescueParams.manageToken === '') &&
      typeof sessionCtx?.manageToken === 'string' &&
      sessionCtx.manageToken.trim()
    ) {
      rescueParams.manageToken = sessionCtx.manageToken.trim();
    }

    const rescued = this.intentRescue.rescue({
      prompt: input.effectivePrompt,
      action: base.action,
      params: rescueParams,
      reasoning: base.reasoning,
      employees: input.employees,
      customers: input.customers,
      locations: input.locations,
      timeZone: input.timeZone,
      surface: input.surface,
      assistantMode: resolveAssistantModeFromSession({
        prompt: input.effectivePrompt,
        surface: input.surface,
        sessionContext: input.sessionContext,
      }),
      semanticParamHints: hasSemanticHints ? semanticParamHints : undefined,
    });

    if (!rescued?.rescued) {
      appendPipelineTrace(
        trace,
        'rescue',
        base.action,
        hasSemanticHints
          ? `no rescue applied; semanticHints=${Object.keys(semanticParamHints).join(',')}`
          : 'no rescue applied',
      );
      return working;
    }

    const candidate = rescueResultToCandidate(
      rescued,
      Math.max(base.confidence ?? 0, 0.85),
    );

    // AI-ROADMAP Phase 3 — the steal guard. Rescue may enrich params freely,
    // but it may not swap a real classification for a *different mutating*
    // command. See `ai-rescue-steal-guard.ts` for the production evidence.
    const stealDecision = evaluateRescueActionChange({
      classifiedAction: base.action,
      rescuedAction: rescued.action,
      rescueReason: rescued.rescueReason,
    });

    if (stealDecision.blocked) {
      // Keep everything rescue extracted; restore the action it tried to take.
      appendPipelineTrace(
        trace,
        'rescue',
        base.action,
        describeBlockedSteal({
          classifiedAction: base.action,
          rescuedAction: rescued.action,
          rescueReason: rescued.rescueReason,
          decision: stealDecision,
        }),
      );
      return {
        action: base.action,
        params: mergeSemanticParamHintsOnly(
          mergeCandidateParams(base.params ?? {}, {
            ...candidate,
            action: base.action,
          }),
          semanticParamHints,
        ),
        reasoning: base.reasoning,
        confidence: base.confidence ?? 0,
      };
    }

    candidates.push(candidate);

    appendPipelineTrace(
      trace,
      'rescue',
      rescued.action,
      hasSemanticHints
        ? `${rescued.rescueReason}; semanticHints=${Object.keys(semanticParamHints).join(',')}`
        : rescued.rescueReason,
    );

    return {
      action: rescued.action,
      params: mergeSemanticParamHintsOnly(
        mergeCandidateParams(base.params ?? {}, candidate),
        semanticParamHints,
      ),
      reasoning: rescued.reasoning ?? base.reasoning,
      confidence: candidate.confidence,
    };
  }

  private stageSelfVerify(
    effectivePrompt: string,
    surface: PipelineUnderstandInput['surface'],
    trace: PipelineUnderstandResult['trace'],
    working: ClassifiedIntent | null,
  ): ReturnType<typeof resolveSelfVerifyStageOutcome> {
    if (!working) {
      appendPipelineTrace(trace, 'self_verify', 'unknown', 'no working intent');
      return { intent: working, result: { passed: true } };
    }

    const outcome = resolveSelfVerifyStageOutcome(
      effectivePrompt,
      working,
      surface,
    );
    const { intent, result, clarify } = outcome;

    if (!intent) {
      appendPipelineTrace(
        trace,
        'self_verify',
        working.action,
        'no intent after self-verify',
      );
      return { intent: working, result: { passed: true } };
    }

    if (result.passed) {
      appendPipelineTrace(trace, 'self_verify', intent.action, 'passed');
      return outcome;
    }

    if (clarify) {
      appendPipelineTrace(
        trace,
        'self_verify',
        intent.action,
        `clarify:${result.ruleId}:${result.reason}; confidence=${intent.confidence?.toFixed(2) ?? 'n/a'}`,
      );
      return outcome;
    }

    appendPipelineTrace(
      trace,
      'self_verify',
      result.correctedAction ?? intent.action,
      result.correctedAction
        ? `${result.ruleId}:${result.reason}; corrected`
        : `${result.ruleId}:${result.reason}`,
    );
    return outcome;
  }

  private stageStructuralEnrich(
    input: PipelineUnderstandInput,
    trace: PipelineUnderstandResult['trace'],
    working: ClassifiedIntent | null,
  ): ClassifiedIntent | null {
    if (!working) {
      appendPipelineTrace(
        trace,
        'structural_enrich',
        'unknown',
        'no working intent',
      );
      return working;
    }

    const enriched = applyStructuralIntentEnrichment(working, {
      prompt: input.effectivePrompt,
      timeZone: input.timeZone,
      employees: input.employees,
      sessionContext: input.sessionContext,
    });
    const hints =
      readStructuralEnrichHints(enriched.params ?? {}) ??
      ({
        dateRange: false,
        periods: false,
        employees: false,
        availabilityFollowUp: false,
        workTimeDefault: false,
      } as const);
    appendPipelineTrace(
      trace,
      'structural_enrich',
      enriched.action,
      summarizeStructuralEnrichTrace(hints),
    );
    return enriched;
  }

  private blockedResult(
    input: PipelineUnderstandInput,
    trace: PipelineUnderstandResult['trace'],
    normalization: PipelineUnderstandResult['normalization'],
    context: PipelineContext,
    opts: {
      action: string;
      reason: string;
      gate?: PipelineUnderstandResult['gate'];
      complexityRoute?: PipelineUnderstandResult['complexityRoute'];
    },
  ): PipelineUnderstandResult {
    for (const stage of PIPELINE_UNDERSTAND_STAGE_ORDER) {
      if (!trace.some((entry) => entry.stage === stage)) {
        appendPipelineTrace(trace, stage, 'skipped', opts.reason);
      }
    }

    const gate =
      opts.gate ??
      evaluateConfidenceGate(opts.action, 0, {
        low: input.confidenceLow,
        high: input.confidenceHigh,
      });

    return {
      status: 'blocked',
      action: opts.action,
      params: {},
      reasoning: opts.reason,
      confidence: 0,
      candidates: [],
      trace,
      gate,
      context,
      normalization,
      surface: input.surface,
      complexityRoute: opts.complexityRoute,
      blockReason: opts.reason,
    };
  }
}
