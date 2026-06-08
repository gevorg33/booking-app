import { useEffect, useMemo } from 'react';
import { App as CapacitorApp } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { useQueryClient } from '@tanstack/react-query';
import type { ConsumerCopy } from '../lib/copy.js';
import { formatDateDisplay, formatScheduleTime } from '../lib/date-format.js';
import { buildHomeScreenWidgetSnapshot } from '../lib/home-screen-widget.util.js';
import { syncHomeScreenWidgetSnapshot } from '../lib/home-screen-widget-native.js';
import type { PublicBusinessProfile, PublicCustomerBookingItem } from '../lib/types.js';

/** Push booking snapshot to iOS WidgetKit / Android App Widget (adopt-4.7). */
export function useHomeScreenWidgetSync(input: {
  slug: string;
  profile: PublicBusinessProfile;
  authed: boolean;
  bookings: PublicCustomerBookingItem[] | undefined;
  copy: ConsumerCopy;
  locale: string;
}) {
  const queryClient = useQueryClient();
  const snapshot = useMemo(
    () =>
      buildHomeScreenWidgetSnapshot({
        slug: input.slug,
        businessName: input.profile.name,
        authed: input.authed,
        bookings: input.bookings ?? [],
        copy: input.copy,
        formatDate: (iso) => formatDateDisplay(iso, input.locale),
        formatTime: (iso) => formatScheduleTime(iso),
      }),
    [
      input.slug,
      input.profile.name,
      input.authed,
      input.bookings,
      input.copy,
      input.locale,
    ],
  );

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    void syncHomeScreenWidgetSnapshot(snapshot);
  }, [snapshot]);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    const listener = CapacitorApp.addListener('appStateChange', (state) => {
      if (!state.isActive) return;
      void queryClient.invalidateQueries({ queryKey: ['bookings', input.slug] });
    });

    return () => {
      void listener.then((handle) => handle.remove());
    };
  }, [input.slug, queryClient]);
}
