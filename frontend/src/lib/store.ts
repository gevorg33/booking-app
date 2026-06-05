import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AuthResult, BusinessSummary } from '@/lib/auth-types';

type AuthUser = AuthResult['user'];
type AuthBusiness = AuthResult['business'];

interface AuthState {
  user: AuthUser | null;
  business: AuthBusiness | null;
  employee: { id: string; name: string } | null;
  businesses: BusinessSummary[];
  token: string | null;
  isAuthenticated: boolean;
  setAuth: (
    user: AuthUser,
    business: AuthBusiness,
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
        if (typeof window !== 'undefined') {
          localStorage.setItem('token', token);
        }
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
        if (typeof window !== 'undefined') {
          localStorage.removeItem('token');
        }
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
    {
      name: 'auth-store',
      partialize: (state) => ({
        user: state.user,
        business: state.business,
        employee: state.employee,
        businesses: state.businesses,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);
