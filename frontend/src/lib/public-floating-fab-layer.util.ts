/**
 * e2e-bug.123 — keep the public AI FAB clear of third-party support launchers
 * (Zendesk Web Widget launcher iframe uses z-index 999998 and sits bottom-right).
 *
 * We do not try to outrank Zendesk's z-index: that would also cover app dialogs
 * (z ~70–202). Instead, stack our FAB above the launcher by default and nudge
 * stored anchors that still sit in the conflict corner.
 */

export const DEFAULT_FAB_MARGIN_PX = 24;

/** Approximate Zendesk / support launcher footprint in the bottom-right corner. */
export const SUPPORT_LAUNCHER_FOOTPRINT_PX = 70;

/** Gap between stacked FABs. */
export const SUPPORT_LAUNCHER_STACK_GAP_PX = 12;

/** Bottom inset so AI FAB sits above a bottom-right support launcher. */
export const PUBLIC_AI_FAB_ABOVE_SUPPORT_LAUNCHER_BOTTOM_PX =
  DEFAULT_FAB_MARGIN_PX +
  SUPPORT_LAUNCHER_FOOTPRINT_PX +
  SUPPORT_LAUNCHER_STACK_GAP_PX;

export type FabViewportAnchor = { right: number; bottom: number };

export function publicAiFabDefaultBottomInset(
  hasSupportLauncher: boolean,
): number {
  return hasSupportLauncher
    ? PUBLIC_AI_FAB_ABOVE_SUPPORT_LAUNCHER_BOTTOM_PX
    : DEFAULT_FAB_MARGIN_PX;
}

/** True when the FAB is still parked in the default bottom-right conflict zone. */
export function isFabAnchorInSupportLauncherConflictZone(
  anchor: FabViewportAnchor,
): boolean {
  return (
    anchor.right <= DEFAULT_FAB_MARGIN_PX + 16 &&
    anchor.bottom < PUBLIC_AI_FAB_ABOVE_SUPPORT_LAUNCHER_BOTTOM_PX - 8
  );
}

/**
 * When a support launcher is present, bump bottom-right parked FABs up so
 * hit-boxes do not overlap the third-party iframe.
 */
export function nudgeFabAnchorClearOfSupportLauncher(
  anchor: FabViewportAnchor,
  hasSupportLauncher: boolean,
): FabViewportAnchor {
  if (!hasSupportLauncher) return anchor;
  if (!isFabAnchorInSupportLauncherConflictZone(anchor)) return anchor;
  return {
    ...anchor,
    bottom: PUBLIC_AI_FAB_ABOVE_SUPPORT_LAUNCHER_BOTTOM_PX,
  };
}
