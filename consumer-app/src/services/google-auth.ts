import { Capacitor } from '@capacitor/core';
import { FirebaseAuthentication } from '@capacitor-firebase/authentication';
import { initializeApp, getApps } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { firebaseConfig, isFirebaseConfigured } from './firebase.js';

function ensureFirebaseApp() {
  if (!getApps().length) {
    initializeApp(firebaseConfig);
  }
}

export function isGoogleSignInAvailable(): boolean {
  return isFirebaseConfigured();
}

export async function getGoogleIdToken(): Promise<string> {
  if (!isFirebaseConfigured()) {
    throw new Error('Google sign-in is not configured in this build');
  }

  ensureFirebaseApp();

  if (Capacitor.isNativePlatform()) {
    const result = await FirebaseAuthentication.signInWithGoogle();
    if (!result.user) {
      throw new Error('Google sign-in was cancelled');
    }
    const { token } = await FirebaseAuthentication.getIdToken({ forceRefresh: true });
    if (!token) throw new Error('Could not get Google ID token');
    return token;
  }

  const auth = getAuth();
  const credential = await signInWithPopup(auth, new GoogleAuthProvider());
  return credential.user.getIdToken();
}
