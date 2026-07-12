import type { ProviderAiTranslateFn } from './provider-ai-examples';

export type ProviderQuickChip = {
  id: string;
  label: string;
  prompt: string;
};

export type ProviderMobileRoute =
  | 'today'
  | 'schedule'
  | 'profile'
  | 'gift-cards'
  | 'calendar'
  | 'lab-collection'
  | 'lab-results'
  | 'clinic-tasks'
  | 'patients';

function chip(t: ProviderAiTranslateFn, labelKey: string, promptKey: string): ProviderQuickChip {
  return {
    id: promptKey,
    label: t(`provider.quickChip.${labelKey}`),
    prompt: t(`provider.quickPrompt.${promptKey}`),
  };
}

/** Contextual one-tap prompts per tab (ai-m6). */
export function getProviderQuickChips(
  route: ProviderMobileRoute,
  t: ProviderAiTranslateFn,
  options?: { isManager?: boolean },
): ProviderQuickChip[] {
  const isManager = options?.isManager === true;

  switch (route) {
    case 'today':
      return [
        chip(t, 'markAllPaid', 'markAllPaid'),
        ...(isManager
          ? [chip(t, 'teamWhosNext', 'teamWhosNext')]
          : [chip(t, 'whosNext', 'whosNext')]),
        chip(t, 'gapsAfternoon', 'gapsAfternoon'),
        chip(t, 'summarizeToday', 'summarizeToday'),
      ];
    case 'schedule':
      return [
        chip(t, 'gapsAfternoon', 'gapsAfternoon'),
        chip(t, 'checkTomorrow', 'checkTomorrow'),
        chip(t, 'blockLunch', 'blockLunch'),
        ...(isManager ? [chip(t, 'utilizationWeek', 'utilizationWeek')] : []),
      ];
    case 'profile':
      return [
        chip(t, 'summarizeToday', 'summarizeToday'),
        ...(isManager ? [chip(t, 'utilizationWeek', 'utilizationWeek')] : [chip(t, 'myWeekStats', 'myWeekStats')]),
      ];
    case 'gift-cards':
      return [
        chip(t, 'summarizeToday', 'summarizeToday'),
        chip(t, 'giftCardsToCreate', 'giftCardsToCreate'),
        chip(t, 'giftCardMarkReady', 'giftCardMarkReady'),
      ];
    case 'calendar':
      return [
        ...(isManager
          ? [chip(t, 'gapsWeekTeam', 'gapsWeekTeam')]
          : [chip(t, 'gapsWeek', 'gapsWeek')]),
        chip(t, 'fillGap', 'fillGap'),
        ...(isManager ? [chip(t, 'utilizationWeek', 'utilizationWeek')] : [chip(t, 'howFullAmI', 'howFullAmI')]),
      ];
    case 'lab-collection':
      return [
        chip(t, 'collectionQueueToday', 'collectionQueueToday'),
        chip(t, 'markSpecimenCollected', 'markSpecimenCollected'),
      ];
    case 'lab-results':
      return [
        chip(t, 'resultsWaitingReview', 'resultsWaitingReview'),
        chip(t, 'abnormalResultBooking', 'abnormalResultBooking'),
      ];
    case 'clinic-tasks':
      return [
        chip(t, 'tasksDueToday', 'tasksDueToday'),
        chip(t, 'markIntakeFollowUpDone', 'markIntakeFollowUpDone'),
      ];
    case 'patients':
      return [
        chip(t, 'findPatient', 'findPatient'),
        chip(t, 'openChartForDob', 'openChartForDob'),
      ];
    default:
      return [];
  }
}

export function providerQuickChipI18nKeys(): string[] {
  const keys = new Set<string>();
  const chipKeys = [
    'markAllPaid',
    'whosNext',
    'teamWhosNext',
    'gapsAfternoon',
    'summarizeToday',
    'checkTomorrow',
    'blockLunch',
    'utilizationWeek',
    'myWeekStats',
    'giftCardsToCreate',
    'giftCardMarkReady',
    'gapsWeek',
    'gapsWeekTeam',
    'fillGap',
    'howFullAmI',
    'collectionQueueToday',
    'markSpecimenCollected',
    'resultsWaitingReview',
    'abnormalResultBooking',
    'tasksDueToday',
    'markIntakeFollowUpDone',
    'findPatient',
    'openChartForDob',
  ];
  chipKeys.forEach((k) => keys.add(`provider.quickChip.${k}`));
  chipKeys.forEach((k) => keys.add(`provider.quickPrompt.${k}`));
  return [...keys];
}
