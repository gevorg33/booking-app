/** n99-3.6 — qualified-install funnel instrumentation helpers. */

import type { AppAnalyticsEventProps } from './app-analytics.js';
import { enrichActivationEventProps } from './activation-instrumentation.util.js';

export function buildBookPageStartedBookingProps(
  serviceId: string,
  input?: { firstRunRedirect?: string },
): AppAnalyticsEventProps {
  return enrichActivationEventProps({
    serviceId,
    onboardingStep: 'service',
    ...input,
  })!;
}

export function buildBookPageConfirmStepProps(
  serviceId: string,
  input?: { firstRunRedirect?: string },
): AppAnalyticsEventProps {
  return enrichActivationEventProps({
    serviceId,
    onboardingStep: 'confirm',
    ...input,
  })!;
}

export function shouldTrackConfirmStep(input: { slot: string }): boolean {
  return Boolean(input.slot.trim());
}
