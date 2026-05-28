'use client';

import { useEffect, useState, useCallback } from 'react';
import { useOperationalEvents } from '@/lib/use-operational-events';

type AiEventPayload = {
  action?: string;
  summary?: string;
  taskId?: string;
  status?: string;
  success?: boolean;
};

export interface AiEventToast {
  id: string;
  type: 'ai.clarify' | 'ai.task.progress' | 'ai.task.completed';
  message: string;
}

/** Subscribe to live AI WebSocket events for a business. */
export function useAiEvents(
  businessId: string | undefined,
  handlers?: {
    onClarify?: (payload: AiEventPayload) => void;
    onTaskProgress?: (payload: AiEventPayload) => void;
    onTaskCompleted?: (payload: AiEventPayload) => void;
    onToast?: (toast: AiEventToast) => void;
  },
) {
  const [toasts, setToasts] = useState<AiEventToast[]>([]);

  const pushToast = useCallback(
    (toast: AiEventToast) => {
      setToasts((prev) => [...prev.slice(-2), toast]);
      handlers?.onToast?.(toast);
    },
    [handlers],
  );

  useOperationalEvents(
    businessId,
    useCallback(
      (type: string, payload: unknown) => {
        const data = (payload ?? {}) as AiEventPayload;

        if (type === 'ai.clarify') {
          handlers?.onClarify?.(data);
          pushToast({
            id: `clarify-${Date.now()}`,
            type: 'ai.clarify',
            message: data.summary ?? 'AI needs more information',
          });
          return;
        }

        if (type === 'ai.task.progress') {
          handlers?.onTaskProgress?.(data);
          pushToast({
            id: `progress-${data.taskId ?? Date.now()}`,
            type: 'ai.task.progress',
            message: data.summary ?? 'AI plan ready for review',
          });
          return;
        }

        if (type === 'ai.task.completed') {
          handlers?.onTaskCompleted?.(data);
          pushToast({
            id: `done-${data.taskId ?? Date.now()}`,
            type: 'ai.task.completed',
            message: data.summary ?? 'AI task completed',
          });
        }
      },
      [handlers, pushToast],
    ),
  );

  useEffect(() => {
    if (toasts.length === 0) return;
    const timer = setTimeout(() => setToasts((prev) => prev.slice(1)), 5000);
    return () => clearTimeout(timer);
  }, [toasts]);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return { toasts, dismissToast };
}
