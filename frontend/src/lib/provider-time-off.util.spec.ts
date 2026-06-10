import { describe, expect, it } from 'vitest';
import {
  normalizeProviderTimeOffSettings,
  readProviderTimeOffSettings,
} from './provider-time-off.util';

describe('provider-time-off.util (prov-exp-7.2)', () => {
  it('reads disabled by default', () => {
    expect(readProviderTimeOffSettings({})).toEqual({ enabled: false });
  });

  it('reads enabled flag', () => {
    expect(
      readProviderTimeOffSettings({ providerTimeOff: { enabled: true } }),
    ).toEqual({ enabled: true });
  });

  it('normalizes enabled flag', () => {
    expect(normalizeProviderTimeOffSettings({ enabled: true })).toEqual({
      enabled: true,
    });
  });
});
