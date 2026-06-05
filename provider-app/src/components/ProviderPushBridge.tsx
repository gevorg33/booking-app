import { useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import { App as CapacitorApp } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import {
  PROVIDER_OPEN_BOOKING_EVENT,
  PROVIDER_PUSH_NAVIGATE_EVENT,
  dispatchProviderPushEffects,
  parseProviderPushPayload,
  providerTabPathFromPushUrl,
} from '../lib/provider-push-deep-link.util';

type OpenBookingDetail = { bookingId: string };

/** Routes push deep links and cold-start URLs into tab navigation + booking modal. */
export function ProviderPushBridge({
  onOpenBooking,
}: {
  onOpenBooking?: (bookingId: string) => void;
}) {
  const history = useHistory();

  useEffect(() => {
    const onNavigate = (e: Event) => {
      const path = (e as CustomEvent<{ path?: string }>).detail?.path;
      if (path) history.push(path);
    };

    const handleOpenBooking = (e: Event) => {
      const bookingId = (e as CustomEvent<OpenBookingDetail>).detail?.bookingId;
      if (bookingId) onOpenBooking?.(bookingId);
    };

    window.addEventListener(PROVIDER_PUSH_NAVIGATE_EVENT, onNavigate);
    window.addEventListener(PROVIDER_OPEN_BOOKING_EVENT, handleOpenBooking);

    return () => {
      window.removeEventListener(PROVIDER_PUSH_NAVIGATE_EVENT, onNavigate);
      window.removeEventListener(PROVIDER_OPEN_BOOKING_EVENT, handleOpenBooking);
    };
  }, [history, onOpenBooking]);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    const handleUrl = (url: string) => {
      const path = providerTabPathFromPushUrl(url);
      dispatchProviderPushEffects(parseProviderPushPayload({ url: path }));
    };

    void CapacitorApp.getLaunchUrl().then((result) => {
      if (result?.url) handleUrl(result.url);
    });

    const listener = CapacitorApp.addListener('appUrlOpen', (event) => {
      if (event.url) handleUrl(event.url);
    });

    return () => {
      void listener.then((handle) => handle.remove());
    };
  }, []);

  return null;
}
