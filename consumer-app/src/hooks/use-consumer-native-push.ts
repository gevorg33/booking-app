import { useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { getCustomerToken } from '../lib/customer-auth.js';
import {
  isFcmBuild,
  registerPushReachability,
  syncConsumerNativePushToken,
} from '../services/native-push.js';

/** Sync FCM token when a signed-in customer opens a tenant shell (adopt-4.1.clinic + n99-4). */
export function useConsumerNativePush(slug: string): void {
  useEffect(() => {
    if (!slug || !Capacitor.isNativePlatform() || !isFcmBuild()) return;
    if (!getCustomerToken(slug)) return;
    void registerPushReachability(slug).then(() => syncConsumerNativePushToken(slug));
  }, [slug]);
}
