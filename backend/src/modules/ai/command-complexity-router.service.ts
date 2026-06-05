import { Injectable } from '@nestjs/common';
import { IntentDecompositionService } from './intent-decomposition.service.js';
import {
  isClearSchedulePrompt,
  isScheduleTemplateCreationPrompt,
} from './ai-orchestration.helpers.js';
import {
  extractProviderFallbackFromPrompt,
  isFirstAvailableBookingPrompt,
  isTeamWideProviderAvailabilityQuery,
} from './ai-intent-heuristics.js';

export interface ComplexityRoute {
  tier: 'read_only' | 'simple_mutate' | 'orchestration' | 'compound';
  useDecomposition?: boolean;
  reasoning?: string;
}

const READ_ONLY_PATTERN =
  /\b(list|show|summarize|summary|how many|who (?:can|is|has)|check availability|available slots?|lookup|analyze|report|what(?:'s| is)|which customer|top \d+|busiest|utilization|gaps?)\b/i;

const SIMPLE_MUTATE_PATTERN =
  /\b(book|schedule|create booking|cancel|reschedule|block|hide|unhide|add service|create service|fill slot|notify)\b/i;

const ORCHESTRATION_PATTERN =
  /\b(optimize|conflict|recover|reassign|rebook|waitlist|underutilized|setup week|week schedule|day replan|replan|payment sweep|mark no.?show)\b/i;

const COMPOUND_EXTRA =
  /\.\s+(?:clear|cancel|hide|apply|block|fill|book|reschedule|unhide|notify)\b/i;

const AMBIGUOUS_PATTERN =
  /\b(fix|figure out|what'?s wrong|help me with|diagnose|investigate|what should i do|something wrong|sort out|deal with)\b/i;

const FALLBACK_BOOKING_PATTERN =
  /\b(if .+ (not available|unavailable|busy|can'?t)|otherwise|else (book|try)|then (try|book)|who(?:ever)? is free|whoever(?:'s| is) available)\b/i;

@Injectable()
export class CommandComplexityRouterService {
  constructor(private readonly decomposition: IntentDecompositionService) {}

  /** Deterministic complexity routing — no LLM, always available. */
  routeDeterministic(
    prompt: string,
    employees: Array<{ id: string; name: string }> = [],
  ): ComplexityRoute {
    const trimmed = prompt.trim();
    if (!trimmed) {
      return {
        tier: 'simple_mutate',
        useDecomposition: false,
        reasoning: 'Empty prompt',
      };
    }

    const fallback = extractProviderFallbackFromPrompt(trimmed, employees);
    const isConditionalBooking =
      /\b(book|schedule|reserve)\b/i.test(trimmed) &&
      (FALLBACK_BOOKING_PATTERN.test(trimmed) ||
        fallback.providerFallbackNames.length > 0 ||
        fallback.fallbackAnyProvider);

    if (isConditionalBooking) {
      return {
        tier: 'orchestration',
        useDecomposition: false,
        reasoning: 'Conditional provider fallback booking',
      };
    }

    const compound =
      this.decomposition.isCompoundPrompt(trimmed) ||
      COMPOUND_EXTRA.test(trimmed);
    if (compound) {
      return {
        tier: 'compound',
        useDecomposition: true,
        reasoning: 'Compound markers detected',
      };
    }

    if (
      ORCHESTRATION_PATTERN.test(trimmed) ||
      AMBIGUOUS_PATTERN.test(trimmed) ||
      FALLBACK_BOOKING_PATTERN.test(trimmed) ||
      (isFirstAvailableBookingPrompt(trimmed) &&
        !/\b(reschedule|move|shift)\b/i.test(trimmed))
    ) {
      return {
        tier: 'orchestration',
        useDecomposition: false,
        reasoning: 'Multi-step or ambiguous orchestration prompt',
      };
    }

    if (
      READ_ONLY_PATTERN.test(trimmed) ||
      isTeamWideProviderAvailabilityQuery(trimmed) ||
      /\b(check|is .+ available|open slots?)\b/i.test(trimmed)
    ) {
      if (
        !SIMPLE_MUTATE_PATTERN.test(trimmed) ||
        isTeamWideProviderAvailabilityQuery(trimmed)
      ) {
        return {
          tier: 'read_only',
          useDecomposition: false,
          reasoning: 'Read-only query pattern',
        };
      }
    }

    if (
      isScheduleTemplateCreationPrompt(trimmed) ||
      isClearSchedulePrompt(trimmed)
    ) {
      return {
        tier: 'simple_mutate',
        useDecomposition: false,
        reasoning: 'Single schedule mutation',
      };
    }

    return {
      tier: 'simple_mutate',
      useDecomposition: false,
      reasoning: 'Default single-intent mutation',
    };
  }

  /** Merge LLM route with deterministic fallback — LLM wins when present. */
  mergeRoutes(
    llmRoute: ComplexityRoute | null | undefined,
    deterministic: ComplexityRoute,
  ): ComplexityRoute {
    if (!llmRoute?.tier) return deterministic;
    return {
      ...llmRoute,
      useDecomposition:
        llmRoute.useDecomposition ?? deterministic.useDecomposition,
      reasoning: llmRoute.reasoning ?? deterministic.reasoning,
    };
  }
}
