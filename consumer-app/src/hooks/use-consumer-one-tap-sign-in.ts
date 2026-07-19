import { useCallback, useState } from 'react';
import { getOrCreateAnonId, track } from '../lib/app-analytics.js';
import { recordActiveTenant, setCustomerSession } from '../lib/customer-auth.js';
import { claimPendingReferralAfterSignIn } from '../lib/consumer-referral.util.js';
import type { ConsumerGoogleSignInErrorCopy } from '../lib/consumer-google-sign-in-error.util.js';
import { resolveConsumerGoogleSignInErrorMessage } from '../lib/consumer-google-sign-in-error.util.js';
import {
  isValidConsumerPhone,
  normalizeConsumerPhone,
  sanitizeSmsOtpCode,
} from '../lib/phone-auth.util.js';
import { claimReferralCode, loginWithGoogle } from '../services/public-api.js';
import { getGoogleIdToken, isGoogleSignInAvailable } from '../services/google-auth.js';
import type { PublicCustomerProfile } from '../lib/types.js';

export type ConsumerSignInProvider = 'google' | 'apple' | 'phone';

export interface ConsumerOneTapSignInResult {
  provider: ConsumerSignInProvider;
  customer: PublicCustomerProfile;
  referralAttached: boolean;
}

export function useConsumerOneTapSignIn(
  slug: string | null | undefined,
  options: {
    copy: ConsumerGoogleSignInErrorCopy;
    onSuccess?: (result: ConsumerOneTapSignInResult) => void;
  },
) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [phoneStep, setPhoneStep] = useState<'phone' | 'otp'>('phone');
  const [verificationId, setVerificationId] = useState('');

  const completeSession = useCallback(
    async (provider: ConsumerSignInProvider, idToken: string) => {
      if (!slug) throw new Error('Salon not loaded');
      const session = await loginWithGoogle(slug, idToken, {
        analyticsAnonId: getOrCreateAnonId(),
      });
      setCustomerSession(slug, session.token, session.customer);
      recordActiveTenant(slug);
      track('signed_in', { provider });

      const referralResult = await claimPendingReferralAfterSignIn(slug, (code) =>
        claimReferralCode(slug, code),
      );

      options.onSuccess?.({
        provider,
        customer: session.customer,
        referralAttached: referralResult?.attached === true,
      });
    },
    [options, slug],
  );

  const signInWithGoogle = useCallback(async () => {
    if (!slug || !isGoogleSignInAvailable()) {
      setMessage(options.copy.loginGoogleNotConfigured);
      return;
    }
    setBusy(true);
    setMessage(null);
    try {
      const idToken = await getGoogleIdToken();
      await completeSession('google', idToken);
    } catch (error) {
      setMessage(resolveConsumerGoogleSignInErrorMessage(error, options.copy));
    } finally {
      setBusy(false);
    }
  }, [completeSession, options.copy, slug]);

  const signInWithApple = useCallback(async () => {
    setMessage('Apple sign-in is not configured in this build.');
  }, []);

  const sendPhoneCode = useCallback(async () => {
    if (!isValidConsumerPhone(phone)) {
      setMessage('Enter a valid phone number.');
      return;
    }
    setMessage('Phone sign-in is not configured in this build.');
    void normalizeConsumerPhone(phone);
  }, [phone]);

  const verifyPhoneCode = useCallback(async () => {
    if (!sanitizeSmsOtpCode(otp)) {
      setMessage('Enter the verification code.');
      return;
    }
    setMessage('Phone sign-in is not configured in this build.');
  }, [otp]);

  return {
    busy,
    message,
    phone,
    setPhone,
    otp,
    setOtp,
    phoneStep,
    setPhoneStep,
    verificationId,
    setVerificationId,
    signInWithGoogle,
    signInWithApple,
    sendPhoneCode,
    verifyPhoneCode,
    sanitizeSmsOtpCode,
  };
}
