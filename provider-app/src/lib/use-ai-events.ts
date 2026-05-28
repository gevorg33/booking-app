import { useEffect, useState, useCallback } from 'react';
import { useOperationalEvents } from './use-operational-events';

type AiEventPayload = {
  summary?: string;
  action?: string;
};

export function useProviderAiEvents(
  businessId: string | undefined,
  onEvent?: (type: string, payload: AiEventPayload) => void,
) {
  const [toast, setToast] = useState<string | null>(null);

  useOperationalEvents(
    businessId,
    useCallback(
      (type: string, payload: unknown) => {
        if (!type.startsWith('ai.')) return;
        const data = (payload ?? {}) as AiEventPayload;
        onEvent?.(type, data);
        setToast(data.summary ?? 'AI update');
      },
      [onEvent],
    ),
  );

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(timer);
  }, [toast]);

  return { toast, clearToast: () => setToast(null) };
}
