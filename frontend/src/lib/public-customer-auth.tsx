'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  getPublicCustomerMe,
  loginPublicCustomer,
  setPublicCustomerToken,
  type PublicCustomerAuthResponse,
  type PublicCustomerProfile,
} from '@/lib/public-api';
import {
  completePublicGoogleSignInRedirect,
  getExistingPublicGoogleIdToken,
  getPublicGoogleIdToken,
  isPublicGoogleSignInRedirecting,
  signOutPublicGoogle,
} from '@/lib/public-google-auth';
import { readPublicBookingPreferredLocaleForAuth } from '@/components/public-booking/public-booking-language-switcher';
import { isPublicGoogleSignInAvailable } from '@/lib/firebase-public';

const storageKey = (slug: string) => `public-customer:${slug}`;

interface StoredSession {
  token: string;
  customer: PublicCustomerProfile;
}

function isValidSession(session: PublicCustomerAuthResponse | null | undefined): session is PublicCustomerAuthResponse {
  return Boolean(session?.token && session.customer?.id);
}

interface PublicCustomerAuthContextValue {
  slug: string;
  customer: PublicCustomerProfile | null;
  token: string | null;
  loading: boolean;
  signInError: string | null;
  googleEnabled: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => void;
  refreshProfile: () => Promise<void>;
  clearSignInError: () => void;
}

const PublicCustomerAuthContext = createContext<PublicCustomerAuthContextValue | null>(null);

export function PublicCustomerAuthProvider({
  slug,
  children,
}: {
  slug: string;
  children: ReactNode;
}) {
  const [customer, setCustomer] = useState<PublicCustomerProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [signInError, setSignInError] = useState<string | null>(null);
  const googleEnabled = isPublicGoogleSignInAvailable();

  const persistSession = useCallback(
    (session: StoredSession | null) => {
      if (session) {
        if (!session.token || !session.customer?.id) {
          setSignInError('Sign-in response was incomplete. Please try again.');
          return;
        }
        localStorage.setItem(storageKey(slug), JSON.stringify(session));
        setToken(session.token);
        setCustomer(session.customer);
        setPublicCustomerToken(slug, session.token);
        setSignInError(null);
      } else {
        localStorage.removeItem(storageKey(slug));
        setToken(null);
        setCustomer(null);
        setPublicCustomerToken(slug, null);
      }
    },
    [slug],
  );

  const loginFromFirebaseToken = useCallback(async (): Promise<PublicCustomerAuthResponse | null> => {
    try {
      const idToken = await getExistingPublicGoogleIdToken();
      if (!idToken) return null;
      const preferredLocale = readPublicBookingPreferredLocaleForAuth() ?? undefined;
      const session = await loginPublicCustomer(slug, idToken, { preferredLocale });
      return isValidSession(session) ? session : null;
    } catch {
      return null;
    }
  }, [slug]);

  const refreshProfile = useCallback(async () => {
    if (!token) return;
    const profile = await getPublicCustomerMe(slug);
    persistSession({ token, customer: profile });
  }, [persistSession, slug, token]);

  const clearSignInError = useCallback(() => setSignInError(null), []);

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      setLoading(true);
      try {
        const redirect = await completePublicGoogleSignInRedirect(slug);
        if (redirect?.slug === slug) {
          const preferredLocale = readPublicBookingPreferredLocaleForAuth() ?? undefined;
          const session = await loginPublicCustomer(slug, redirect.idToken, {
            preferredLocale,
          });
          if (cancelled) return;
          if (isValidSession(session)) {
            persistSession(session);
            if (
              redirect.returnPath &&
              redirect.returnPath !== `${window.location.pathname}${window.location.search}`
            ) {
              window.history.replaceState(null, '', redirect.returnPath);
            }
            return;
          }
        }

        const raw = localStorage.getItem(storageKey(slug));
        if (raw) {
          const stored = JSON.parse(raw) as StoredSession;
          if (stored?.token) {
            setPublicCustomerToken(slug, stored.token);
            try {
              const profile = await getPublicCustomerMe(slug);
              if (cancelled) return;
              persistSession({ token: stored.token, customer: profile });
              return;
            } catch {
              const recovered = await loginFromFirebaseToken();
              if (recovered) {
                if (cancelled) return;
                persistSession(recovered);
                return;
              }
              if (!cancelled) persistSession(null);
            }
          }
        }

        const recovered = await loginFromFirebaseToken();
        if (recovered) {
          if (cancelled) return;
          persistSession(recovered);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void bootstrap();
    return () => {
      cancelled = true;
    };
  }, [loginFromFirebaseToken, persistSession, slug]);

  const signInWithGoogle = useCallback(async () => {
    setSignInError(null);
    try {
      const idToken = await getPublicGoogleIdToken({ slug, forcePopup: true });
      const preferredLocale = readPublicBookingPreferredLocaleForAuth() ?? undefined;
      const session = await loginPublicCustomer(slug, idToken, { preferredLocale });
      if (!isValidSession(session)) {
        throw new Error('Sign-in response was incomplete. Please try again.');
      }
      persistSession(session);
    } catch (err) {
      if (!isPublicGoogleSignInRedirecting(err)) {
        const message = err instanceof Error ? err.message : 'Sign-in failed';
        setSignInError(message);
        throw err;
      }
      throw err;
    }
  }, [persistSession, slug]);

  const signOut = useCallback(() => {
    persistSession(null);
    void signOutPublicGoogle();
  }, [persistSession]);

  const value = useMemo(
    () => ({
      slug,
      customer,
      token,
      loading,
      signInError,
      googleEnabled,
      signInWithGoogle,
      signOut,
      refreshProfile,
      clearSignInError,
    }),
    [
      slug,
      customer,
      token,
      loading,
      signInError,
      googleEnabled,
      signInWithGoogle,
      signOut,
      refreshProfile,
      clearSignInError,
    ],
  );

  return (
    <PublicCustomerAuthContext.Provider value={value}>
      {signInError && (
        <div className="fixed bottom-24 left-0 right-0 z-50 px-4 pointer-events-none">
          <div className="max-w-lg mx-auto rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 shadow-lg pointer-events-auto">
            {signInError}
          </div>
        </div>
      )}
      {children}
    </PublicCustomerAuthContext.Provider>
  );
}

export function usePublicCustomerAuth() {
  const ctx = useContext(PublicCustomerAuthContext);
  if (!ctx) {
    throw new Error('usePublicCustomerAuth must be used within PublicCustomerAuthProvider');
  }
  return ctx;
}
