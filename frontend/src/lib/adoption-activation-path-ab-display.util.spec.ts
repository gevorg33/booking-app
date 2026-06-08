import { describe, expect, it } from 'vitest';
import {
  formatActivationPathDimensionLabel,
  formatActivationPathRate,
  formatActivationPathVariantLabel,
  readActivationPathAbDashboard,
} from './adoption-activation-path-ab-display.util';

describe('adoption-activation-path-ab-display.util (n99-3.8)', () => {
  it('reads activation path AB dashboard payload', () => {
    const view = readActivationPathAbDashboard({
      activationPathAb: {
        promoted: {
          signInPlacement: 'pre_confirm',
          slotPreselection: 'nearest_auto',
          paymentTiming: 'online_first',
        },
        dimensions: [
          {
            dimension: 'signInPlacement',
            winner: 'pre_confirm',
            promoted: 'pre_confirm',
            promotionApplied: true,
            scores: [],
          },
        ],
      },
    });
    expect(view?.promoted.signInPlacement).toBe('pre_confirm');
  });

  it('formats labels and rates', () => {
    expect(formatActivationPathDimensionLabel('paymentTiming')).toBe('Payment timing');
    expect(formatActivationPathVariantLabel('pre_confirm')).toBe('Pre-confirm');
    expect(formatActivationPathRate(0.512)).toBe('51.2%');
    expect(formatActivationPathRate(null)).toBe('—');
  });
});
