import { useCallback, useState } from 'react';
import { setCustomerSession } from '../lib/customer-auth.js';
import { getOrCreateAnonId, track } from '../lib/app-analytics.js';
import {
  clearPendingReferralCode,
  markReferralAttachedForConversion,
  resolvePendingReferralForClaim,
} from '../lib/consumer-referral.util.js';
import {
  isValidConsumerPhone,
  normalizeConsumerPhone,
  sanitizeSmsOtpCode,
} from '../lib/phone-auth.util.js';
import { claimReferralCode, loginWithApple, loginWithGoogle, loginWithPhone } from '../services/public-api.js';
import type { PublicCustomerProfile } from '../lib/types.js';

export type OneTapSignInProvider = 'google' | 'apple' | 'phone';

export interface OneTapSignInResult {
  token: string;
  customer: PublicCustomerProfile;
  provider: OneTapSignInProvider;
}

export function useConsumerOneTapSignIn(
  slug: string | undefined,
  options?: {
    onSuccess?: (result: OneTapSignInResult) => void;
    trackSignedIn?: boolean;
  },
) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [verificationId, setVerificationId] = useState('');
  const [phoneStep, setPhoneStep] = useState<'phone' | 'code'>('phone');

  const finishSession = useCallback(
    (provider: OneTapSignInProvider, token: string, customer: PublicCustomerProfile) => {
      if (!slug) return;
      setCustomerSession(slug, token, customer);
      if (options?.trackSignedIn !== false) {
        track('signed_in');
      }
      void (async () => {
        const pendingCode = resolvePendingReferralForClaim(slug);
        if (pendingCode) {
          try {
            const result = await claimReferralCode(slug, pendingCode);
            if (result.attached) {
              clearPendingReferralCode(slug);
              markReferralAttachedForConversion(slug);
            }
          } catch {
            /* keep pending code for a later retry */
          }
        }
        options?.onSuccess?.({ token, customer, provider });
      })();
    },
    [options, slug],
  );

  const completeSignIn = useCallback(
    async (provider: OneTapSignInProvider, idToken: string) => {
      if (!slug) return;
      const analyticsAnonId = getOrCreateAnonId();
      const result =
        provider === 'apple'
          ? await loginWithApple(slug, idToken, analyticsAnonId)
          : provider === 'phone'
            ? await loginWithPhone(slug, idToken, analyticsAnonId)
            : await loginWithGoogle(slug, idToken, analyticsAnonId);
      finishSession(provider, result.token, result.customer);
      return result;
    },
    [finishSession, slug],
  );

  const signInWithGoogle = useCallback(async () => {
    if (!slug) return;
    setBusy(true);
    setMessage('');
    try {
      const { getGoogleIdToken } = await import('../services/google-auth.js');
      const idToken = await getGoogleIdToken();
      await completeSignIn('google', idToken);
    } catch (err: unknown) {
      setMessage(err instanceof Error ? err.message : 'Sign-in failed');
    } finally {
      setBusy(false);
    }
  }, [completeSignIn, slug]);

  const signInWithApple = useCallback(async () => {
    if (!slug) return;
    setBusy(true);
    setMessage('');
    try {
      const { getAppleIdToken } = await import('../services/apple-auth.js');
      const idToken = await getAppleIdToken();
      await completeSignIn('apple', idToken);
    } catch (err: unknown) {
      setMessage(err instanceof Error ? err.message : 'Sign-in failed');
    } finally {
      setBusy(false);
    }
  }, [completeSignIn, slug]);

  const sendPhoneCode = useCallback(async () => {
    if (!slug) return;
    setBusy(true);
    setMessage('');
    try {
      const normalized = normalizeConsumerPhone(phone);
      if (!isValidConsumerPhone(normalized)) {
        setMessage('Enter a valid phone number with country code.');
        return;
      }
      const { requestPhoneVerificationCode } = await import('../services/phone-auth.js');
      const nextVerificationId = await requestPhoneVerificationCode(normalized);
      setVerificationId(nextVerificationId);
      setPhoneStep('code');
    } catch (err: unknown) {
      setMessage(err instanceof Error ? err.message : 'Could not send verification code');
    } finally {
      setBusy(false);
    }
  }, [phone, slug]);

  const verifyPhoneCode = useCallback(async () => {
    if (!slug || !verificationId) return;
    setBusy(true);
    setMessage('');
    try {
      const { confirmPhoneVerificationCode } = await import('../services/phone-auth.js');
      const idToken = await confirmPhoneVerificationCode(verificationId, otp);
      await completeSignIn('phone', idToken);
    } catch (err: unknown) {
      setMessage(err instanceof Error ? err.message : 'Verification failed');
    } finally {
      setBusy(false);
    }
  }, [completeSignIn, otp, slug, verificationId]);

  return {
    busy,
    message,
    phone,
    setPhone,
    otp,
    setOtp,
    phoneStep,
    setPhoneStep,
    setVerificationId,
    completeSignIn,
    signInWithGoogle,
    signInWithApple,
    sendPhoneCode,
    verifyPhoneCode,
    sanitizeSmsOtpCode,
  };
}
