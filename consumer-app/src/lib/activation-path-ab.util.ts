import type { AppAnalyticsEventProps } from './app-analytics.js';

export const ACTIVATION_PATH_VARIANTS_KEY = 'consumer_activation_path_variants';
export const ACTIVATION_PATH_PROMOTED_KEY = 'consumer_activation_path_promoted';

export const SIGN_IN_PLACEMENT_VARIANTS = ['post_booking', 'pre_confirm'] as const;
export type SignInPlacementVariant = (typeof SIGN_IN_PLACEMENT_VARIANTS)[number];

export const SLOT_PRESELECTION_VARIANTS = ['nearest_auto', 'manual_pick'] as const;
export type SlotPreselectionVariant = (typeof SLOT_PRESELECTION_VARIANTS)[number];

export const PAYMENT_TIMING_VARIANTS = ['pay_at_venue_default', 'online_first'] as const;
export type PaymentTimingVariant = (typeof PAYMENT_TIMING_VARIANTS)[number];

export interface ActivationPathVariants {
  signInPlacement: SignInPlacementVariant;
  slotPreselection: SlotPreselectionVariant;
  paymentTiming: PaymentTimingVariant;
}

export interface ActivationPathPromotedView {
  signInPlacement?: SignInPlacementVariant | null;
  slotPreselection?: SlotPreselectionVariant | null;
  paymentTiming?: PaymentTimingVariant | null;
}

function stableBucket(anonId: string, salt: number): number {
  let hash = salt;
  for (let index = 0; index < anonId.length; index += 1) {
    hash = (hash * 31 + anonId.charCodeAt(index)) >>> 0;
  }
  return hash % 2;
}

export function assignActivationPathVariants(anonId: string): ActivationPathVariants {
  const trimmed = anonId.trim();
  return {
    signInPlacement:
      stableBucket(trimmed, 11) === 0 ? 'post_booking' : 'pre_confirm',
    slotPreselection:
      stableBucket(trimmed, 23) === 0 ? 'nearest_auto' : 'manual_pick',
    paymentTiming:
      stableBucket(trimmed, 37) === 0 ? 'pay_at_venue_default' : 'online_first',
  };
}

export function readStoredActivationPathVariants(): ActivationPathVariants | null {
  if (typeof localStorage === 'undefined') return null;
  const raw = localStorage.getItem(ACTIVATION_PATH_VARIANTS_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<ActivationPathVariants>;
    if (
      !parsed.signInPlacement ||
      !SIGN_IN_PLACEMENT_VARIANTS.includes(parsed.signInPlacement)
    ) {
      return null;
    }
    if (
      !parsed.slotPreselection ||
      !SLOT_PRESELECTION_VARIANTS.includes(parsed.slotPreselection)
    ) {
      return null;
    }
    if (!parsed.paymentTiming || !PAYMENT_TIMING_VARIANTS.includes(parsed.paymentTiming)) {
      return null;
    }
    return parsed as ActivationPathVariants;
  } catch {
    return null;
  }
}

export function persistActivationPathVariants(variants: ActivationPathVariants): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(ACTIVATION_PATH_VARIANTS_KEY, JSON.stringify(variants));
}

export function readCachedActivationPathPromoted(): Partial<ActivationPathVariants> | null {
  if (typeof localStorage === 'undefined') return null;
  const raw = localStorage.getItem(ACTIVATION_PATH_PROMOTED_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Partial<ActivationPathVariants>;
  } catch {
    return null;
  }
}

export function cacheActivationPathPromoted(
  promoted: Partial<ActivationPathVariants> | null | undefined,
): void {
  if (typeof localStorage === 'undefined') return;
  if (!promoted || Object.keys(promoted).length === 0) {
    localStorage.removeItem(ACTIVATION_PATH_PROMOTED_KEY);
    return;
  }
  localStorage.setItem(ACTIVATION_PATH_PROMOTED_KEY, JSON.stringify(promoted));
}

export function resolveActivationPathVariants(
  anonId: string,
  promoted?: Partial<ActivationPathVariants> | null,
): ActivationPathVariants {
  const stored = readStoredActivationPathVariants();
  const assigned = stored ?? assignActivationPathVariants(anonId);
  if (!stored) persistActivationPathVariants(assigned);

  const effectivePromoted = promoted ?? readCachedActivationPathPromoted() ?? {};
  return {
    signInPlacement: effectivePromoted.signInPlacement ?? assigned.signInPlacement,
    slotPreselection: effectivePromoted.slotPreselection ?? assigned.slotPreselection,
    paymentTiming: effectivePromoted.paymentTiming ?? assigned.paymentTiming,
  };
}

export function buildActivationPathAnalyticsProps(
  variants: ActivationPathVariants,
): Pick<
  AppAnalyticsEventProps,
  'signInPlacement' | 'slotPreselection' | 'paymentTiming'
> {
  return {
    signInPlacement: variants.signInPlacement,
    slotPreselection: variants.slotPreselection,
    paymentTiming: variants.paymentTiming,
  };
}

export function shouldAutoPreselectNearestSlot(input: {
  slotPreselection: SlotPreselectionVariant;
  nearestAttempted: boolean;
  slot: string;
}): boolean {
  if (input.slotPreselection === 'manual_pick') return false;
  return !input.nearestAttempted && !input.slot.trim();
}

export function shouldPromptPreConfirmSignIn(input: {
  signInPlacement: SignInPlacementVariant;
  wasGuestAtBooking: boolean;
  hasExistingSession: boolean;
  hasOneTapProvider: boolean;
  dismissed?: boolean;
  slotSelected?: boolean;
}): boolean {
  if (input.signInPlacement !== 'pre_confirm') return false;
  if (!input.slotSelected) return false;
  if (!input.wasGuestAtBooking) return false;
  if (input.hasExistingSession) return false;
  if (!input.hasOneTapProvider) return false;
  if (input.dismissed) return false;
  return true;
}

export function buildPreConfirmSignInStorageKey(slug: string, serviceId: string): string {
  return `pre_confirm_${slug.trim()}_${serviceId.trim()}`;
}

export function parseActivationPathPromotedFromConfig(
  config: { activationPathAb?: ActivationPathPromotedView | null } | null | undefined,
): Partial<ActivationPathVariants> {
  const promoted = config?.activationPathAb;
  if (!promoted) return {};
  const resolved: Partial<ActivationPathVariants> = {};
  if (
    promoted.signInPlacement &&
    SIGN_IN_PLACEMENT_VARIANTS.includes(promoted.signInPlacement)
  ) {
    resolved.signInPlacement = promoted.signInPlacement;
  }
  if (
    promoted.slotPreselection &&
    SLOT_PRESELECTION_VARIANTS.includes(promoted.slotPreselection)
  ) {
    resolved.slotPreselection = promoted.slotPreselection;
  }
  if (promoted.paymentTiming && PAYMENT_TIMING_VARIANTS.includes(promoted.paymentTiming)) {
    resolved.paymentTiming = promoted.paymentTiming;
  }
  return resolved;
}
