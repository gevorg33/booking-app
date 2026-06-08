import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import { PushProvisionalUpgradePrompt } from './PushProvisionalUpgradePrompt.js';
import {
  CONSUMER_PROVISIONAL_PUSH_ENGAGED_EVENT,
  resolveProvisionalUpgradeSlug,
  shouldShowProvisionalToFullUpgradePrompt,
} from '../lib/provisional-to-full-push.util.js';
import {
  acceptProvisionalToFullUpgrade,
  getConsumerNativePushStatus,
  isFcmBuild,
  readActiveConsumerPushSlug,
} from '../services/native-push.js';

/** n99-4.5 — show provisional → full upgrade after notification engagement. */
export function ConsumerProvisionalUpgradeBridge() {
  const location = useLocation();
  const [slug, setSlug] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!Capacitor.isNativePlatform() || !isFcmBuild()) return;

    const onEngaged = (event: Event) => {
      void (async () => {
        const detail = (event as CustomEvent<{ slug?: string | null }>).detail;
        const targetSlug = resolveProvisionalUpgradeSlug({
          eventSlug: detail?.slug,
          pathname: location.pathname,
          activePushSlug: readActiveConsumerPushSlug(),
        });
        if (!targetSlug) return;

        const status = await getConsumerNativePushStatus(targetSlug);
        if (
          !shouldShowProvisionalToFullUpgradePrompt({
            platform: Capacitor.getPlatform(),
            permission: status.permission,
          })
        ) {
          return;
        }

        setSlug(targetSlug);
        setOpen(true);
      })();
    };

    window.addEventListener(CONSUMER_PROVISIONAL_PUSH_ENGAGED_EVENT, onEngaged);
    return () =>
      window.removeEventListener(CONSUMER_PROVISIONAL_PUSH_ENGAGED_EVENT, onEngaged);
  }, [location.pathname]);

  if (!slug) return null;

  return (
    <PushProvisionalUpgradePrompt
      isOpen={open}
      onAccept={() => {
        setOpen(false);
        void acceptProvisionalToFullUpgrade(slug);
      }}
      onDecline={() => setOpen(false)}
    />
  );
}
