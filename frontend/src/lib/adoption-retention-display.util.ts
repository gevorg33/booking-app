export interface AdoptionRetentionView {
  cohortSize: number;
  d1ReturnRate: number;
  d7ReturnRate: number;
  d30ReturnRate: number;
  rebookWithin30DaysRate: number;
  rebookWithin60DaysRate: number;
  rebookWithin90DaysRate: number;
  resurrectionRate: number;
}

export interface AdoptionRetentionMetricGroup {
  id: 'return' | 'rebook' | 'winback';
  metrics: Array<{ key: keyof AdoptionRetentionView; labelKey: string }>;
}

export const ADOPTION_RETENTION_METRIC_GROUPS: AdoptionRetentionMetricGroup[] = [
  {
    id: 'return',
    metrics: [
      { key: 'd1ReturnRate', labelKey: 'adoption.retentionD1' },
      { key: 'd7ReturnRate', labelKey: 'adoption.retentionD7' },
      { key: 'd30ReturnRate', labelKey: 'adoption.retentionD30' },
    ],
  },
  {
    id: 'rebook',
    metrics: [
      { key: 'rebookWithin30DaysRate', labelKey: 'adoption.rebook30' },
      { key: 'rebookWithin60DaysRate', labelKey: 'adoption.rebook60' },
      { key: 'rebookWithin90DaysRate', labelKey: 'adoption.rebook90' },
    ],
  },
  {
    id: 'winback',
    metrics: [{ key: 'resurrectionRate', labelKey: 'adoption.resurrection' }],
  },
];

export function readAdoptionRetentionMetric(
  retention: AdoptionRetentionView,
  key: keyof AdoptionRetentionView,
): number {
  const value = retention[key];
  return typeof value === 'number' ? value : 0;
}
