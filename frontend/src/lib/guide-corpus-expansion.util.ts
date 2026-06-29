export type GuideUnansweredReason =
  | 'low_completion'
  | 'grounding_failure'
  | 'missing_topic';

export interface GuideUnansweredTopicRow {
  topicId: string;
  opened: number;
  guideCompletions: number;
  groundingFailures: number;
  stepsCompleted: number;
  handoffs: number;
  completionRate: number;
  unansweredRate: number;
  priorityScore: number;
  reasons: readonly GuideUnansweredReason[];
  anchor?: string;
  titleKey?: string;
  inCorpus: boolean;
}

export interface GuideTelemetryAnalyticsResponse {
  periodDays: number;
  topicsOpened: number;
  stepsCompleted: number;
  handoffsToAction: number;
  groundingFailures: number;
  guideCompletionRate: number;
  avgStepsCompletedPerGuide: number;
  handoffToActionRate: number;
  groundingFailureRate: number;
  topUnansweredTopics: GuideUnansweredTopicRow[];
}

export function resolveGuideTopicLabel(
  row: Pick<GuideUnansweredTopicRow, 'topicId' | 'titleKey'>,
  t: (key: string) => string,
): string {
  if (row.titleKey) {
    const translated = t(row.titleKey);
    if (translated && !translated.startsWith('guide.') && !translated.startsWith('helpCenter.')) {
      return translated;
    }
  }
  return row.topicId;
}

export function formatGuideCompletionRate(rate: number): string {
  return `${Math.round(rate * 100)}%`;
}
