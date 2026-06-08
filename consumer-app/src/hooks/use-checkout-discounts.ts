import { useCallback, useEffect, useRef, useState } from 'react';
import type { PublicCheckoutQuote } from '../lib/types.js';
import type { PublicLoyaltySummary } from '../lib/consumer-rewards-display.util.js';
import {
  buildCheckoutDiscountPayload,
  resolveMaxLoyaltyRedemption,
  shouldClearPromoOnQuoteError,
  type CheckoutDiscountState,
} from '../lib/checkout-discounts.util.js';

export function useCheckoutDiscounts<T extends PublicCheckoutQuote>(input: {
  enabled: boolean;
  fetchQuote: (discounts: {
    promoCode?: string;
    loyaltyPointsToRedeem?: number;
  }) => Promise<T>;
  loyalty: PublicLoyaltySummary | null | undefined;
  fallbackSubtotal: number;
  quoteFailedMessage: string;
  deps?: unknown[];
}) {
  const [promoCode, setPromoCode] = useState('');
  const [appliedPromo, setAppliedPromo] = useState('');
  const [promoError, setPromoError] = useState<string | null>(null);
  const [loyaltyPoints, setLoyaltyPoints] = useState(0);
  const [quote, setQuote] = useState<T | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [quoteError, setQuoteError] = useState<string | null>(null);
  const quoteRequestId = useRef(0);

  const discountState: CheckoutDiscountState = { appliedPromo, loyaltyPoints };

  useEffect(() => {
    if (!input.enabled) {
      setQuote(null);
      return;
    }

    let cancelled = false;
    const requestId = ++quoteRequestId.current;
    setQuoteLoading(true);
    setQuoteError(null);

    void input
      .fetchQuote(buildCheckoutDiscountPayload(discountState))
      .then((res) => {
        if (cancelled || requestId !== quoteRequestId.current) return;
        setQuote(res);
        if (res.loyaltyPointsToRedeem != null && res.loyaltyPointsToRedeem !== loyaltyPoints) {
          setLoyaltyPoints(res.loyaltyPointsToRedeem);
        }
        if (
          appliedPromo &&
          (res.promoCode?.toUpperCase() === appliedPromo.toUpperCase() ||
            res.giftCardCode?.toUpperCase() === appliedPromo.toUpperCase())
        ) {
          setPromoError(null);
        }
      })
      .catch((err: unknown) => {
        if (cancelled || requestId !== quoteRequestId.current) return;
        setQuote(null);
        const message = err instanceof Error ? err.message : input.quoteFailedMessage;
        setQuoteError(message);
        if (shouldClearPromoOnQuoteError(message, appliedPromo)) {
          setAppliedPromo('');
          setPromoError(message);
        }
      })
      .finally(() => {
        if (!cancelled && requestId === quoteRequestId.current) {
          setQuoteLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [input.enabled, appliedPromo, loyaltyPoints, input.fallbackSubtotal, ...(input.deps ?? [])]);

  const applyPromoCode = useCallback(() => {
    const code = promoCode.trim().toUpperCase();
    if (!code) return;
    setPromoError(null);
    setQuoteError(null);
    setAppliedPromo(code);
  }, [promoCode]);

  const clearPromoCode = useCallback(() => {
    setAppliedPromo('');
    setPromoCode('');
    setPromoError(null);
  }, []);

  const useMaxLoyaltyPoints = useCallback(() => {
    setLoyaltyPoints(
      resolveMaxLoyaltyRedemption({
        loyalty: input.loyalty,
        quote,
        fallbackSubtotal: input.fallbackSubtotal,
      }),
    );
  }, [input.fallbackSubtotal, input.loyalty, quote]);

  return {
    promoCode,
    setPromoCode,
    appliedPromo,
    promoError,
    loyaltyPoints,
    setLoyaltyPoints,
    quote,
    quoteLoading,
    quoteError,
    discountState,
    applyPromoCode,
    clearPromoCode,
    useMaxLoyaltyPoints,
    discountPayload: buildCheckoutDiscountPayload(discountState),
  };
}
