import { describe, it, expect } from 'vitest';
import {
  HELP_TOPIC_IDS,
  getHelpTopicGuidePath,
  helpTopicTranslationPrefix,
  isHelpTopicId,
  listHelpStepKeys,
} from './help-center-topics';
import { resolveHelpTopicZendeskArticleId } from './guide-topic-help-articles';

describe('help-center-topics', () => {
  it('lists known help topics', () => {
    expect(HELP_TOPIC_IDS).toContain('schedule');
    expect(HELP_TOPIC_IDS).toContain('calendar');
  });

  it('validates help topic ids', () => {
    expect(isHelpTopicId('schedule')).toBe(true);
    expect(isHelpTopicId('unknown')).toBe(false);
  });

  it('returns guide paths with anchors', () => {
    expect(getHelpTopicGuidePath('employees')).toBe('/dashboard/guide#employees');
    expect(getHelpTopicGuidePath('operations-inventory')).toBe('/dashboard/guide#inventory');
  });

  it('builds translation prefixes and step keys', () => {
    expect(helpTopicTranslationPrefix('calendar')).toBe('helpCenter.topics.calendar');
    expect(listHelpStepKeys('schedule')).toHaveLength(4);
    expect(listHelpStepKeys('operations-inventory')[0]).toBe(
      'helpCenter.topics.operations-inventory.step1',
    );
  });

  it('maps contextual help topics to optional Zendesk article ids (ai-guide-1.7.1)', () => {
    expect(resolveHelpTopicZendeskArticleId('schedule')).toBe('360010001');
    expect(resolveHelpTopicZendeskArticleId('calendar')).toBe('360010002');
  });
});
