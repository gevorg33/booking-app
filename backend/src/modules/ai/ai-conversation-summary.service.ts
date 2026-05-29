import { Injectable, Logger } from '@nestjs/common';
import { OpenAiGatewayService } from '../integrations/openai/openai-gateway.service.js';

export interface HistoryMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface SummaryResult {
  summary: string;
  keyEntities?: Record<string, string>;
}

const SUMMARIZE_AFTER_TURNS = 8;

@Injectable()
export class AiConversationSummaryService {
  private readonly logger = new Logger(AiConversationSummaryService.name);

  constructor(private openAi: OpenAiGatewayService) {}

  /**
   * Compress long threads for classifier context (dashboard ↔ mobile handoff).
   * Returns recent tail + LLM summary of older turns.
   */
  async prepareHistoryForClassifier(
    businessId: string,
    history: HistoryMessage[] | undefined,
    surface: 'dashboard' | 'provider_mobile',
  ): Promise<{ history: HistoryMessage[]; summaryBlock?: string }> {
    if (!history?.length) return { history: [] };

    if (history.length <= SUMMARIZE_AFTER_TURNS) {
      return { history: history.slice(-10) };
    }

    if (!(await this.openAi.isAvailableForBusiness(businessId))) {
      return { history: history.slice(-6) };
    }

    const older = history.slice(0, -4);
    const recent = history.slice(-4);

    const system = `Summarize an AI assistant conversation for intent classification handoff.
Return JSON: { "summary": "2-4 sentences", "keyEntities": { "employeeName": "...", "serviceName": "...", "date": "...", "timeSlot": "..." } }
Preserve unresolved clarifications and last requested action.`;

    const transcript = older
      .map((m) => `${m.role}: ${m.content}`)
      .join('\n');

    const result = await this.openAi.completeJson<SummaryResult>(
      {
        businessId,
        surface,
        operation: 'conversation_summary',
        actorType: 'system',
      },
      system,
      transcript,
      { maxTokens: 500 },
    );

    if (!result?.summary) {
      return { history: recent };
    }

    const entities =
      result.keyEntities && Object.keys(result.keyEntities).length > 0
        ? `\nKey entities: ${JSON.stringify(result.keyEntities)}`
        : '';

    return {
      history: recent,
      summaryBlock: `Earlier conversation summary:\n${result.summary}${entities}`,
    };
  }
}
