import { useCallback } from 'react';
import { toast as sonnerToast } from 'sonner';
import { useOperationalEvents } from './use-operational-events';

type AiEventPayload = {
  summary?: string;
  action?: string;
};

export function useProviderAiEvents(
  businessId: string | undefined,
  onEvent?: (type: string, payload: AiEventPayload) => void,
) {
  useOperationalEvents(
    businessId,
    useCallback(
      (type: string, payload: unknown) => {
        if (!type.startsWith('ai.')) return;
        const data = (payload ?? {}) as AiEventPayload;
        onEvent?.(type, data);
        const message = data.summary ?? 'AI update';
        if (type === 'ai.task.completed') {
          sonnerToast.success(message, { duration: 4000 });
        } else {
          sonnerToast(message, { duration: 4000 });
        }
      },
      [onEvent],
    ),
  );
}
