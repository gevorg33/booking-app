import type { ProviderAiTranslateFn } from './provider-ai-examples';

export type ProviderQuickChip = {
  id: string;
  label: string;
  prompt: string;
};

export type ProviderMobileRoute = 'today' | 'schedule' | 'profile' | 'gift-cards';

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
        chip(t, 'whosNext', 'whosNext'),
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
      return [chip(t, 'summarizeToday', 'summarizeToday')];
    default:
      return [];
  }
}

export function providerQuickChipI18nKeys(): string[] {
  const keys = new Set<string>();
  const labelKeys = ['markAllPaid', 'whosNext', 'gapsAfternoon', 'summarizeToday', 'checkTomorrow', 'blockLunch', 'utilizationWeek', 'myWeekStats'];
  const promptKeys = ['markAllPaid', 'whosNext', 'gapsAfternoon', 'summarizeToday', 'checkTomorrow', 'blockLunch', 'utilizationWeek', 'myWeekStats'];
  labelKeys.forEach((k) => keys.add(`provider.quickChip.${k}`));
  promptKeys.forEach((k) => keys.add(`provider.quickPrompt.${k}`));
  return [...keys];
}
