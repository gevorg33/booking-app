import { useEffect, useState } from 'react';
import { IonButton, IonSpinner, IonText } from '@ionic/react';
import { Capacitor } from '@capacitor/core';
import { useAuthStore } from '../services/auth-store';
import {
  enableNativePush,
  getNativePushStatus,
  isFcmBuild,
  syncNativePushToken,
} from '../services/native-push';

export default function PushToggle() {
  const { business } = useAuthStore();
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const platform = Capacitor.getPlatform();

  useEffect(() => {
    if (!business?.id || !isFcmBuild() || !Capacitor.isNativePlatform()) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    void (async () => {
      try {
        const status = await getNativePushStatus(business.id);
        if (!cancelled) {
          setEnabled(status.registered);
          if (status.permission === 'denied') {
            setError('Notifications are blocked in system settings.');
          }
        }

        await syncNativePushToken(business.id);

        try {
          const updated = await getNativePushStatus(business.id);
          if (!cancelled && updated.registered) setEnabled(true);
        } catch {
          // Keep previous enabled state when server is temporarily unavailable.
        }
      } catch {
        if (!cancelled) setError('Could not load alert status.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [business?.id]);

  if (platform === 'android' && !isFcmBuild()) {
    return (
      <IonText color="medium">
        <p className="booking-meta">
          Rebuild after adding <code>android/app/google-services.json</code>. See FIREBASE_SETUP.md.
        </p>
      </IonText>
    );
  }

  if (platform === 'ios' && !isFcmBuild()) {
    return (
      <IonText color="medium">
        <p className="booking-meta">
          Rebuild after adding <code>ios/App/App/GoogleService-Info.plist</code>. See FIREBASE_SETUP.md.
        </p>
      </IonText>
    );
  }

  const subscribe = async () => {
    if (!business?.id) return;
    setBusy(true);
    setError('');

    try {
      const result = await enableNativePush(business.id);
      if (result === 'ok') {
        setEnabled(true);
      } else if (result === 'denied') {
        setError('Notification permission was denied.');
      } else if (result === 'timeout') {
        setError('Timed out waiting for push token. Check Firebase setup and try again.');
      } else {
        setError('Could not enable alerts. Verify google-services.json and rebuild the app.');
      }
    } catch {
      setError('Push notifications are not available.');
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return <IonSpinner name="crescent" />;
  }

  return (
    <div>
      <IonButton expand="block" onClick={() => void subscribe()} disabled={busy || enabled}>
        {busy ? <IonSpinner name="crescent" /> : enabled ? 'Alerts enabled' : 'Enable booking alerts'}
      </IonButton>
      {error && (
        <IonText color="warning">
          <p className="booking-meta">{error}</p>
        </IonText>
      )}
    </div>
  );
}
