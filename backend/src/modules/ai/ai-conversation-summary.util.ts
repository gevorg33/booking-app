export interface ConversationHistoryMessage {
  role: 'user' | 'assistant';
  content: string;
}

export const SUMMARIZE_AFTER_TURNS = 8;
export const HISTORY_TAIL_WHEN_SHORT = 10;
export const HISTORY_TAIL_WHEN_NO_OPENAI = 6;
export const HISTORY_TAIL_AFTER_SUMMARY = 4;

export function shouldSummarizeConversation(length: number): boolean {
  return length > SUMMARIZE_AFTER_TURNS;
}

export function splitHistoryForSummary(
  history: ConversationHistoryMessage[],
): { older: ConversationHistoryMessage[]; recent: ConversationHistoryMessage[] } | null {
  if (!shouldSummarizeConversation(history.length)) return null;
  return {
    older: history.slice(0, -HISTORY_TAIL_AFTER_SUMMARY),
    recent: history.slice(-HISTORY_TAIL_AFTER_SUMMARY),
  };
}

export function truncateHistoryForClassifier(
  history: ConversationHistoryMessage[],
  openAiAvailable: boolean,
): ConversationHistoryMessage[] {
  if (history.length <= SUMMARIZE_AFTER_TURNS) {
    return history.slice(-HISTORY_TAIL_WHEN_SHORT);
  }
  if (!openAiAvailable) {
    return history.slice(-HISTORY_TAIL_WHEN_NO_OPENAI);
  }
  return history.slice(-HISTORY_TAIL_AFTER_SUMMARY);
}

export function formatConversationSummaryBlock(
  summary: string,
  keyEntities?: Record<string, string>,
): string {
  const entities =
    keyEntities && Object.keys(keyEntities).length > 0
      ? `\nKey entities: ${JSON.stringify(keyEntities)}`
      : '';
  return `Earlier conversation summary:\n${summary}${entities}`;
}

export function formatHistoryTranscript(messages: ConversationHistoryMessage[]): string {
  return messages.map((m) => `${m.role}: ${m.content}`).join('\n');
}
