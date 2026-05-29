'use client';

import { initializeApp, getApps } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut,
  type UserCredential,
} from 'firebase/auth';
import { extractSubdomain, getRootDomain } from '@/lib/tenant-host';
import { isPublicGoogleSignInAvailable, publicFirebaseConfig } from '@/lib/firebase-public';

const REDIRECT_SLUG_KEY = 'public-google-auth:redirect-slug';
const REDIRECT_RETURN_PATH_KEY = 'public-google-auth:return-path';

function ensureFirebaseApp() {
  if (!getApps().length) {
    initializeApp(publicFirebaseConfig);
  }
}

export function slugFromBookingPath(pathname = typeof window !== 'undefined' ? window.location.pathname : ''): string | null {
  const match = pathname.match(/\/book\/([^/]+)/);
  return match?.[1] ?? null;
}

export function resolvePublicBookingSlug(fallbackSlug?: string | null): string | null {
  if (fallbackSlug) return fallbackSlug;
  const fromPath = slugFromBookingPath();
  if (fromPath) return fromPath;
  if (typeof window !== 'undefined') {
    return extractSubdomain(window.location.host, getRootDomain());
  }
  return null;
}

function readRedirectSlug(fallbackSlug?: string | null): string | null {
  if (typeof window === 'undefined') return fallbackSlug ?? null;
  return (
    sessionStorage.getItem(REDIRECT_SLUG_KEY) ||
    localStorage.getItem(REDIRECT_SLUG_KEY) ||
    resolvePublicBookingSlug(fallbackSlug)
  );
}

function writeRedirectSlug(slug: string) {
  sessionStorage.setItem(REDIRECT_SLUG_KEY, slug);
  localStorage.setItem(REDIRECT_SLUG_KEY, slug);
}

function clearRedirectState() {
  sessionStorage.removeItem(REDIRECT_SLUG_KEY);
  sessionStorage.removeItem(REDIRECT_RETURN_PATH_KEY);
  localStorage.removeItem(REDIRECT_SLUG_KEY);
  localStorage.removeItem(REDIRECT_RETURN_PATH_KEY);
}

const GOOGLE_SIGN_IN_CANCELLED_CODES = new Set([
  'auth/popup-closed-by-user',
  'auth/cancelled-popup-request',
  'auth/user-cancelled',
]);

export class PublicGoogleSignInCancelledError extends Error {
  constructor() {
    super('Sign-in cancelled');
    this.name = 'PublicGoogleSignInCancelledError';
  }
}

export class PublicGoogleSignInRedirectError extends Error {
  constructor() {
    super('Redirecting to Google sign-in');
    this.name = 'PublicGoogleSignInRedirectError';
  }
}

export function isPublicGoogleSignInCancelled(error: unknown): boolean {
  if (error instanceof PublicGoogleSignInCancelledError) return true;
  if (typeof error !== 'object' || error === null) return false;
  const code = 'code' in error ? String((error as { code?: string }).code) : '';
  return GOOGLE_SIGN_IN_CANCELLED_CODES.has(code);
}

export function isPublicGoogleSignInRedirecting(error: unknown): boolean {
  return error instanceof PublicGoogleSignInRedirectError;
}

function isGooglePopupBlocked(error: unknown): boolean {
  if (typeof error !== 'object' || error === null) return false;
  return (error as { code?: string }).code === 'auth/popup-blocked';
}

/** Safari and most mobile browsers block auth popups — use full-page redirect instead. */
export function prefersGoogleRedirect(): boolean {
  if (typeof navigator === 'undefined') return false;

  const ua = navigator.userAgent;
  if (/iPhone|iPad|iPod|Android/i.test(ua)) return true;

  const isSafari =
    /Safari/i.test(ua) && !/Chrome|Chromium|CriOS|Edg|OPR|FxiOS|Firefox/i.test(ua);
  return isSafari;
}

let redirectResultPromise: Promise<UserCredential | null> | null = null;

function getFirebaseRedirectResultOnce(): Promise<UserCredential | null> {
  if (!redirectResultPromise) {
    ensureFirebaseApp();
    redirectResultPromise = getRedirectResult(getAuth()).catch(() => null);
  }
  return redirectResultPromise;
}

export async function getExistingPublicGoogleIdToken(): Promise<string | null> {
  if (!isPublicGoogleSignInAvailable()) return null;
  ensureFirebaseApp();
  const auth = getAuth();
  if (!auth.currentUser) return null;
  return auth.currentUser.getIdToken();
}

export async function startPublicGoogleSignInRedirect(
  slug: string,
  returnPath?: string,
): Promise<never> {
  ensureFirebaseApp();
  const auth = getAuth();
  writeRedirectSlug(slug);
  if (returnPath) {
    sessionStorage.setItem(REDIRECT_RETURN_PATH_KEY, returnPath);
    localStorage.setItem(REDIRECT_RETURN_PATH_KEY, returnPath);
  }
  await signInWithRedirect(auth, new GoogleAuthProvider());
  throw new PublicGoogleSignInRedirectError();
}

export async function completePublicGoogleSignInRedirect(
  fallbackSlug?: string | null,
): Promise<{
  slug: string;
  idToken: string;
  returnPath: string | null;
} | null> {
  if (!isPublicGoogleSignInAvailable()) return null;

  ensureFirebaseApp();
  const auth = getAuth();
  const slug = readRedirectSlug(fallbackSlug);
  const returnPath =
    sessionStorage.getItem(REDIRECT_RETURN_PATH_KEY) ||
    localStorage.getItem(REDIRECT_RETURN_PATH_KEY);

  const result = await getFirebaseRedirectResultOnce();

  if (result?.user) {
    clearRedirectState();
    const resolvedSlug = slug || resolvePublicBookingSlug(fallbackSlug);
    if (!resolvedSlug) return null;

    const idToken = await result.user.getIdToken();
    if (!idToken) return null;

    return { slug: resolvedSlug, idToken, returnPath };
  }

  // Redirect may have completed but getRedirectResult was already consumed (React Strict Mode).
  if (auth.currentUser && slug) {
    clearRedirectState();
    const idToken = await auth.currentUser.getIdToken();
    if (!idToken) return null;
    return { slug, idToken, returnPath };
  }

  return null;
}

interface GetPublicGoogleIdTokenOptions {
  /** Prefer popup even on Safari — use for explicit sign-in button clicks. */
  forcePopup?: boolean;
  slug?: string;
}

/** Returns a Firebase ID token, reusing an existing Google session when possible. */
export async function getPublicGoogleIdToken(
  options: GetPublicGoogleIdTokenOptions = {},
): Promise<string> {
  if (!isPublicGoogleSignInAvailable()) {
    throw new Error('Google sign-in is not configured');
  }

  ensureFirebaseApp();
  const auth = getAuth();
  const { forcePopup = false, slug } = options;
  const returnPath =
    typeof window !== 'undefined'
      ? `${window.location.pathname}${window.location.search}`
      : undefined;

  if (auth.currentUser) {
    const token = await auth.currentUser.getIdToken();
    if (token) return token;
  }

  // Background token fetch (e.g. review submit) may still redirect on mobile.
  if (!forcePopup && slug && prefersGoogleRedirect()) {
    await startPublicGoogleSignInRedirect(slug, returnPath);
  }

  try {
    const credential = await signInWithPopup(auth, new GoogleAuthProvider());
    const token = await credential.user.getIdToken();
    if (!token) {
      throw new Error('Could not get Google ID token');
    }
    return token;
  } catch (error) {
    if (isPublicGoogleSignInCancelled(error)) {
      throw new PublicGoogleSignInCancelledError();
    }
    if (slug && isGooglePopupBlocked(error)) {
      await startPublicGoogleSignInRedirect(slug, returnPath);
    }
    throw error;
  }
}

export async function signOutPublicGoogle() {
  if (!isPublicGoogleSignInAvailable()) return;
  ensureFirebaseApp();
  const auth = getAuth();
  if (auth.currentUser) {
    await signOut(auth);
  }
  redirectResultPromise = null;
}
