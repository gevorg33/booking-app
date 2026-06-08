import { Capacitor } from '@capacitor/core';
import { FirebaseAuthentication } from '@capacitor-firebase/authentication';
import {
  isValidConsumerPhone,
  normalizeConsumerPhone,
  sanitizeSmsOtpCode,
} from '../lib/phone-auth.util.js';
import { isFirebaseConfigured } from './firebase.js';

export function isPhoneSignInAvailable(): boolean {
  return isFirebaseConfigured() && Capacitor.isNativePlatform();
}

export async function requestPhoneVerificationCode(phoneNumber: string): Promise<string> {
  if (!isPhoneSignInAvailable()) {
    throw new Error('Phone sign-in is only available in the mobile app');
  }

  const normalized = normalizeConsumerPhone(phoneNumber);
  if (!isValidConsumerPhone(normalized)) {
    throw new Error('Enter a valid phone number with country code');
  }

  return new Promise((resolve, reject) => {
    const cleanups: Array<() => void> = [];
    const teardown = () => {
      for (const cleanup of cleanups) cleanup();
    };

    void FirebaseAuthentication.addListener('phoneCodeSent', (event) => {
      teardown();
      if (!event.verificationId) {
        reject(new Error('Could not start phone verification'));
        return;
      }
      resolve(event.verificationId);
    }).then((handle) => cleanups.push(() => void handle.remove()));

    void FirebaseAuthentication.addListener('phoneVerificationFailed', (event) => {
      teardown();
      reject(new Error(event.message || 'Phone verification failed'));
    }).then((handle) => cleanups.push(() => void handle.remove()));

    void FirebaseAuthentication.signInWithPhoneNumber({ phoneNumber: normalized }).catch((err) => {
      teardown();
      reject(err instanceof Error ? err : new Error('Phone verification failed'));
    });
  });
}

export async function confirmPhoneVerificationCode(
  verificationId: string,
  verificationCode: string,
): Promise<string> {
  if (!isPhoneSignInAvailable()) {
    throw new Error('Phone sign-in is only available in the mobile app');
  }

  const code = sanitizeSmsOtpCode(verificationCode);
  if (!verificationId.trim() || !code) {
    throw new Error('Enter the verification code from your SMS');
  }

  await FirebaseAuthentication.confirmVerificationCode({
    verificationId,
    verificationCode: code,
  });

  const { token } = await FirebaseAuthentication.getIdToken({ forceRefresh: true });
  if (!token) throw new Error('Could not complete phone sign-in');
  return token;
}
