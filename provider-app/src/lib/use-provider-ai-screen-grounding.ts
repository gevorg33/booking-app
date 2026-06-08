'use client';

import { useEffect } from 'react';
import {
  buildProviderAiScreenContext,
  type ProviderAiScreenContext,
} from './provider-ai-context';
import {
  clearProviderAiScreenOverlay,
  PROVIDER_AI_SCREEN_OVERLAY_KEYS,
  setProviderAiScreenOverlay,
} from './provider-ai-screen-store';
import type { BookingSummary } from './booking-types';

/** Sync selected booking/customer on screen into provider AI context (n99-2.2). */
export function useProviderAiScreenGrounding(input: {
  route: string;
  selectedBookingId: string | null;
  bookings?: BookingSummary[];
}) {
  useEffect(() => {
    if (!input.selectedBookingId) {
      clearProviderAiScreenOverlay(PROVIDER_AI_SCREEN_OVERLAY_KEYS);
      return;
    }

    const overlay = buildProviderAiScreenContext(
      input.route,
      {},
      input.bookings ?? [],
      input.selectedBookingId,
    );
    setProviderAiScreenOverlay(overlay);
    return () => clearProviderAiScreenOverlay(PROVIDER_AI_SCREEN_OVERLAY_KEYS);
  }, [input.route, input.selectedBookingId, input.bookings]);
}

export function mergeProviderAiScreenContext(
  base: ProviderAiScreenContext | undefined,
  overlay: Partial<ProviderAiScreenContext>,
): ProviderAiScreenContext {
  return { ...base, ...overlay };
}
