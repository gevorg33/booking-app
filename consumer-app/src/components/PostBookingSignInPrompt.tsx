import { IonButton } from '@ionic/react';
import { useEffect, useRef } from 'react';
import { track } from '../lib/app-analytics.js';
import {
  buildPostBookingSignInCopy,
  markPostBookingSignInPromptShown,
  recordPostBookingSignInDecision,
  resolveGuestAccountMergeHint,
  resolvePostBookingSignInAnalyticsProps,
} from '../lib/post-booking-sign-in.util.js';
import { isAppleSignInAvailable } from '../services/apple-auth.js';
import { isGoogleSignInAvailable } from '../services/google-auth.js';
import type { GuestCheckoutContact } from '../lib/guest-booking.util.js';

export function PostBookingSignInPrompt({
  slug,
  bookingId,
  locale,
  guestContact,
  busy,
  message,
  onSignInWithGoogle,
  onSignInWithApple,
  onSkipped,
}: {
  slug: string;
  bookingId: string;
  locale?: string | null;
  guestContact: GuestCheckoutContact;
  busy: boolean;
  message?: string;
  onSignInWithGoogle: () => void | Promise<void>;
  onSignInWithApple: () => void | Promise<void>;
  onSkipped: () => void;
}) {
  const copy = buildPostBookingSignInCopy(locale);
  const mergeHint = resolveGuestAccountMergeHint(guestContact);
  const trackedShownRef = useRef(false);
  const googleAvailable = isGoogleSignInAvailable();
  const appleAvailable = isAppleSignInAvailable();

  useEffect(() => {
    if (trackedShownRef.current) return;
    trackedShownRef.current = true;
    markPostBookingSignInPromptShown(bookingId);
    track(
      'post_booking_sign_in_shown',
      resolvePostBookingSignInAnalyticsProps({ bookingId }),
    );
  }, [bookingId]);

  return (
    <div
      style={{
        maxWidth: 360,
        margin: '24px auto 0',
        padding: '16px',
        borderRadius: 12,
        background: '#f9fafb',
        textAlign: 'left',
      }}
    >
      <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: 0 }}>{copy.title}</h3>
      <p style={{ color: '#6b7280', fontSize: '0.875rem', marginTop: 8, marginBottom: 8 }}>
        {copy.body}
      </p>
      <p style={{ color: '#374151', fontSize: '0.8125rem', marginBottom: 12 }}>{mergeHint}</p>

      {googleAvailable ? (
        <IonButton expand="block" disabled={busy || !slug} onClick={() => void onSignInWithGoogle()}>
          {busy ? copy.busy : copy.google}
        </IonButton>
      ) : null}

      {appleAvailable ? (
        <IonButton
          expand="block"
          fill="outline"
          className="ion-margin-top"
          disabled={busy || !slug}
          onClick={() => void onSignInWithApple()}
        >
          {copy.apple}
        </IonButton>
      ) : null}

      <IonButton
        expand="block"
        fill="clear"
        className="ion-margin-top"
        disabled={busy}
        onClick={() => {
          recordPostBookingSignInDecision(bookingId, 'skipped');
          track(
            'post_booking_sign_in_skipped',
            resolvePostBookingSignInAnalyticsProps({ bookingId, decision: 'skipped' }),
          );
          onSkipped();
        }}
      >
        {copy.skip}
      </IonButton>

      {message ? <p style={{ color: '#dc2626', fontSize: '0.875rem' }}>{message}</p> : null}
    </div>
  );
}

export function notifyPostBookingSignInCompleted(
  bookingId: string,
  provider: 'google' | 'apple',
): void {
  recordPostBookingSignInDecision(bookingId, 'completed');
  track(
    'post_booking_sign_in_completed',
    resolvePostBookingSignInAnalyticsProps({ bookingId, provider, decision: 'completed' }),
  );
}
