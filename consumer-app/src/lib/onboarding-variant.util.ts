const VARIANT_KEY = 'consumer_onboarding_variant';

export type OnboardingVariant = 'control' | 'guided';

export function assignOnboardingVariant(anonId: string): OnboardingVariant {
  const bucket = anonId.trim().charCodeAt(anonId.length - 1) % 2;
  return bucket === 0 ? 'control' : 'guided';
}

export function readStoredOnboardingVariant(): OnboardingVariant | null {
  const raw = localStorage?.getItem(VARIANT_KEY);
  return raw === 'control' || raw === 'guided' ? raw : null;
}

export function persistOnboardingVariant(variant: OnboardingVariant): void {
  localStorage?.setItem(VARIANT_KEY, variant);
}

export function resolveOnboardingVariant(anonId: string): OnboardingVariant {
  const stored = readStoredOnboardingVariant();
  if (stored) return stored;
  const assigned = assignOnboardingVariant(anonId);
  persistOnboardingVariant(assigned);
  return assigned;
}

export function shouldShowGuidedOnboardingHero(variant: OnboardingVariant): boolean {
  return variant === 'guided';
}
