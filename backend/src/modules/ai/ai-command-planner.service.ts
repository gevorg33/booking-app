/**
 * AI-ROADMAP Phase 3 — the planner.
 *
 * Assembles the tested parts into one call:
 *
 *   specs + actor + context      → prompt      (ai-command-plan.prompt)
 *   LLM completion               → CommandPlan (ai-command-plan.decode)
 *   CommandPlan + surface + tier → verdict     (ai-command-plan.validate)
 *
 * The service itself holds no judgement about what may execute — that lives
 * entirely in `validatePlan`. This file only orchestrates and reports, which is
 * why it stays small and why the hard rules stay in pure, LLM-free code.
 */
import { Injectable, Logger } from '@nestjs/common';
import type OpenAI from 'openai';
import { OpenAiGatewayService } from '../integrations/openai/openai-gateway.service.js';
import type { AccessTier } from './access-control.matrix.js';
import type { CommandSurface } from './ai-command-registry.types.js';
import { commandSurfaceToAiUsageSurface } from './ai-usage-surface.util.js';
import { COMMAND_SPECS } from './ai-command-spec.registry.js';
import {
  EMBEDDING_DIMENSIONS,
  loadCommandIndex,
  narrowShortlist,
} from './ai-command-shortlist.util.js';
import type { CommandSpec } from './ai-command-spec.types.js';
import {
  applyAnaphoraToPlan,
  applyConversationRefsToPlan,
} from './ai-anaphora.util.js';
import {
  decodePlanResponse,
  type PlanDecodeFailure,
} from './ai-command-plan.decode.js';
import {
  buildPlannerMessages,
  type PlannerContext,
} from './ai-command-plan.prompt.js';
import {
  describePlanClarification,
  validatePlan,
} from './ai-command-plan.validate.js';
import type {
  CommandPlan,
  PlanValidationResult,
} from './ai-command-plan.types.js';

export type PlanRequest = {
  businessId: string;
  surface: CommandSurface;
  /**
   * The actor's access tier. Required, not defaulted: the shortlist the model
   * sees is filtered by it, so a default would silently decide who may run what.
   */
  tier: AccessTier;
  message: string;
  context: PlannerContext;
  userId?: string;
  /** Defaults to the ported specs; injectable so tests can narrow the catalogue. */
  specs?: readonly CommandSpec[];
};

export type PlanOutcome =
  | {
      status: 'executable';
      plan: CommandPlan;
      validation: PlanValidationResult;
      repairs: string[];
    }
  | {
      status: 'clarify';
      plan: CommandPlan;
      validation: PlanValidationResult;
      /** Question naming the exact gap — never a generic "I didn't understand". */
      question: string;
      repairs: string[];
    }
  | {
      status: 'unavailable';
      /** `no_response` when the gateway is not configured or returned nothing. */
      reason: PlanDecodeFailure | 'no_response';
    };

@Injectable()
export class AiCommandPlannerService {
  private readonly logger = new Logger(AiCommandPlannerService.name);

  constructor(private readonly openAi: OpenAiGatewayService) {}

  /**
   * Rank the permitted commands against this message and keep the top N.
   *
   * Embedding failure, a missing cache, or an already-small list all fall
   * through to the full list — see `narrowShortlist`, which reports which.
   */
  private async narrowForMessage(
    request: PlanRequest,
    specs: readonly CommandSpec[],
  ): Promise<readonly CommandSpec[]> {
    // ON by default since 2026-08-08 (§117), because narrowing is no longer
    // unconditional: `narrowShortlist` refuses to cut when the top retrieval
    // score is below `NARROW_MIN_TOP_SCORE`, and falls back to the full
    // permitted list — which is exactly the un-narrowed behaviour.
    //
    // e2e-bug.382 shipped this off on figures taken before `e2e-bug.384` and
    // `e2e-bug.388` were known. §115 and §116 then found narrowing helping one
    // population and hurting another, so no fixed setting was right
    // (e2e-bug.402). Measured on 60 prompts from each, all three strategies:
    //
    // | population | gated | always | never |
    // |------------|-------|--------|-------|
    // | general    | 48%   | 38%    | 47%   |
    // | rescued    | 28%   | 28%    | 20%   |
    //
    // The gate narrows 2/60 on general traffic and 41/60 on rescued traffic —
    // it picks the strategy each prompt needs, and matches or beats both fixed
    // arms on both populations. `AI_PLANNER_NARROW_SHORTLIST=0` still forces it
    // off.
    if (process.env.AI_PLANNER_NARROW_SHORTLIST === '0') return specs;

    let queryEmbedding: number[] | null = null;
    try {
      queryEmbedding = await this.openAi.embedText(
        {
          businessId: request.businessId,
          surface: commandSurfaceToAiUsageSurface(request.surface),
          operation: 'plan_shortlist',
          actorType: 'manager',
          userId: request.userId,
        },
        request.message,
        { dimensions: EMBEDDING_DIMENSIONS },
      );
    } catch (err: unknown) {
      // An embedding outage must not take planning down with it.
      this.logger.warn(
        `Shortlist embedding failed, using full shortlist: ${
          err instanceof Error ? err.message : String(err)
        }`,
      );
    }

    const result = narrowShortlist(
      specs,
      request.surface,
      request.tier,
      queryEmbedding,
      loadCommandIndex(specs),
      // §97 — the message itself, for the lexical half of the ranking. Omitting
      // it is not an error; it just ranks on cosine alone as before.
      { message: request.message },
    );
    if (result.reason === 'narrowed') {
      this.logger.debug(
        `Shortlist narrowed ${result.candidateCount} -> ${result.specs.length}`,
      );
    }
    return result.specs;
  }

  async plan(request: PlanRequest): Promise<PlanOutcome> {
    const allSpecs = request.specs ?? COMMAND_SPECS;

    // §5 wants a 10–15 command shortlist and §71 measured the permission-filtered
    // list at 388 on dashboard/owner, so narrowing looked like the fix for
    // e2e-bug.381's empty plans. It was not: §85 found those empty plans were
    // mostly `decodePlanStep` discarding well-formed steps whose command id had
    // landed in the label field, and §115 measured the full list beating the
    // narrowed one outright. The shortlist size was never the cause.
    //
    // Narrowing therefore stays behind its flag (see `narrowForMessage`), and
    // this call is a no-op unless it is set. Failure inside it is not fatal
    // either: `narrowShortlist` returns the full list when it cannot rank.
    const specs = await this.narrowForMessage(request, allSpecs);

    const messages = buildPlannerMessages(
      specs,
      request.surface,
      request.tier,
      request.context,
      request.message,
    ) as OpenAI.Chat.Completions.ChatCompletionMessageParam[];

    const response = await this.openAi.chatCompletion(
      {
        businessId: request.businessId,
        surface: commandSurfaceToAiUsageSurface(request.surface),
        operation: 'plan_commands',
        actorType: 'manager',
        userId: request.userId,
      },
      {
        messages,
        responseFormat: 'json_object',
        // Planning is extraction, not creativity — keep it near-deterministic so
        // the same message does not yield different plans on retry (the
        // e2e-bug.152 non-determinism class).
        temperature: 0.1,
        maxTokens: 1200,
      },
    );

    const raw = response?.choices?.[0]?.message?.content ?? null;
    if (!raw) return { status: 'unavailable', reason: 'no_response' };

    const decoded = decodePlanResponse(raw);
    if (!decoded.ok) {
      this.logger.warn(
        `Planner response undecodable (${decoded.failure}) for business ${request.businessId}`,
      );
      return { status: 'unavailable', reason: decoded.failure };
    }

    if (decoded.repairs.length) {
      this.logger.debug(
        `Planner response repaired: ${decoded.repairs.join('; ')}`,
      );
    }

    // Validate against the FULL catalogue, not the narrowed shortlist.
    //
    // §117 — narrowing decides what the model is *shown*; validation decides
    // what may *run*. Passing the shortlist here conflated the two: a command
    // that is perfectly legal but simply did not make the top 15 came back as
    // `unknown_command` rather than the real reason, so a surface violation and
    // a retrieval miss became indistinguishable in the trace — and
    // `describePlanClarification` told the user "I don't have a command for
    // that" about a command the platform has.
    //
    // The safety argument is unchanged: `validatePlan` re-derives permission
    // from `allSpecs` via `isSpecAllowedForTier`, so widening the input here
    // cannot let an impermissible command through. It only restores the correct
    // rejection reason.
    let plan = decoded.plan;
    let validation = validatePlan(
      allSpecs,
      plan,
      request.surface,
      request.tier,
    );

    // B4 / e2e-bug.370 — bind same-message anaphora before giving up.
    //
    // §49 built `resolveAnaphora`/`bindAnaphorToReference` and nothing called
    // them. This is the call. It runs only when the plan is already failing,
    // and only against steps `validatePlan` reported as short a variable, so a
    // plan that validates first time is untouched — the pass can turn a clarify
    // into an execution, never the reverse.
    //
    // Why here rather than inside `validatePlan`: resolution needs the user's
    // message, which validation deliberately does not take (it validates a
    // plan against specs, not against prose). Threading the message into it
    // would widen a security-relevant function for an unrelated reason.
    if (!validation.executable) {
      const missingByStepId = new Map<string, readonly string[]>();
      for (const problem of validation.problems) {
        if (problem.code === 'missing_variables' && problem.stepId) {
          missingByStepId.set(problem.stepId, problem.details ?? []);
        }
      }

      if (missingByStepId.size) {
        const bound = applyAnaphoraToPlan(
          request.message,
          plan.steps,
          missingByStepId,
          allSpecs,
        );

        if (bound.ambiguous) {
          // The resolver found more than one candidate referent. That is a
          // question for the user, and a better one than the generic
          // missing-variable clarification it would otherwise get.
          return {
            status: 'clarify',
            plan,
            validation,
            question:
              bound.ambiguous.clarification ??
              describePlanClarification(validation, plan) ??
              'I need a bit more detail before I can do that.',
            repairs: decoded.repairs,
          };
        }

        if (bound.changed) {
          plan = { ...plan, steps: bound.steps };
          validation = validatePlan(
            allSpecs,
            plan,
            request.surface,
            request.tier,
          );
        }

        // e2e-bug.370 — the cross-turn half. Whatever the intra-plan resolver
        // could not bind (a single-step "book it" has no earlier step) is
        // tried against the conversation's entity store, which holds what
        // previous turns resolved. Runs second on purpose: a referent inside
        // this plan is more specific than one from a prior turn.
        if (!validation.executable) {
          const stillMissing = new Map<string, readonly string[]>();
          for (const problem of validation.problems) {
            if (problem.code === 'missing_variables' && problem.stepId) {
              stillMissing.set(problem.stepId, problem.details ?? []);
            }
          }
          if (stillMissing.size) {
            const fromStore = applyConversationRefsToPlan(
              request.message,
              plan.steps,
              stillMissing,
              request.context.entityStore,
              {
                now: new Date(),
                currentTurn:
                  request.context.turnIndex ??
                  (request.context.recentTurns?.length ?? 0) + 1,
              },
            );
            if (fromStore.ambiguous) {
              return {
                status: 'clarify',
                plan,
                validation,
                question: fromStore.ambiguous.clarification,
                repairs: decoded.repairs,
              };
            }
            if (fromStore.changed) {
              plan = { ...plan, steps: fromStore.steps };
              validation = validatePlan(
                allSpecs,
                plan,
                request.surface,
                request.tier,
              );
            }
          }
        }
      }
    }

    if (!validation.executable) {
      return {
        status: 'clarify',
        plan,
        validation,
        question:
          describePlanClarification(validation, plan) ??
          'I need a bit more detail before I can do that.',
        repairs: decoded.repairs,
      };
    }

    return {
      status: 'executable',
      plan,
      validation,
      repairs: decoded.repairs,
    };
  }
}
