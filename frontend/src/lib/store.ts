import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthState {
  user: any | null;
  business: any | null;
  token: string | null;
  isAuthenticated: boolean;
  setAuth: (user: any, business: any, token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      business: null,
      token: null,
      isAuthenticated: false,
      setAuth: (user, business, token) => {
        set({ user, business, token, isAuthenticated: true });
      },
      logout: () => {
        set({ user: null, business: null, token: null, isAuthenticated: false });
      },
    }),
    {
      name: 'auth-store',
      partialize: (state) => ({
        user: state.user,
        business: state.business,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);
