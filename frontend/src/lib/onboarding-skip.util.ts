/**
 * e2e-bug.60 — "Skip for now" used to call `/onboarding/complete` without
 * persisting the business type the owner just selected on screen.
 */
export async function completeOnboardingPreservingBusinessType<T>(input: {
  selectedType: string;
  notes: string;
  persistBusinessType: (payload: {
    businessType: string;
    notes?: string;
  }) => Promise<unknown>;
  completeOnboarding: () => Promise<T>;
}): Promise<T> {
  const businessType = input.selectedType.trim();
  if (businessType) {
    await input.persistBusinessType({
      businessType,
      notes: input.notes.trim() || undefined,
    });
  }
  return input.completeOnboarding();
}
