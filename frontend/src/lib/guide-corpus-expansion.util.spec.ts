import { describe, expect, it } from 'vitest';
import {
  formatGuideCompletionRate,
  resolveGuideTopicLabel,
  type GuideUnansweredTopicRow,
} from './guide-corpus-expansion.util';

const sampleRow: GuideUnansweredTopicRow = {
  topicId: 'dashboard.core.schedule',
  opened: 8,
  guideCompletions: 2,
  groundingFailures: 0,
  stepsCompleted: 5,
  handoffs: 1,
  completionRate: 0.25,
  unansweredRate: 0.75,
  priorityScore: 6,
  reasons: ['low_completion'],
  titleKey: 'guide.core.schedule.title',
  inCorpus: true,
};

describe('guide-corpus-expansion.util (ai-guide-1.7.4)', () => {
  it('resolveGuideTopicLabel prefers translated title key', () => {
    expect(
      resolveGuideTopicLabel(sampleRow, (key) =>
        key === 'guide.core.schedule.title' ? 'Weekly schedule' : key,
      ),
    ).toBe('Weekly schedule');
  });

  it('resolveGuideTopicLabel falls back to topicId', () => {
    expect(
      resolveGuideTopicLabel(
        {
          topicId: 'unknown',
          titleKey: undefined,
          opened: 0,
          guideCompletions: 0,
          groundingFailures: 0,
          stepsCompleted: 0,
          handoffs: 0,
          completionRate: 0,
          unansweredRate: 1,
          priorityScore: 1,
          reasons: ['missing_topic'],
          inCorpus: false,
        },
        (key) => key,
      ),
    ).toBe('unknown');
  });

  it('formatGuideCompletionRate renders percent', () => {
    expect(formatGuideCompletionRate(0.256)).toBe('26%');
  });
});
