import { describe, expect, it } from 'vitest';
import { getMessages, translate } from '@/i18n';
import {
  assertGuideCorpusAnchorParity,
  buildDashboardGuideTopicUrl,
  buildGuideTopicAskPrompt,
  resolveGuideAnchorFromTopicId,
  resolveGuideTopicIdFromAnchor,
} from './dashboard-guide-corpus.util';

function tEn() {
  const messages = getMessages('en');
  return (key: string, vars?: Record<string, string | number>) =>
    translate(messages, key, vars);
}

describe('dashboard-guide-corpus.util', () => {
  it('ai-guide-1.3.4 — maps anchors and topicIds bidirectionally', () => {
    expect(resolveGuideTopicIdFromAnchor('schedule')).toBe('dashboard.core.schedule');
    expect(resolveGuideTopicIdFromAnchor('#ai-command-bar')).toBe('dashboard.ai.command-bar');
    expect(resolveGuideAnchorFromTopicId('dashboard.core.schedule')).toBe('schedule');
    expect(buildDashboardGuideTopicUrl('dashboard.ai.command-bar')).toBe(
      '/dashboard/guide#ai-command-bar',
    );
  });

  it('builds conversational ask prompts from corpus titles', () => {
    expect(buildGuideTopicAskPrompt('dashboard.core.schedule', tEn())).toBe(
      'Walk me through Schedule',
    );
  });

  it('keeps anchor parity across the corpus manifest', () => {
    expect(() => assertGuideCorpusAnchorParity()).not.toThrow();
  });
});
