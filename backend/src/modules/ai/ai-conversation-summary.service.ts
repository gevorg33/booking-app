import { Injectable, Logger } from '@nestjs/common';
import { OpenAiGatewayService } from '../integrations/openai/openai-gateway.service.js';
import {
  formatConversationSummaryBlock,
  formatHistoryTranscript,
  splitHistoryForSummary,
  truncateHistoryForClassifier,
  type ConversationHistoryMessage,
} from './ai-conversation-summary.util.js';

export type HistoryMessage = ConversationHistoryMessage;

interface SummaryResult {
  summary: string;
  keyEntities?: Record<string, string>;
}

@Injectable()
export class AiConversationSummaryService {
  private readonly logger = new Logger(AiConversationSummaryService.name);

  private readonly openAi: OpenAiGatewayService;

  constructor(openAi: OpenAiGatewayService) {
    this.openAi = openAi;
  }

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

    const openAiAvailable = await this.openAi.isAvailableForBusiness(businessId);
    const split = splitHistoryForSummary(history);

    if (!split) {
      return { history: truncateHistoryForClassifier(history, openAiAvailable) };
    }

    if (!openAiAvailable) {
      return { history: truncateHistoryForClassifier(history, false) };
    }

    const system = `Summarize an AI assistant conversation for intent classification handoff.
Return JSON: { "summary": "2-4 sentences", "keyEntities": { "employeeName": "...", "serviceName": "...", "date": "...", "timeSlot": "..." } }
Preserve unresolved clarifications and last requested action.`;

    const transcript = formatHistoryTranscript(split.older);

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
      return { history: split.recent };
    }

    return {
      history: split.recent,
      summaryBlock: formatConversationSummaryBlock(result.summary, result.keyEntities),
    };
  }
}
