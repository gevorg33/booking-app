import { describe, expect, it } from 'vitest';
import {
  DEFAULT_FAB_MARGIN_PX,
  PUBLIC_AI_FAB_ABOVE_SUPPORT_LAUNCHER_BOTTOM_PX,
  isFabAnchorInSupportLauncherConflictZone,
  nudgeFabAnchorClearOfSupportLauncher,
  publicAiFabDefaultBottomInset,
} from './public-floating-fab-layer.util';

describe('public-floating-fab-layer.util (e2e-bug.123)', () => {
  it('keeps default bottom inset when no support launcher', () => {
    expect(publicAiFabDefaultBottomInset(false)).toBe(DEFAULT_FAB_MARGIN_PX);
  });

  it('stacks AI FAB above support launcher footprint', () => {
    expect(publicAiFabDefaultBottomInset(true)).toBe(
      PUBLIC_AI_FAB_ABOVE_SUPPORT_LAUNCHER_BOTTOM_PX,
    );
    expect(publicAiFabDefaultBottomInset(true)).toBeGreaterThan(
      DEFAULT_FAB_MARGIN_PX + 60,
    );
  });

  it('detects default corner conflict zone', () => {
    expect(
      isFabAnchorInSupportLauncherConflictZone({ right: 24, bottom: 24 }),
    ).toBe(true);
    expect(
      isFabAnchorInSupportLauncherConflictZone({ right: 24, bottom: 200 }),
    ).toBe(false);
    expect(
      isFabAnchorInSupportLauncherConflictZone({ right: 120, bottom: 24 }),
    ).toBe(false);
  });

  it('nudges conflict-zone anchors when support launcher is present', () => {
    expect(
      nudgeFabAnchorClearOfSupportLauncher({ right: 24, bottom: 24 }, true),
    ).toEqual({
      right: 24,
      bottom: PUBLIC_AI_FAB_ABOVE_SUPPORT_LAUNCHER_BOTTOM_PX,
    });
  });

  it('does not nudge when support launcher is absent or user parked elsewhere', () => {
    expect(
      nudgeFabAnchorClearOfSupportLauncher({ right: 24, bottom: 24 }, false),
    ).toEqual({ right: 24, bottom: 24 });
    expect(
      nudgeFabAnchorClearOfSupportLauncher({ right: 24, bottom: 220 }, true),
    ).toEqual({ right: 24, bottom: 220 });
  });
});
