import {
  buildCheckoutRecommendationsDismissKey,
  dismissCheckoutRecommendations,
  dispatchDismissConsumerCheckoutRecommendations,
  isCheckoutRecommendationsDismissed,
} from './consumer-checkout-recommendations-dismiss.util.js';

describe('consumer-checkout-recommendations-dismiss.util', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it('builds scoped dismiss keys', () => {
    expect(buildCheckoutRecommendationsDismissKey('glow', 'bk-1')).toBe(
      'checkout-recommendations-dismissed:glow:bk-1',
    );
    expect(buildCheckoutRecommendationsDismissKey('glow', undefined, 'svc-1')).toBe(
      'checkout-recommendations-dismissed:glow:svc-1',
    );
  });

  it('persists dismiss state in sessionStorage', () => {
    const key = buildCheckoutRecommendationsDismissKey('glow', 'bk-1');
    expect(isCheckoutRecommendationsDismissed(key)).toBe(false);
    dismissCheckoutRecommendations(key);
    expect(isCheckoutRecommendationsDismissed(key)).toBe(true);
  });

  it('dispatches dismiss event and persists when slug is provided', () => {
    const handler = vi.fn();
    window.addEventListener(
      'consumer:dismiss-checkout-recommendations',
      handler,
    );
    dispatchDismissConsumerCheckoutRecommendations({
      slug: 'glow',
      bookingId: 'bk-1',
    });
    expect(handler).toHaveBeenCalledTimes(1);
    expect(
      isCheckoutRecommendationsDismissed(
        buildCheckoutRecommendationsDismissKey('glow', 'bk-1'),
      ),
    ).toBe(true);
    window.removeEventListener(
      'consumer:dismiss-checkout-recommendations',
      handler,
    );
  });
});
