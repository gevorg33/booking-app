'use client';

import { useCallback, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { usePathname } from 'next/navigation';
import api from '@/lib/api';
import {
  AI_MUTATION_QUERY_KEYS,
  buildAiRequestContext,
  getAiPageContext,
  type AiPageContext,
} from '@/lib/ai-orchestration';
import type { AiChatMessage, AiCommandResult } from '@/lib/ai-client.types';

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

function shouldInvalidateAfterAi(action?: string, success?: boolean): boolean {
  if (!success || !action) return false;
  const schedule = new Set([
    'fill_unused_slots',
    'apply_schedule',
    'block_schedule',
    'create_direct_schedule',
    'setup_week_schedule',
    'assign_employee_services',
    'optimize_schedule',
    'resolve_conflicts',
    'reassign_cancelled',
    'summarize_utilization',
  ]);
  return (
    action === 'cancel_bookings' ||
    action === 'create_booking' ||
    action === 'create_service' ||
    action === 'create_services' ||
    action === 'reschedule_booking' ||
    schedule.has(action)
  );
}

export function useAiCommand(businessId: string | undefined, sessionContext: SessionContext) {
  const queryClient = useQueryClient();
  const pathname = usePathname();
  const [loading, setLoading] = useState(false);

  const invalidate = useCallback(() => {
    for (const key of AI_MUTATION_QUERY_KEYS) {
      queryClient.invalidateQueries({ queryKey: [key] });
    }
  }, [queryClient]);

  const runCommand = useCallback(
    async (
      prompt: string,
      history: Array<{ role: 'user' | 'assistant'; content: string }>,
      options?: { confirmed?: boolean },
    ) => {
      if (!businessId || !prompt.trim()) return null;
      setLoading(true);
      try {
        const pageCtx = getAiPageContext();
        const { data } = await api.post(`/businesses/${businessId}/ai/command`, {
          prompt: prompt.trim(),
          history,
          confirmed: options?.confirmed === true,
          context: buildAiRequestContext(pathname, sessionContext, pageCtx),
        });
        const result = data.data || data;
        if (shouldInvalidateAfterAi(result.action, result.success)) {
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
