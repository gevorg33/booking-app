import type { GuideFlowSurface } from './guide/guide-flow.types.js';
import {
  CUSTOMER_PUBLIC_EMPTY_STATE_GUIDE_INTENTS,
  DASHBOARD_EMPTY_STATE_GUIDE_INTENTS,
  PROVIDER_EMPTY_STATE_GUIDE_INTENTS,
  type EmptyStateGuideIntent,
} from './ai-product-guide-empty-state.fixtures.js';

/**
 * Intent membership only — no session/logic imports.
 * access-control.matrix must use this leaf to avoid a registry↔platform cycle (e2e-bug.1).
 */
export function isEmptyStateGuideIntent(
  action: string,
): action is EmptyStateGuideIntent {
  return (DASHBOARD_EMPTY_STATE_GUIDE_INTENTS as readonly string[]).includes(
    action,
  );
}

export function isEmptyStateGuideIntentOnSurface(
  action: string,
  surface: GuideFlowSurface,
): boolean {
  if (!isEmptyStateGuideIntent(action)) return false;
  if (surface === 'dashboard') return true;
  if (surface === 'provider') {
    return (PROVIDER_EMPTY_STATE_GUIDE_INTENTS as readonly string[]).includes(
      action,
    );
  }
  if (surface === 'customer' || surface === 'public') {
    return (
      CUSTOMER_PUBLIC_EMPTY_STATE_GUIDE_INTENTS as readonly string[]
    ).includes(action);
  }
  return false;
}
