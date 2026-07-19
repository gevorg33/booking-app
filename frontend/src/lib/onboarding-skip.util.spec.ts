import { describe, expect, it, vi } from 'vitest';
import { completeOnboardingPreservingBusinessType } from './onboarding-skip.util';

describe('completeOnboardingPreservingBusinessType (e2e-bug.60)', () => {
  it('persists selected business type before completing skip', async () => {
    const persistBusinessType = vi.fn().mockResolvedValue({ ok: true });
    const completeOnboarding = vi.fn().mockResolvedValue({ completed: true });

    const result = await completeOnboardingPreservingBusinessType({
      selectedType: 'clinic',
      notes: '  GP practice  ',
      persistBusinessType,
      completeOnboarding,
    });

    expect(persistBusinessType).toHaveBeenCalledWith({
      businessType: 'clinic',
      notes: 'GP practice',
    });
    expect(completeOnboarding).toHaveBeenCalledTimes(1);
    expect(persistBusinessType.mock.invocationCallOrder[0]).toBeLessThan(
      completeOnboarding.mock.invocationCallOrder[0],
    );
    expect(result).toEqual({ completed: true });
  });

  it('omits notes when blank after trim', async () => {
    const persistBusinessType = vi.fn().mockResolvedValue({});
    const completeOnboarding = vi.fn().mockResolvedValue({ completed: true });

    await completeOnboardingPreservingBusinessType({
      selectedType: '  dental  ',
      notes: '   ',
      persistBusinessType,
      completeOnboarding,
    });

    expect(persistBusinessType).toHaveBeenCalledWith({
      businessType: 'dental',
      notes: undefined,
    });
  });

  it('completes without persist when no type is selected', async () => {
    const persistBusinessType = vi.fn();
    const completeOnboarding = vi.fn().mockResolvedValue({ completed: true });

    await completeOnboardingPreservingBusinessType({
      selectedType: '   ',
      notes: 'ignored',
      persistBusinessType,
      completeOnboarding,
    });

    expect(persistBusinessType).not.toHaveBeenCalled();
    expect(completeOnboarding).toHaveBeenCalledTimes(1);
  });

  it('does not complete when persist fails', async () => {
    const persistBusinessType = vi
      .fn()
      .mockRejectedValue(new Error('save failed'));
    const completeOnboarding = vi.fn();

    await expect(
      completeOnboardingPreservingBusinessType({
        selectedType: 'clinic',
        notes: '',
        persistBusinessType,
        completeOnboarding,
      }),
    ).rejects.toThrow('save failed');

    expect(completeOnboarding).not.toHaveBeenCalled();
  });
});
