import { describe, expect, it } from 'vitest';
import en from '@shared-i18n/messages/en';
import { getMessages } from '../i18n/catalog';
import { PROV_EXP_PROVIDER_I18N_PARITY_KEYS } from './provider-i18n-parity.fixtures';
import {
  isLocalizedProviderKey,
  listProviderKeysMissingLocaleParity,
} from './provider-i18n-parity.util';

describe('provider-i18n-parity.util (prov-exp-10.4)', () => {
  it('detects EN fallback vs localized provider keys', () => {
    const hy = getMessages('hy');
    expect(isLocalizedProviderKey(en, 'provider.timeOffTitle')).toBe(false);
    expect(isLocalizedProviderKey(hy, 'provider.timeOffTitle')).toBe(true);
  });

  it('returns no missing parity keys for hy and ru', () => {
    for (const locale of ['hy', 'ru'] as const) {
      const missing = listProviderKeysMissingLocaleParity(getMessages(locale));
      expect(missing, locale).toEqual([]);
    }
  });

  it('covers the full prov-exp parity fixture', () => {
    expect(PROV_EXP_PROVIDER_I18N_PARITY_KEYS).toContain('provider.calendarUtilizationHigh');
    expect(PROV_EXP_PROVIDER_I18N_PARITY_KEYS).toContain('provider.pushNotificationsTitle');
  });
});
