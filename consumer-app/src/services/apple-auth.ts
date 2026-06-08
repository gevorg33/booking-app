import { Capacitor } from '@capacitor/core';
import { FirebaseAuthentication } from '@capacitor-firebase/authentication';
import { initializeApp, getApps } from 'firebase/app';
import { getAuth, OAuthProvider, signInWithPopup } from 'firebase/auth';
import { firebaseConfig, isFirebaseConfigured } from './firebase.js';

function ensureFirebaseApp() {
  if (!getApps().length) {
    initializeApp(firebaseConfig);
  }
}

export function isAppleSignInAvailable(): boolean {
  if (!isFirebaseConfigured()) return false;
  if (Capacitor.isNativePlatform()) {
    return Capacitor.getPlatform() === 'ios';
  }
  return true;
}

export async function getAppleIdToken(): Promise<string> {
  if (!isFirebaseConfigured()) {
    throw new Error('Apple sign-in is not configured in this build');
  }

  ensureFirebaseApp();

  if (Capacitor.isNativePlatform()) {
    const result = await FirebaseAuthentication.signInWithApple();
    if (!result.user) {
      throw new Error('Apple sign-in was cancelled');
    }
    const { token } = await FirebaseAuthentication.getIdToken({ forceRefresh: true });
    if (!token) throw new Error('Could not get Apple ID token');
    return token;
  }

  const auth = getAuth();
  const provider = new OAuthProvider('apple.com');
  provider.addScope('email');
  provider.addScope('name');
  const credential = await signInWithPopup(auth, provider);
  return credential.user.getIdToken();
}
