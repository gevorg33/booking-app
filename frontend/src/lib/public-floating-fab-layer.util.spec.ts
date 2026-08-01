import { describe, expect, it } from 'vitest';
import {
  DEFAULT_FAB_MARGIN_PX,
  PUBLIC_AI_FAB_ABOVE_SUPPORT_LAUNCHER_BOTTOM_PX,
  PUBLIC_STICKY_CTA_STACK_GAP_PX,
  isFabAnchorInSupportLauncherConflictZone,
  isFabAnchorOverlappingStickyCta,
  measurePublicStickyCtaHeight,
  nudgeFabAnchorClearOfOverlays,
  nudgeFabAnchorClearOfSupportLauncher,
  publicAiFabBottomInsetAboveStickyCta,
  publicAiFabDefaultBottomInset,
} from './public-floating-fab-layer.util';

describe('public-floating-fab-layer.util (e2e-bug.123 + e2e-bug.220)', () => {
  it('keeps default bottom inset when no support launcher and no sticky CTA', () => {
    expect(publicAiFabDefaultBottomInset(false)).toBe(DEFAULT_FAB_MARGIN_PX);
    expect(publicAiFabDefaultBottomInset(false, 0)).toBe(DEFAULT_FAB_MARGIN_PX);
  });

  it('stacks AI FAB above support launcher footprint', () => {
    expect(publicAiFabDefaultBottomInset(true)).toBe(
      PUBLIC_AI_FAB_ABOVE_SUPPORT_LAUNCHER_BOTTOM_PX,
    );
    expect(publicAiFabDefaultBottomInset(true)).toBeGreaterThan(
      DEFAULT_FAB_MARGIN_PX + 60,
    );
  });

  it.each([
    { id: 'zero', height: 0, expected: 0 },
    { id: 'negative', height: -10, expected: 0 },
    {
      id: 'gift-sticky',
      height: 72,
      expected: 72 + PUBLIC_STICKY_CTA_STACK_GAP_PX,
    },
    {
      id: 'fixed-action-bar',
      height: 110,
      expected: 110 + PUBLIC_STICKY_CTA_STACK_GAP_PX,
    },
  ])(
    'publicAiFabBottomInsetAboveStickyCta: $id',
    ({ height, expected }) => {
      expect(publicAiFabBottomInsetAboveStickyCta(height)).toBe(expected);
    },
  );

  it('e2e-bug.220 — sticky CTA raises default inset above 24px margin', () => {
    const inset = publicAiFabDefaultBottomInset(false, 80);
    expect(inset).toBe(80 + PUBLIC_STICKY_CTA_STACK_GAP_PX);
    expect(inset).toBeGreaterThan(DEFAULT_FAB_MARGIN_PX);
  });

  it('e2e-bug.220 — sticky CTA and support launcher use the larger clearance', () => {
    expect(publicAiFabDefaultBottomInset(true, 40)).toBe(
      PUBLIC_AI_FAB_ABOVE_SUPPORT_LAUNCHER_BOTTOM_PX,
    );
    expect(publicAiFabDefaultBottomInset(true, 200)).toBe(
      200 + PUBLIC_STICKY_CTA_STACK_GAP_PX,
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

  it('detects sticky CTA overlap in the default corner', () => {
    expect(isFabAnchorOverlappingStickyCta({ right: 24, bottom: 24 }, 80)).toBe(
      true,
    );
    expect(
      isFabAnchorOverlappingStickyCta({ right: 24, bottom: 200 }, 80),
    ).toBe(false);
    expect(isFabAnchorOverlappingStickyCta({ right: 24, bottom: 24 }, 0)).toBe(
      false,
    );
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

  it('e2e-bug.220 — nudgeFabAnchorClearOfOverlays raises FAB above sticky CTA', () => {
    expect(
      nudgeFabAnchorClearOfOverlays(
        { right: 24, bottom: 24 },
        { hasSupportLauncher: false, stickyCtaHeightPx: 88 },
      ),
    ).toEqual({
      right: 24,
      bottom: 88 + PUBLIC_STICKY_CTA_STACK_GAP_PX,
    });
  });

  it('e2e-bug.220 — does not move FAB user parked away from corner', () => {
    expect(
      nudgeFabAnchorClearOfOverlays(
        { right: 120, bottom: 24 },
        { hasSupportLauncher: false, stickyCtaHeightPx: 88 },
      ),
    ).toEqual({ right: 120, bottom: 24 });
  });

  it('e2e-bug.220 — tall sticky wins over support launcher clearance', () => {
    expect(
      nudgeFabAnchorClearOfOverlays(
        { right: 24, bottom: 24 },
        { hasSupportLauncher: true, stickyCtaHeightPx: 200 },
      ),
    ).toEqual({
      right: 24,
      bottom: 200 + PUBLIC_STICKY_CTA_STACK_GAP_PX,
    });
  });

  it('e2e-bug.220 — short sticky keeps support launcher clearance', () => {
    expect(
      nudgeFabAnchorClearOfOverlays(
        { right: 24, bottom: 24 },
        { hasSupportLauncher: true, stickyCtaHeightPx: 40 },
      ),
    ).toEqual({
      right: 24,
      bottom: PUBLIC_AI_FAB_ABOVE_SUPPORT_LAUNCHER_BOTTOM_PX,
    });
  });

  it('e2e-bug.220 — already-clear FAB above sticky is left alone', () => {
    expect(
      nudgeFabAnchorClearOfOverlays(
        { right: 24, bottom: 200 },
        { hasSupportLauncher: false, stickyCtaHeightPx: 80 },
      ),
    ).toEqual({ right: 24, bottom: 200 });
  });

  it('measurePublicStickyCtaHeight returns tallest marked node', () => {
    const root = document.createElement('div');
    const a = document.createElement('div');
    a.setAttribute('data-public-sticky-cta', '');
    Object.defineProperty(a, 'getBoundingClientRect', {
      value: () => ({ height: 64, width: 100, top: 0, left: 0, bottom: 64, right: 100, x: 0, y: 0, toJSON: () => ({}) }),
    });
    const b = document.createElement('div');
    b.setAttribute('data-public-sticky-cta', '');
    Object.defineProperty(b, 'getBoundingClientRect', {
      value: () => ({ height: 96, width: 100, top: 0, left: 0, bottom: 96, right: 100, x: 0, y: 0, toJSON: () => ({}) }),
    });
    root.append(a, b);
    expect(measurePublicStickyCtaHeight(root)).toBe(96);
    expect(measurePublicStickyCtaHeight(document.createElement('div'))).toBe(0);
  });
});
