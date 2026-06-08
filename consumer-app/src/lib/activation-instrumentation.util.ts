import type { AppAnalyticsEventProps } from './app-analytics.js';
import {
  buildActivationPathAnalyticsProps,
  readStoredActivationPathVariants,
  resolveActivationPathVariants,
} from './activation-path-ab.util.js';
import {
  buildBookingResumeAnalyticsProps,
  hasResumableBookingProgress,
  loadBookingDraft,
  type BookingDraft,
} from './booking-draft.util.js';
import { getOrCreateAnonId } from './app-analytics.js';
import { readStoredOnboardingVariant } from './onboarding-variant.util.js';

export function readOnboardingVariantForAnalytics(): string | undefined {
  return readStoredOnboardingVariant() ?? undefined;
}

function readActivationPathPropsForAnalytics(): Pick<
  AppAnalyticsEventProps,
  'signInPlacement' | 'slotPreselection' | 'paymentTiming'
> {
  const stored = readStoredActivationPathVariants();
  const variants = stored ?? resolveActivationPathVariants(getOrCreateAnonId());
  return buildActivationPathAnalyticsProps(variants);
}

export function enrichActivationEventProps(
  props?: AppAnalyticsEventProps,
): AppAnalyticsEventProps | undefined {
  const onboardingVariant = props?.onboardingVariant ?? readOnboardingVariantForAnalytics();
  const pathProps = readActivationPathPropsForAnalytics();
  if (!onboardingVariant && !props) {
    return { ...pathProps };
  }
  return {
    ...props,
    ...pathProps,
    ...(onboardingVariant ? { onboardingVariant } : {}),
  };
}

export function buildBookingAbandonmentProps(input: {
  serviceId: string;
  abandonedStep: 'service' | 'slot' | 'confirm';
  date?: string;
  slot?: string;
  employeeId?: string;
}): AppAnalyticsEventProps {
  return enrichActivationEventProps({
    serviceId: input.serviceId,
    abandonedStep: input.abandonedStep,
    ...(input.date ? { date: input.date } : {}),
    ...(input.slot ? { slot: input.slot } : {}),
    ...(input.employeeId ? { employeeId: input.employeeId } : {}),
  })!;
}

export function buildBookingResumeEventProps(
  draft: BookingDraft,
): AppAnalyticsEventProps {
  return enrichActivationEventProps(
    buildBookingResumeAnalyticsProps(draft, readOnboardingVariantForAnalytics()),
  )!;
}

export function peekResumableBookingDraft(): BookingDraft | null {
  const draft = loadBookingDraft();
  if (!draft || !hasResumableBookingProgress(draft)) return null;
  return draft;
}
