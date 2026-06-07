import { useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { getCustomerToken } from '../lib/customer-auth.js';
import { isFcmBuild, syncConsumerNativePushToken } from '../services/native-push.js';

/** Sync FCM token when a signed-in customer opens a tenant shell (adopt-4.1.clinic). */
export function useConsumerNativePush(slug: string): void {
  useEffect(() => {
    if (!slug || !Capacitor.isNativePlatform() || !isFcmBuild()) return;
    if (!getCustomerToken(slug)) return;
    void syncConsumerNativePushToken(slug);
  }, [slug]);
}
