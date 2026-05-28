'use client';

import { useEffect, useState } from 'react';
import { Bell, BellOff, Loader2 } from 'lucide-react';
import api from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { useI18n } from '@/i18n';
import { getCapacitorPlatform, isCapacitorNative } from '@/lib/capacitor';

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; ++i) arr[i] = raw.charCodeAt(i);
  return arr;
}

async function registerNativePush(businessId: string): Promise<'ok' | 'denied' | 'timeout' | 'error'> {
  const { PushNotifications } = await import('@capacitor/push-notifications');
  const platform = await getCapacitorPlatform();
  if (platform !== 'ios' && platform !== 'android') return 'error';

  const perm = await PushNotifications.requestPermissions();
  if (perm.receive !== 'granted') return 'denied';

  const result = await Promise.race<
    'ok' | 'error' | 'timeout'
  >([
    new Promise<'ok' | 'error'>((resolve) => {
      void (async () => {
        try {
          const regHandler = await PushNotifications.addListener('registration', async (token) => {
            await regHandler.remove();
            await errHandler.remove();
            try {
              await api.post(`/businesses/${businessId}/provider/push/register-native`, {
                token: token.value,
                platform,
              });
              resolve('ok');
            } catch {
              resolve('error');
            }
          });

          const errHandler = await PushNotifications.addListener('registrationError', async () => {
            await regHandler.remove();
            await errHandler.remove();
            resolve('error');
          });

          await PushNotifications.register();
        } catch {
          resolve('error');
        }
      })();
    }),
    new Promise<'timeout'>((resolve) => {
      window.setTimeout(() => resolve('timeout'), 12_000);
    }),
  ]);

  return result;
}

async function registerWebPush(businessId: string): Promise<boolean> {
  const perm = await Notification.requestPermission();
  if (perm !== 'granted') return false;

  const reg = await navigator.serviceWorker.ready;
  const { data } = await api.get(`/businesses/${businessId}/provider/push/vapid-public-key`);
  const payload = (data as { data?: { publicKey?: string } })?.data ?? data;
  const publicKey = (payload as { publicKey?: string }).publicKey;
  if (!publicKey) return false;

  const sub = await reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(publicKey),
  });
  const json = sub.toJSON();
  await api.post(`/businesses/${businessId}/provider/push/subscribe`, {
    endpoint: json.endpoint,
    keys: json.keys,
  });
  return true;
}

export function ProviderPushToggle() {
  const { t } = useI18n();
  const { business } = useAuthStore();
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(false);
  const [supported, setSupported] = useState(false);
  const [native, setNative] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const cap = isCapacitorNative();
    setNative(cap);
    setSupported(
      cap ||
        (typeof window !== 'undefined' &&
          'serviceWorker' in navigator &&
          'PushManager' in window &&
          'Notification' in window),
    );
  }, []);

  const subscribe = async () => {
    if (!business?.id) return;
    setLoading(true);
    setError('');
    try {
      if (native) {
        const result = await registerNativePush(business.id);
        if (result === 'ok') {
          setEnabled(true);
        } else if (result === 'denied') {
          setError(t('provider.pushDenied'));
        } else if (result === 'timeout') {
          setError(t('provider.pushSimulatorHint'));
        } else {
          setError(t('provider.pushSetupFailed'));
        }
      } else {
        const ok = await registerWebPush(business.id);
        if (ok) setEnabled(true);
        else setError(t('provider.pushSetupFailed'));
      }
    } catch {
      setError(t('provider.pushSetupFailed'));
    } finally {
      setLoading(false);
    }
  };

  if (!supported) {
    return <p className="text-sm text-gray-500">{t('provider.pushUnsupported')}</p>;
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={() => void subscribe()}
        disabled={loading || enabled}
        className="btn-secondary w-full inline-flex items-center justify-center gap-2"
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : enabled ? (
          <Bell className="w-4 h-4 text-emerald-400" />
        ) : (
          <BellOff className="w-4 h-4" />
        )}
        {enabled ? t('provider.pushEnabled') : t('provider.enablePush')}
      </button>
      {native && !error && (
        <p className="text-xs text-gray-500">{t('provider.nativePushHint')}</p>
      )}
      {!native && !error && (
        <p className="text-xs text-gray-500">{t('provider.pushHint')}</p>
      )}
      {error && <p className="text-xs text-amber-400">{error}</p>}
    </div>
  );
}
