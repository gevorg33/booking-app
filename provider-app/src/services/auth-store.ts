import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthState {
  user: { id: string; email: string; firstName?: string; lastName?: string } | null;
  business: { id: string; name: string; slug?: string } | null;
  token: string | null;
  isAuthenticated: boolean;
  setAuth: (
    user: AuthState['user'],
    business: AuthState['business'],
    token: string,
  ) => void;
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
        localStorage.setItem('token', token);
        set({ user, business, token, isAuthenticated: true });
      },
      logout: () => {
        localStorage.removeItem('token');
        set({ user: null, business: null, token: null, isAuthenticated: false });
      },
    }),
    { name: 'provider-auth-store' },
  ),
);
