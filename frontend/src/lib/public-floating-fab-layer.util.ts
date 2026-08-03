/**
 * e2e-bug.123 — keep the public AI FAB clear of third-party support launchers
 * (Zendesk Web Widget launcher iframe uses z-index 999998 and sits bottom-right).
 *
 * e2e-bug.220 — also clear fixed sticky primary CTAs (`data-public-sticky-cta`)
 * such as “Continue to checkout” / “Select service”.
 *
 * We do not try to outrank Zendesk's z-index: that would also cover app dialogs
 * (z ~70–202). Instead, raise the FAB’s bottom inset above overlays.
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

/** Sticky primary CTA / checkout footers on public booking pages. */
export const PUBLIC_STICKY_CTA_SELECTOR = '[data-public-sticky-cta]';

/** Gap between sticky CTA top edge and FAB bottom edge. */
export const PUBLIC_STICKY_CTA_STACK_GAP_PX = 12;

export type FabViewportAnchor = { right: number; bottom: number };

export function publicAiFabBottomInsetAboveStickyCta(
  stickyCtaHeightPx: number,
): number {
  if (!(stickyCtaHeightPx > 0)) return 0;
  return Math.ceil(stickyCtaHeightPx) + PUBLIC_STICKY_CTA_STACK_GAP_PX;
}

export function publicAiFabDefaultBottomInset(
  hasSupportLauncher: boolean,
  stickyCtaHeightPx = 0,
): number {
  const support = hasSupportLauncher
    ? PUBLIC_AI_FAB_ABOVE_SUPPORT_LAUNCHER_BOTTOM_PX
    : DEFAULT_FAB_MARGIN_PX;
  const sticky = publicAiFabBottomInsetAboveStickyCta(stickyCtaHeightPx);
  return Math.max(support, sticky, DEFAULT_FAB_MARGIN_PX);
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

export function isFabAnchorOverlappingStickyCta(
  anchor: FabViewportAnchor,
  stickyCtaHeightPx: number,
): boolean {
  const clearBottom = publicAiFabBottomInsetAboveStickyCta(stickyCtaHeightPx);
  if (clearBottom <= 0) return false;
  return (
    anchor.right <= DEFAULT_FAB_MARGIN_PX + 16 &&
    anchor.bottom < clearBottom - 8
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

/** e2e-bug.220 — also clear sticky CTAs (and keep support-launcher clearance). */
export function nudgeFabAnchorClearOfOverlays(
  anchor: FabViewportAnchor,
  options: { hasSupportLauncher: boolean; stickyCtaHeightPx?: number },
): FabViewportAnchor {
  let next = nudgeFabAnchorClearOfSupportLauncher(
    anchor,
    options.hasSupportLauncher,
  );
  const stickyHeight = options.stickyCtaHeightPx ?? 0;
  if (isFabAnchorOverlappingStickyCta(next, stickyHeight)) {
    next = {
      ...next,
      bottom: publicAiFabBottomInsetAboveStickyCta(stickyHeight),
    };
  }
  const minBottom = publicAiFabDefaultBottomInset(
    options.hasSupportLauncher,
    stickyHeight,
  );
  if (
    next.right <= DEFAULT_FAB_MARGIN_PX + 16 &&
    next.bottom < minBottom - 8
  ) {
    next = { ...next, bottom: minBottom };
  }
  return next;
}

/** Measure tallest visible sticky CTA in the document (0 when none). */
export function measurePublicStickyCtaHeight(
  root: ParentNode | null | undefined = typeof document !== 'undefined'
    ? document
    : null,
): number {
  if (!root) return 0;
  const nodes = root.querySelectorAll(PUBLIC_STICKY_CTA_SELECTOR);
  let max = 0;
  nodes.forEach((node) => {
    if (!(node instanceof HTMLElement)) return;
    const rect = node.getBoundingClientRect();
    if (rect.height > max) max = rect.height;
  });
  return max;
}
