import {
  formatConversationSummaryBlock,
  formatHistoryTranscript,
  shouldSummarizeConversation,
  splitHistoryForSummary,
  truncateHistoryForClassifier,
} from './ai-conversation-summary.util.js';

describe('ai-conversation-summary.util', () => {
  const history = Array.from({ length: 10 }, (_, index) => ({
    role: index % 2 === 0 ? ('user' as const) : ('assistant' as const),
    content: `turn-${index}`,
  }));

  it('detects when summarization is needed', () => {
    expect(shouldSummarizeConversation(8)).toBe(false);
    expect(shouldSummarizeConversation(9)).toBe(true);
  });

  it('splits older and recent history', () => {
    const split = splitHistoryForSummary(history);
    expect(split?.older).toHaveLength(6);
    expect(split?.recent).toHaveLength(4);
  });

  it('truncates history based on OpenAI availability', () => {
    expect(truncateHistoryForClassifier(history.slice(0, 5), true)).toHaveLength(5);
    expect(truncateHistoryForClassifier(history, false)).toHaveLength(6);
    expect(truncateHistoryForClassifier(history, true)).toHaveLength(4);
  });

  it('formats summary blocks and transcripts', () => {
    expect(formatConversationSummaryBlock('User asked to cancel', { employeeName: 'Maria' })).toContain(
      'Key entities',
    );
    expect(formatConversationSummaryBlock('No entities')).toBe(
      'Earlier conversation summary:\nNo entities',
    );
    expect(formatHistoryTranscript([{ role: 'user', content: 'hi' }])).toBe('user: hi');
  });

  it('returns null split for short history', () => {
    expect(splitHistoryForSummary(history.slice(0, 5))).toBeNull();
  });
});
