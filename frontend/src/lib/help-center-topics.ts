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

export function getHelpTopicGuidePath(topicId: HelpTopicId): string {
  const anchors: Record<HelpTopicId, string> = {
    schedule: '/dashboard/guide#schedule',
    calendar: '/dashboard/guide#calendar',
    employees: '/dashboard/guide#employees',
    'operations-inventory': '/dashboard/guide#inventory',
  };
  return anchors[topicId];
}

export function helpTopicTranslationPrefix(topicId: HelpTopicId): string {
  return `helpCenter.topics.${topicId}`;
}

export function listHelpStepKeys(topicId: HelpTopicId): string[] {
  const count = HELP_TOPIC_STEP_COUNTS[topicId];
  return Array.from({ length: count }, (_, index) => `${helpTopicTranslationPrefix(topicId)}.step${index + 1}`);
}
