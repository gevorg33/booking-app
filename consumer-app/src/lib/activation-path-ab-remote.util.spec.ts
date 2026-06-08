import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  cacheActivationPathPromoted,
  readCachedActivationPathPromoted,
} from './activation-path-ab.util.js';
import {
  loadActivationPathPromotedFromRemote,
  resetActivationPathRemoteCacheForTests,
} from './activation-path-ab-remote.util.js';

vi.mock('../services/public-api.js', () => ({
  fetchMobileAppConfig: vi.fn(),
}));

import { fetchMobileAppConfig } from '../services/public-api.js';

describe('activation-path-ab-remote.util (n99-3.8)', () => {
  beforeEach(() => {
    localStorage.clear();
    resetActivationPathRemoteCacheForTests();
    vi.mocked(fetchMobileAppConfig).mockReset();
  });

  it('loads promoted variants from mobile config and caches them', async () => {
    vi.mocked(fetchMobileAppConfig).mockResolvedValue({
      minSupportedVersion: '1.0.0',
      latestVersion: '1.0.0',
      updateRequired: false,
      killSwitch: false,
      message: null,
      storeUrl: null,
      activationPathAb: {
        signInPlacement: 'pre_confirm',
        slotPreselection: 'nearest_auto',
        paymentTiming: 'online_first',
      },
    });

    const promoted = await loadActivationPathPromotedFromRemote();
    expect(promoted).toEqual({
      signInPlacement: 'pre_confirm',
      slotPreselection: 'nearest_auto',
      paymentTiming: 'online_first',
    });
    expect(readCachedActivationPathPromoted()).toEqual(promoted);
    expect(fetchMobileAppConfig).toHaveBeenCalledTimes(1);

    await loadActivationPathPromotedFromRemote();
    expect(fetchMobileAppConfig).toHaveBeenCalledTimes(1);
  });

  it('returns cached promoted variants without refetching', async () => {
    cacheActivationPathPromoted({ signInPlacement: 'pre_confirm' });
    const promoted = await loadActivationPathPromotedFromRemote();
    expect(promoted).toEqual({ signInPlacement: 'pre_confirm' });
    expect(fetchMobileAppConfig).not.toHaveBeenCalled();
  });
});
