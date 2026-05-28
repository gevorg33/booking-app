'use client';

import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';
import { useAuthStore } from '@/lib/store';
import { useI18n } from '@/i18n';
import { ProviderPushToggle } from '@/components/provider/push-toggle';
import { ProviderInstallPrompt } from '@/components/provider/install-prompt';

export default function ProviderProfilePage() {
  const router = useRouter();
  const { t } = useI18n();
  const { user, business, logout } = useAuthStore();

  return (
    <div className="py-6 space-y-6">
      <header>
        <h1 className="text-2xl font-bold">{t('provider.profileTitle')}</h1>
      </header>

      <div className="card space-y-2">
        <p className="font-semibold text-lg">
          {user?.firstName} {user?.lastName}
        </p>
        <p className="text-sm text-gray-400">{user?.email}</p>
        {business && (
          <p className="text-sm text-gray-500">{business.name}</p>
        )}
      </div>

      <div className="card space-y-3">
        <h2 className="font-semibold">{t('provider.appSection')}</h2>
        <ProviderInstallPrompt />
        <ProviderPushToggle />
        <p className="text-xs text-gray-500">{t('provider.pushHint')}</p>
      </div>

      <div className="space-y-2">
        <button
          type="button"
          className="btn-secondary w-full inline-flex items-center justify-center gap-2 text-red-400"
          onClick={() => {
            logout();
            router.replace('/provider/login');
          }}
        >
          <LogOut className="w-4 h-4" />
          {t('nav.signOut')}
        </button>
      </div>
    </div>
  );
}
