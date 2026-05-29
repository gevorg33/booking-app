import type { FirebaseOptions } from 'firebase/app';

const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

/** Firebase auth domain is never localhost — use `{projectId}.firebaseapp.com` from the console. */
export const publicFirebaseConfig: FirebaseOptions = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain:
    process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ||
    (projectId ? `${projectId}.firebaseapp.com` : undefined),
  projectId,
  storageBucket:
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ||
    (projectId ? `${projectId}.appspot.com` : undefined),
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

export function isPublicGoogleSignInAvailable(): boolean {
  return Boolean(
    publicFirebaseConfig.apiKey && publicFirebaseConfig.projectId && publicFirebaseConfig.appId,
  );
}
