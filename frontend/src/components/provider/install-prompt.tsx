'use client';

import { useEffect, useState } from 'react';
import { Download } from 'lucide-react';
import { useI18n } from '@/i18n';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function ProviderInstallPrompt() {
  const { t } = useI18n();
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    if (window.matchMedia('(display-mode: standalone)').matches) {
      queueMicrotask(() => setInstalled(true));
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  if (installed || !deferred) return null;

  return (
    <button
      type="button"
      className="btn-primary w-full inline-flex items-center justify-center gap-2"
      onClick={() => {
        void deferred.prompt();
        setDeferred(null);
      }}
    >
      <Download className="w-4 h-4" />
      {t('provider.installApp')}
    </button>
  );
}
