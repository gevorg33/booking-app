import { Injectable } from '@nestjs/common';
import { LlmService } from '../../engine/agent/llm.service.js';
import type { CommandSurface } from './ai-command-registry.types.js';
import type { CapabilityPlannerBounds } from './ai-capability-bounded-planner.util.js';
import { resolvePlannerAllowedIntents } from './ai-capability-bounded-planner.util.js';
import {
  decomposeGoalPrompt,
  isGoalExecutionPrompt,
} from './ai-goal-execution.util.js';
import type { DecomposedIntentStep } from './intent-decomposition.types.js';
import {
  decomposeCompoundPrompt,
  isCompoundPrompt,
} from './intent-decomposition.util.js';

export type DecomposedIntent = DecomposedIntentStep;

@Injectable()
export class IntentDecompositionService {
  constructor(private readonly llm: LlmService) {}

  isCompoundPrompt(prompt: string): boolean {
    return isCompoundPrompt(prompt);
  }

  /** parity-3.2 — holistic goal prompts (end-to-end setup), not and/then compounds. */
  isGoalExecutionPrompt(
    prompt: string,
    surface: CommandSurface = 'dashboard',
  ): boolean {
    return isGoalExecutionPrompt(prompt, surface);
  }

  /** Registry handler path — deterministic first, LLM fallback for dashboard. */
  async decomposePrompt(
    businessId: string,
    userId: string | undefined,
    prompt: string,
    timeZone = 'UTC',
    surface: CommandSurface = 'dashboard',
  ): Promise<DecomposedIntent[]> {
    return this.decompose(businessId, userId, prompt, timeZone, surface);
  }

  async decompose(
    businessId: string,
    userId: string | undefined,
    prompt: string,
    timeZone = 'UTC',
    surface: CommandSurface = 'dashboard',
  ): Promise<DecomposedIntent[]> {
    return decomposeCompoundPrompt(
      this.llm,
      businessId,
      userId,
      prompt,
      timeZone,
      surface,
    );
  }

  /** parity-3.2 — goal decomposition with optional capability bounds. */
  decomposeGoal(
    prompt: string,
    surface: CommandSurface = 'dashboard',
    bounds?: CapabilityPlannerBounds,
  ): Promise<DecomposedIntent[]> {
    const allowed = bounds
      ? resolvePlannerAllowedIntents(bounds)
      : undefined;
    const result = decomposeGoalPrompt(prompt, surface, allowed);
    return Promise.resolve(result?.steps ?? []);
  }

  async decomposeGoalWithCapabilities(
    prompt: string,
    bounds: CapabilityPlannerBounds,
  ): Promise<DecomposedIntent[]> {
    return this.decomposeGoal(prompt, bounds.surface, bounds);
  }

  /** parity-3.1 — compound decomposition bounded to role-effective allowed intents. */
  async decomposeWithCapabilities(
    businessId: string,
    userId: string | undefined,
    prompt: string,
    bounds: CapabilityPlannerBounds,
    timeZone = 'UTC',
  ): Promise<DecomposedIntent[]> {
    return decomposeCompoundPrompt(
      this.llm,
      businessId,
      userId,
      prompt,
      timeZone,
      bounds.surface,
      bounds,
    );
  }
}
