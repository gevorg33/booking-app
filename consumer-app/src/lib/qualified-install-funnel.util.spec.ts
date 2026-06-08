import { describe, expect, it } from 'vitest';
import {
  buildBookPageConfirmStepProps,
  buildBookPageStartedBookingProps,
  shouldTrackConfirmStep,
} from './qualified-install-funnel.util.js';

describe('qualified-install-funnel.util (n99-3.6)', () => {
  it('builds started_booking props', () => {
    expect(buildBookPageStartedBookingProps('svc-1')).toMatchObject({
      serviceId: 'svc-1',
      onboardingStep: 'service',
    });
  });

  it('builds confirm step props for deferred resume', () => {
    expect(
      buildBookPageConfirmStepProps('svc-1', { firstRunRedirect: 'deferred_link' }),
    ).toMatchObject({
      serviceId: 'svc-1',
      onboardingStep: 'confirm',
      firstRunRedirect: 'deferred_link',
    });
  });

  it('tracks confirm when a slot is selected', () => {
    expect(shouldTrackConfirmStep({ slot: '2026-06-10T14:00:00.000Z' })).toBe(true);
    expect(shouldTrackConfirmStep({ slot: '' })).toBe(false);
  });
});
