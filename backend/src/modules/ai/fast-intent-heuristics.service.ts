/**
 * pipe-1.2.3 — routing + structural hints only; see docs/FAST_INTENT_HEURISTICS_BOUNDARY.md (acc-3.14).
 */
import { Injectable } from '@nestjs/common';
import { CommandComplexityRouterService } from './command-complexity-router.service.js';
import { IntentDecompositionService } from './intent-decomposition.service.js';
import type { IntentCandidate } from './command-understanding.types.js';
import {
  scoreFastIntentHeuristics,
  type FastHeuristicsInput,
} from './fast-intent-heuristics.util.js';

@Injectable()
export class FastIntentHeuristicsService {
  constructor(
    private readonly complexityRouter: CommandComplexityRouterService,
    private readonly decomposition: IntentDecompositionService,
  ) {}

  /** Deterministic fast routing hints as scored IntentCandidate[] (pipe-1.2.1). */
  score(input: FastHeuristicsInput): IntentCandidate[] {
    const prompt = input.prompt.trim();
    if (!prompt) return [];

    const route = this.complexityRouter.routeDeterministic(
      prompt,
      input.employees ?? [],
    );
    const isCompound = this.decomposition.isCompoundPrompt(prompt);
    return scoreFastIntentHeuristics(input, route, isCompound);
  }
}
