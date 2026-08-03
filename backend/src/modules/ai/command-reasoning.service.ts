import { Injectable, Logger } from '@nestjs/common';
import { OpenAiGatewayService } from '../integrations/openai/openai-gateway.service.js';
import type { CommandResult } from './command-completion.types.js';
import { isAiDateGroundedBookingAction } from './ai-date-label.util.js';

@Injectable()
export class CommandReasoningService {
  private readonly logger = new Logger(CommandReasoningService.name);

  constructor(private readonly openAi: OpenAiGatewayService) {}

  async enrichResult(
    businessId: string,
    prompt: string,
    result: CommandResult,
    meta?: { graphPath?: string; subIntents?: string[] },
  ): Promise<CommandResult> {
    if (
      !result.success ||
      result.action === 'error' ||
      result.details?.needsClarification
    ) {
      return result;
    }

    // e2e-bug.162 / e2e-bug.155 — keep grounded quota and CRM aggregate counts;
    // LLM rewrite previously invented "no cancellations" / wrong limits.
    if (
      result.action === 'explain_ai_capabilities' ||
      result.action === 'open_billing_settings' ||
      result.action === 'explain_plan_limits' ||
      result.action === 'explain_plan_entitlements' ||
      result.action === 'summarize_customers' ||
      result.action === 'summarize_bookings'
    ) {
      return result;
    }

    // e2e-bug.285 — booking success summaries carry grounded startTimes; LLM
    // rewrite misread DD/MM (01/08/2026) as US "January 8".
    // e2e-bug.289 — tour calendar week HY/RU deterministic summaries must not
    // be rewritten back to English.
    // e2e-bug.311 — explain_clinic_services HY/RU empty summaries must stay
    // localized (enrich flaked English on some prompts).
    if (isAiDateGroundedBookingAction(result.action)) {
      return result;
    }

    if (!(await this.openAi.isAvailableForBusiness(businessId))) {
      return result;
    }

    try {
      const enriched = await this.openAi.completeJson<{
        summary: string;
        reasoning: string;
      }>(
        {
          businessId,
          surface: 'dashboard',
          operation: 'langgraph_command_reasoning',
          actorType: 'system',
        },
        `You improve AI command responses for salon/spa staff dashboards.
Return JSON: { "summary": "1-2 clear sentences for the user", "reasoning": "1 sentence internal rationale" }
Keep summaries factual — do not invent counts or actions not in the input.
Never invent usage limits, quotas, or "exceeded" claims from unrelated counts.
When provider availability is present, mention provider names and open times directly.
Never tell the user to open a separate "provider list" or UI panel — the app renders providers inline.
Dates in Current summary use day-first order (DD/MM/YYYY or "1 August 2026"). Never reinterpret slash dates as US MM/DD.`,
        `User command: ${prompt}
Action: ${result.action}
Current summary: ${result.summary}
Graph path: ${meta?.graphPath ?? 'standard'}
Sub-intents: ${meta?.subIntents?.join(', ') ?? 'none'}
Details keys: ${Object.keys(result.details ?? {}).join(', ')}
Provider availability: ${JSON.stringify(
          result.details?.availability ??
            result.details?.providers ??
            result.details?.availableProviders ??
            [],
        )}`,
        { temperature: 0.15, maxTokens: 350 },
      );

      if (!enriched?.summary?.trim()) return result;

      return {
        ...result,
        summary: enriched.summary.trim(),
        details: {
          ...result.details,
          langGraphReasoning: enriched.reasoning?.trim(),
          langGraphPath: meta?.graphPath,
        },
      };
    } catch (err: any) {
      this.logger.debug(`Reasoning enrichment skipped: ${err?.message ?? err}`);
      return result;
    }
  }
}
