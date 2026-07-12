import { describe, expect, it } from 'vitest';
import { translate } from '@shared-i18n/translate';
import { getMessages } from '../i18n/catalog';
import { getProviderQuickChips, providerQuickChipI18nKeys } from './provider-ai-quick-chips';

describe('provider-ai-quick-chips', () => {
  const en = getMessages('en');
  const t = (key: string) => translate(en, key);

  it('returns today tab chips including mark all paid and who is next', () => {
    const chips = getProviderQuickChips('today', t);
    expect(chips.map((c) => c.label)).toContain(translate(en, 'provider.quickChip.markAllPaid'));
    expect(chips.find((c) => c.prompt.includes('next'))).toBeTruthy();
  });

  it('uses team whos next chip for managers on today tab', () => {
    const manager = getProviderQuickChips('today', t, { isManager: true });
    const staff = getProviderQuickChips('today', t, { isManager: false });
    expect(manager.some((c) => c.id === 'teamWhosNext')).toBe(true);
    expect(manager.some((c) => c.id === 'whosNext')).toBe(false);
    expect(staff.some((c) => c.id === 'whosNext')).toBe(true);
    expect(staff.some((c) => c.id === 'teamWhosNext')).toBe(false);
  });

  it('adds utilization chip for managers on schedule tab', () => {
    const staff = getProviderQuickChips('schedule', t, { isManager: false });
    const manager = getProviderQuickChips('schedule', t, { isManager: true });
    expect(staff.some((c) => c.id === 'utilizationWeek')).toBe(false);
    expect(manager.some((c) => c.id === 'utilizationWeek')).toBe(true);
  });

  it('returns profile chips for staff vs manager', () => {
    const staff = getProviderQuickChips('profile', t, { isManager: false });
    const manager = getProviderQuickChips('profile', t, { isManager: true });
    expect(staff.some((c) => c.id === 'myWeekStats')).toBe(true);
    expect(manager.some((c) => c.id === 'utilizationWeek')).toBe(true);
  });

  it('returns gift-cards and default routes', () => {
    const gift = getProviderQuickChips('gift-cards', t);
    expect(gift).toHaveLength(3);
    expect(gift.some((c) => c.id === 'giftCardsToCreate')).toBe(true);
    expect(gift.some((c) => c.id === 'giftCardMarkReady')).toBe(true);
    expect(getProviderQuickChips('unknown' as 'today', t)).toEqual([]);
  });

  it('returns calendar chips with manager vs stylist gap wording (ai-cmd-provider-5.15.4)', () => {
    const staff = getProviderQuickChips('calendar', t, { isManager: false });
    const manager = getProviderQuickChips('calendar', t, { isManager: true });
    expect(staff.some((c) => c.id === 'gapsWeek')).toBe(true);
    expect(staff.some((c) => c.id === 'gapsWeekTeam')).toBe(false);
    expect(manager.some((c) => c.id === 'gapsWeekTeam')).toBe(true);
    expect(manager.some((c) => c.id === 'gapsWeek')).toBe(false);
    expect(staff.some((c) => c.id === 'fillGap')).toBe(true);
    expect(manager.some((c) => c.id === 'utilizationWeek')).toBe(true);
    expect(staff.some((c) => c.id === 'howFullAmI')).toBe(true);
  });

  it('returns lab-collection chips (ai-cmd-provider-5.15.4)', () => {
    const chips = getProviderQuickChips('lab-collection', t);
    expect(chips.map((c) => c.id)).toEqual([
      'collectionQueueToday',
      'markSpecimenCollected',
    ]);
  });

  it('returns lab-results chips (ai-cmd-provider-5.15.4)', () => {
    const chips = getProviderQuickChips('lab-results', t);
    expect(chips.map((c) => c.id)).toEqual([
      'resultsWaitingReview',
      'abnormalResultBooking',
    ]);
  });

  it('returns clinic-tasks chips (ai-cmd-provider-5.15.4)', () => {
    const chips = getProviderQuickChips('clinic-tasks', t);
    expect(chips.map((c) => c.id)).toEqual([
      'tasksDueToday',
      'markIntakeFollowUpDone',
    ]);
  });

  it('returns patients chips (ai-cmd-provider-5.15.4)', () => {
    const chips = getProviderQuickChips('patients', t);
    expect(chips.map((c) => c.id)).toEqual(['findPatient', 'openChartForDob']);
  });

  it('registers quick chip i18n keys in en', () => {
    for (const key of providerQuickChipI18nKeys()) {
      expect(translate(en, key)).not.toBe(key);
    }
  });
});
