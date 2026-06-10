import { describe, expect, it } from 'vitest';
import {
  normalizeProviderSelfBlockSettings,
  readProviderSelfBlockSettings,
} from './provider-self-block.util';

describe('provider-self-block.util (prov-exp-7.1)', () => {
  it('reads disabled by default', () => {
    expect(readProviderSelfBlockSettings({})).toEqual({ enabled: false });
  });

  it('reads enabled flag', () => {
    expect(
      readProviderSelfBlockSettings({ providerSelfBlock: { enabled: true } }),
    ).toEqual({ enabled: true });
  });

  it('normalizes enabled flag', () => {
    expect(normalizeProviderSelfBlockSettings({ enabled: true })).toEqual({
      enabled: true,
    });
    expect(normalizeProviderSelfBlockSettings({ enabled: false })).toEqual({
      enabled: false,
    });
  });
});
