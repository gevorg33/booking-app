export type ProviderAiTranslateFn = (
  key: string,
  vars?: Record<string, string | number>,
) => string;

export function buildProviderAiExamples(t: ProviderAiTranslateFn): string[] {
  return [
    t('provider.exampleSickCancel'),
    t('provider.exampleMarkJohn'),
    t('provider.exampleMarkAllPaid'),
    t('provider.exampleScheduleToday'),
    t('provider.exampleCountAppointmentsTomorrow'),
    t('provider.exampleRevenueLastWeek'),
    t('provider.exampleExplainPushSetup'),
    t('provider.exampleEnablePush'),
  ];
}
