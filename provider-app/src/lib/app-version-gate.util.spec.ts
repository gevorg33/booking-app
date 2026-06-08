import { describe, expect, it } from 'vitest';
import {
  compareSemver,
  evaluateMobileAppGate,
  isVersionBelowMinimum,
  buildUpdateNudgeDismissKey,
  dismissUpdateNudge,
  shouldShowUpdateNudge,
} from './app-version-gate.util';

describe('app-version-gate.util', () => {
  it('compares semver tuples', () => {
    expect(compareSemver('1.2.0', '1.1.9')).toBe(1);
    expect(compareSemver('1.0.0', '1.0.1')).toBe(-1);
    expect(isVersionBelowMinimum('0.9.0', '1.0.0')).toBe(true);
  });

  it('evaluates kill switch and update required', () => {
    expect(
      evaluateMobileAppGate({
        currentVersion: '1.0.0',
        config: {
          minSupportedVersion: '1.0.0',
          latestVersion: '1.0.0',
          updateRequired: false,
          killSwitch: true,
          message: 'Maintenance',
          storeUrl: null,
        },
      }).reason,
    ).toBe('kill_switch');
  });

  it('shows soft nudge when a newer supported build exists', () => {
    const config = {
      minSupportedVersion: '1.0.0',
      latestVersion: '1.2.0',
      updateRequired: false,
      killSwitch: false,
      message: null,
      storeUrl: 'https://store',
    };
    const dismissKey = buildUpdateNudgeDismissKey('provider_app', '1.2.0');
    expect(
      shouldShowUpdateNudge({
        currentVersion: '1.1.0',
        config,
        dismissKey,
      }),
    ).toBe(true);
    dismissUpdateNudge(dismissKey);
    expect(
      shouldShowUpdateNudge({
        currentVersion: '1.1.0',
        config,
        dismissKey,
      }),
    ).toBe(false);
  });
});
