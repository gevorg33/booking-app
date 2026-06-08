import { useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import { App as CapacitorApp } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import {
  CONSUMER_PUSH_NAVIGATE_EVENT,
  dispatchConsumerPushEffects,
  parseConsumerPushPayload,
} from '../lib/consumer-native-push.util.js';
import { resolveDeepLinkLaunchTarget } from '../lib/deep-link-launch.util.js';

/** Routes push deep links and cold-start URLs into consumer navigation (adopt-4.3). */
export function ConsumerPushBridge() {
  const history = useHistory();

  useEffect(() => {
    const onNavigate = (event: Event) => {
      const path = (event as CustomEvent<{ path?: string }>).detail?.path;
      if (path) history.push(path);
    };

    window.addEventListener(CONSUMER_PUSH_NAVIGATE_EVENT, onNavigate);
    return () =>
      window.removeEventListener(CONSUMER_PUSH_NAVIGATE_EVENT, onNavigate);
  }, [history]);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    const handleUrl = (rawUrl: string) => {
      const launch = resolveDeepLinkLaunchTarget(rawUrl);
      if (launch?.path) {
        history.push(launch.path);
        return;
      }
      dispatchConsumerPushEffects(parseConsumerPushPayload({ url: rawUrl }));
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
  }, [history]);

  return null;
}
