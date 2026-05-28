'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import { ProviderNav } from '@/components/provider/provider-nav';
import { ProviderServiceWorkerRegister } from '@/components/provider/service-worker-register';
import { initCapacitorApp } from '@/lib/capacitor';

export function ProviderAppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { token } = useAuthStore();
  const [mounted, setMounted] = useState(false);
  const isLogin = pathname === '/provider/login';

  useEffect(() => {
    setMounted(true);
    void initCapacitorApp();
  }, []);

  useEffect(() => {
    if (!mounted) return;
    void import('@/lib/capacitor').then(({ hideCapacitorSplashWhenReady }) =>
      hideCapacitorSplashWhenReady(),
    );
    const fallback = window.setTimeout(() => {
      void import('@/lib/capacitor').then(({ hideCapacitorSplashWhenReady }) =>
        hideCapacitorSplashWhenReady(),
      );
    }, 8000);
    return () => window.clearTimeout(fallback);
  }, [mounted]);

  useEffect(() => {
    if (!mounted || isLogin) return;
    if (!token) router.replace('/provider/login');
  }, [mounted, token, isLogin, router]);

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <>
      <ProviderServiceWorkerRegister />
      <div className="min-h-screen bg-gray-950 text-gray-100 pb-20">
        <div className="max-w-lg mx-auto px-4 pt-[env(safe-area-inset-top)]">{children}</div>
        {!isLogin && <ProviderNav />}
      </div>
    </>
  );
}
