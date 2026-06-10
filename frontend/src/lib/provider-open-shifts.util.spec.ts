import { describe, expect, it } from 'vitest';
import {
  normalizeProviderOpenShiftsSettings,
  readProviderOpenShiftsSettings,
} from './provider-open-shifts.util';

describe('provider-open-shifts.util (frontend)', () => {
  it('defaults to disabled', () => {
    expect(readProviderOpenShiftsSettings({})).toEqual({ enabled: false });
  });

  it('reads enabled flag', () => {
    expect(
      readProviderOpenShiftsSettings({ providerOpenShifts: { enabled: true } }),
    ).toEqual({ enabled: true });
  });

  it('normalizes settings', () => {
    expect(normalizeProviderOpenShiftsSettings({ enabled: true })).toEqual({
      enabled: true,
    });
  });
});
