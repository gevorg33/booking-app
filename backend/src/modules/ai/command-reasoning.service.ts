import { Injectable, Logger } from '@nestjs/common';
import { OpenAiGatewayService } from '../integrations/openai/openai-gateway.service.js';
import type { CommandResult } from './command-completion.types.js';

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
    if (!result.success || result.action === 'error' || result.details?.needsClarification) {
      return result;
    }

    if (!(await this.openAi.isAvailableForBusiness(businessId))) {
      return result;
    }

    try {
      const enriched = await this.openAi.completeJson<{ summary: string; reasoning: string }>(
        {
          businessId,
          surface: 'dashboard',
          operation: 'langgraph_command_reasoning',
          actorType: 'system',
        },
        `You improve AI command responses for salon/spa staff dashboards.
Return JSON: { "summary": "1-2 clear sentences for the user", "reasoning": "1 sentence internal rationale" }
Keep summaries factual — do not invent counts or actions not in the input.`,
        `User command: ${prompt}
Action: ${result.action}
Current summary: ${result.summary}
Graph path: ${meta?.graphPath ?? 'standard'}
Sub-intents: ${meta?.subIntents?.join(', ') ?? 'none'}
Details keys: ${Object.keys(result.details ?? {}).join(', ')}`,
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
