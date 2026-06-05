'use client';

import { useCallback } from 'react';
import { toast as sonnerToast } from 'sonner';
import { useOperationalEvents } from '@/lib/use-operational-events';
import { parseAiAlertPayload } from '@/lib/use-ai-events.util';

type AiEventPayload = {
  action?: string;
  summary?: string;
  taskId?: string;
  status?: string;
  success?: boolean;
};

export interface AiEventToast {
  id: string;
  type: 'ai.clarify' | 'ai.task.progress' | 'ai.task.completed' | 'ai.alert';
  message: string;
}

export interface AiAlertPayload {
  alertType: 'conflict' | 'approval' | 'report';
  title: string;
  message: string;
  prompt?: string;
  taskId?: string;
  route?: string;
}

function showAiEvent(event: AiEventToast) {
  if (event.type === 'ai.task.completed') {
    sonnerToast.success(event.message, { duration: 5000 });
    return;
  }
  sonnerToast(event.message, { duration: 5000 });
}

/** Subscribe to live AI WebSocket events for a business. */
export function useAiEvents(
  businessId: string | undefined,
  handlers?: {
    onClarify?: (payload: AiEventPayload) => void;
    onTaskProgress?: (payload: AiEventPayload) => void;
    onTaskCompleted?: (payload: AiEventPayload) => void;
    onAlert?: (payload: AiAlertPayload) => void;
    onToast?: (toast: AiEventToast) => void;
  },
) {
  const pushToast = useCallback(
    (next: AiEventToast) => {
      showAiEvent(next);
      handlers?.onToast?.(next);
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
          return;
        }

        if (type === 'ai.alert') {
          const alert = parseAiAlertPayload(data as Record<string, unknown>);
          if (!alert) return;
          handlers?.onAlert?.(alert);
          pushToast({
            id: `alert-${alert.taskId ?? Date.now()}`,
            type: 'ai.alert',
            message: alert.title ?? alert.message,
          });
        }
      },
      [handlers, pushToast],
    ),
  );

  return { toasts: [] as AiEventToast[], dismissToast: () => {} };
}
