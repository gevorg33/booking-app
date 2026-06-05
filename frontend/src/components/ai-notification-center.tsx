'use client';

import { useCallback, useState } from 'react';
import { Bell, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useI18n } from '@/i18n';
import {
  createAiAlert,
  markAlertRead,
  pushAiAlert,
  unreadAlertCount,
  type AiInAppAlert,
} from '@/lib/ai-notification-center';
import { fireOrchestrixRun } from '@/lib/orchestrix-events';
import { useAiEvents } from '@/lib/use-ai-events';
import { useAuthStore } from '@/lib/store';

export function AiNotificationCenter() {
  const { t } = useI18n();
  const router = useRouter();
  const { business } = useAuthStore();
  const [open, setOpen] = useState(false);
  const [alerts, setAlerts] = useState<AiInAppAlert[]>([]);

  const handleAlert = useCallback(
    (payload: {
      alertType: 'conflict' | 'approval' | 'report';
      title: string;
      message: string;
      prompt?: string;
      taskId?: string;
      route?: string;
    }) => {
      setAlerts((prev) => pushAiAlert(prev, createAiAlert(payload)));
    },
    [],
  );

  useAiEvents(business?.id, { onAlert: handleAlert });

  const unread = unreadAlertCount(alerts);

  const dismiss = (id: string) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  };

  const openAlert = (alert: AiInAppAlert) => {
    setAlerts((prev) => markAlertRead(prev, alert.id));
    setOpen(false);
    if (alert.prompt) {
      fireOrchestrixRun(alert.prompt, alert.alertType !== 'approval');
    }
    if (alert.route) router.push(alert.route);
  };

  if (!business) return null;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="relative p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-900 dark:hover:bg-gray-800 dark:hover:text-white"
        aria-label={t('ai.notificationsTitle')}
      >
        <Bell className="w-5 h-5" />
        {unread > 0 && (
          <span className="absolute top-0.5 right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-violet-600 text-[10px] font-bold text-white flex items-center justify-center">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 max-w-[calc(100vw-2rem)] rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-xl z-50">
          <div className="flex items-center justify-between px-3 py-2 border-b border-gray-200 dark:border-gray-800">
            <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              {t('ai.notificationsTitle')}
            </span>
            <button type="button" onClick={() => setOpen(false)} className="p-1 text-gray-500">
              <X className="w-4 h-4" />
            </button>
          </div>
          <ul className="max-h-72 overflow-y-auto p-2 space-y-1">
            {alerts.length === 0 ? (
              <li className="text-xs text-gray-500 px-2 py-4 text-center">{t('ai.notificationsEmpty')}</li>
            ) : (
              alerts.map((alert) => (
                <li key={alert.id}>
                  <button
                    type="button"
                    onClick={() => openAlert(alert)}
                    className={`w-full text-left rounded-lg px-2.5 py-2 text-xs transition-colors ${
                      alert.read
                        ? 'bg-gray-50 dark:bg-gray-800/50 text-gray-500'
                        : 'bg-violet-50 dark:bg-violet-950/30 text-gray-900 dark:text-gray-100'
                    }`}
                  >
                    <p className="font-medium">{alert.title}</p>
                    <p className="mt-0.5 text-gray-500 dark:text-gray-400 line-clamp-2">{alert.message}</p>
                    <p className="mt-1 text-violet-600 dark:text-violet-300">{t('ai.notificationTapResolve')}</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => dismiss(alert.id)}
                    className="sr-only"
                  >
                    dismiss
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
