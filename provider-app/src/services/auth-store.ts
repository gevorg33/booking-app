import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { clearStoredLocale } from '../i18n/locale-storage';

export interface BusinessSummary {
  id: string;
  name: string;
  slug: string;
  membershipRole?: string;
  employee: { id: string; name: string } | null;
}

interface AuthState {
  user: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    locale?: string;
  } | null;
  business: {
    id: string;
    name: string;
    slug?: string;
    membershipRole?: string;
    locale?: string;
    defaultLocale?: string;
    enabledLocales?: string[];
    dateFormat?: string;
    timeFormat?: string;
    currency?: string;
  } | null;
  employee: { id: string; name: string } | null;
  businesses: BusinessSummary[];
  token: string | null;
  isAuthenticated: boolean;
  setAuth: (
    user: AuthState['user'],
    business: AuthState['business'],
    token: string,
    extras?: { businesses?: BusinessSummary[]; employee?: { id: string; name: string } | null },
  ) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      business: null,
      employee: null,
      businesses: [],
      token: null,
      isAuthenticated: false,
      setAuth: (user, business, token, extras) => {
        localStorage.setItem('token', token);
        set({
          user,
          business,
          token,
          isAuthenticated: true,
          employee: extras?.employee ?? null,
          businesses: extras?.businesses ?? [],
        });
      },
      logout: () => {
        localStorage.removeItem('token');
        clearStoredLocale();
        set({
          user: null,
          business: null,
          employee: null,
          businesses: [],
          token: null,
          isAuthenticated: false,
        });
      },
    }),
    { name: 'provider-auth-store' },
  ),
);
