export const HELP_TOPIC_IDS = [
  'schedule',
  'calendar',
  'employees',
  'operations-inventory',
] as const;

export type HelpTopicId = (typeof HELP_TOPIC_IDS)[number];

export const HELP_TOPIC_STEP_COUNTS: Record<HelpTopicId, number> = {
  schedule: 4,
  calendar: 4,
  employees: 4,
  'operations-inventory': 3,
};

export function isHelpTopicId(value: string): value is HelpTopicId {
  return (HELP_TOPIC_IDS as readonly string[]).includes(value);
}

import { buildDashboardGuideTopicUrl } from '@/lib/dashboard-guide-corpus.util';

export const HELP_TOPIC_CORPUS_TOPIC_IDS: Record<HelpTopicId, string> = {
  schedule: 'dashboard.core.schedule',
  calendar: 'dashboard.core.calendar',
  employees: 'dashboard.core.employees',
  'operations-inventory': 'dashboard.operations.inventory',
};

export function getHelpTopicCorpusTopicId(topicId: HelpTopicId): string {
  return HELP_TOPIC_CORPUS_TOPIC_IDS[topicId];
}

export function getHelpTopicGuidePath(topicId: HelpTopicId): string {
  return buildDashboardGuideTopicUrl(getHelpTopicCorpusTopicId(topicId));
}

export function helpTopicTranslationPrefix(topicId: HelpTopicId): string {
  return `helpCenter.topics.${topicId}`;
}

export function listHelpStepKeys(topicId: HelpTopicId): string[] {
  const count = HELP_TOPIC_STEP_COUNTS[topicId];
  return Array.from({ length: count }, (_, index) => `${helpTopicTranslationPrefix(topicId)}.step${index + 1}`);
}
