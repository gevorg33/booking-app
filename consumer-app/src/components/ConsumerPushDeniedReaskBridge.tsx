import { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { PushSettingsReaskPrompt } from './PushSettingsReaskPrompt.js';
import {
  CONSUMER_HIGH_VALUE_PUSH_MOMENT_EVENT,
  shouldShowPushDeniedReask,
  type HighValuePushMomentDetail,
} from '../lib/push-denied-reask.util.js';
import { getConsumerNativePushStatus, isFcmBuild } from '../services/native-push.js';

/** n99-4.6 — single settings re-ask at a later high-value booking moment. */
export function ConsumerPushDeniedReaskBridge() {
  const [slug, setSlug] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!Capacitor.isNativePlatform() || !isFcmBuild()) return;

    const onHighValueMoment = (event: Event) => {
      void (async () => {
        const detail = (event as CustomEvent<HighValuePushMomentDetail>).detail;
        if (!detail?.slug) return;

        const status = await getConsumerNativePushStatus(detail.slug);
        if (
          !shouldShowPushDeniedReask({
            permission: status.permission,
            completedBookingCount: detail.completedBookingCount,
            isNative: true,
            isFcmBuild: true,
          })
        ) {
          return;
        }

        setSlug(detail.slug);
        setOpen(true);
      })();
    };

    window.addEventListener(CONSUMER_HIGH_VALUE_PUSH_MOMENT_EVENT, onHighValueMoment);
    return () =>
      window.removeEventListener(CONSUMER_HIGH_VALUE_PUSH_MOMENT_EVENT, onHighValueMoment);
  }, []);

  if (!slug) return null;

  return (
    <PushSettingsReaskPrompt
      isOpen={open}
      onDismiss={() => setOpen(false)}
    />
  );
}
