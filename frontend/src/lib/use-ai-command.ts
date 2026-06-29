'use client';

import { useCallback, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { usePathname } from 'next/navigation';
import api from '@/lib/api';
import { shouldInvalidateAfterAi } from '@/lib/ai-command-bar.util';
import {
  buildAiRequestContext,
  getAiPageContext,
  invalidateDashboardQueries,
  type AiPageContext,
} from '@/lib/ai-orchestration';
import type { AiChatMessage, AiCommandResult, AssistantMode } from '@/lib/ai-client.types';

export type { AiChatMessage, AiCommandResult };

export interface AiCommandMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  details?: Record<string, unknown>;
  action?: string;
  success?: boolean;
  timestamp: Date;
}

export interface SessionContext extends Partial<AiPageContext> {
  lastAction?: string | null;
  lastMetric?: string | null;
  availableProviders?: string[];
}

export function useAiCommand(businessId: string | undefined, sessionContext: SessionContext) {
  const queryClient = useQueryClient();
  const pathname = usePathname();
  const [loading, setLoading] = useState(false);

  const invalidate = useCallback(() => {
    invalidateDashboardQueries(queryClient);
  }, [queryClient]);

  const runCommand = useCallback(
    async (
      prompt: string,
      history: Array<{ role: 'user' | 'assistant'; content: string }>,
      options?: { confirmed?: boolean; assistantMode?: AssistantMode },
    ) => {
      if (!businessId || !prompt.trim()) return null;
      setLoading(true);
      try {
        const pageCtx = getAiPageContext();
        const context = buildAiRequestContext(
          pathname,
          sessionContext,
          pageCtx,
          options?.assistantMode ? { assistantMode: options.assistantMode } : {},
        );
        const { data } = await api.post(`/businesses/${businessId}/ai/command`, {
          prompt: prompt.trim(),
          history,
          confirmed: options?.confirmed === true,
          context,
          ...(options?.assistantMode ? { assistantMode: options.assistantMode } : {}),
        });
        const result = data.data || data;
        if (
          shouldInvalidateAfterAi(
            result.action,
            result.success,
            result.details as { requiresExecutionConfirmation?: boolean } | undefined,
          )
        ) {
          invalidate();
        }
        return result;
      } finally {
        setLoading(false);
      }
    },
    [businessId, pathname, sessionContext, invalidate],
  );

  const approveTask = useCallback(
    async (taskId: string) => {
      if (!businessId) return null;
      const { data } = await api.post(
        `/businesses/${businessId}/ai/command/tasks/${taskId}/approve`,
      );
      const result = data.data || data;
      if (result.success) invalidate();
      return result;
    },
    [businessId, invalidate],
  );

  const retryStep = useCallback(
    async (taskId: string, stepId: string) => {
      if (!businessId) return null;
      const { data } = await api.post(
        `/businesses/${businessId}/ai/command/tasks/${taskId}/steps/${stepId}/retry`,
      );
      const result = data.data || data;
      if (result.success) invalidate();
      return result;
    },
    [businessId, invalidate],
  );

  return { loading, runCommand, approveTask, retryStep, invalidate };
}
