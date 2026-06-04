'use client';

import { useState } from 'react';
import {
  Brain,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  AlertTriangle,
  Play,
  RefreshCw,
  Undo2,
} from 'lucide-react';
import { useAuthStore } from '@/lib/store';
import api from '@/lib/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useI18n } from '@/i18n';
import { confirmDialog } from '@/lib/app-dialog';
import { AI_MUTATION_QUERY_KEYS } from '@/lib/ai-orchestration';
import {
  PlanDiffPreview,
  ConflictResolutionWorkspace,
  CancellationRecoveryBoard,
} from '@/components/ai-agent-workspaces';
import { AiAutopilotSettings } from '@/components/ai-autopilot-settings';
import { AiAuditLog } from '@/components/ai-audit-log';

function invalidateAiMutations(queryClient: ReturnType<typeof useQueryClient>) {
  for (const key of AI_MUTATION_QUERY_KEYS) {
    queryClient.invalidateQueries({ queryKey: [key] });
  }
}

function getStatusConfig(status: string) {
  switch (status) {
    case 'completed': return { Icon: CheckCircle, color: 'text-green-400' };
    case 'rejected': return { Icon: XCircle, color: 'text-red-400' };
    case 'failed': return { Icon: AlertTriangle, color: 'text-red-400' };
    case 'validated': return { Icon: CheckCircle, color: 'text-blue-400' };
    case 'executing':
    case 'pending_validation': return { Icon: Loader2, color: 'text-yellow-400' };
    default: return { Icon: Clock, color: 'text-gray-400' };
  }
}

export default function AiOpsPage() {
  const { t } = useI18n();
  const { business } = useAuthStore();
  const queryClient = useQueryClient();
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);
  const [applyingFixId, setApplyingFixId] = useState<string | null>(null);
  const [undoMessage, setUndoMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null,
  );

  const { data: undoPreview, isLoading: undoPreviewLoading } = useQuery({
    queryKey: ['agent-tasks-undo-preview', business?.id],
    queryFn: async () => {
      if (!business?.id) return null;
      const { data } = await api.get(`/businesses/${business.id}/agents/tasks/undo-latest/preview`);
      return data.data ?? data;
    },
    enabled: !!business?.id,
    refetchInterval: 5000,
  });

  const { data: tasks, isLoading } = useQuery({
    queryKey: ['agent-tasks', business?.id],
    queryFn: async () => {
      if (!business?.id) return [];
      const { data } = await api.get(`/businesses/${business.id}/agents/tasks`);
      return data.data || data || [];
    },
    enabled: !!business?.id,
    refetchInterval: 5000,
  });

  const approveMutation = useMutation({
    mutationFn: async (taskId: string) => {
      const res = await api.post(`/businesses/${business!.id}/ai/command/tasks/${taskId}/approve`);
      return res.data?.data ?? res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agent-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['agent-tasks-pending'] });
      invalidateAiMutations(queryClient);
    },
  });

  const previewMutation = useMutation({
    mutationFn: async (taskId: string) => {
      const res = await api.get(`/businesses/${business!.id}/agents/tasks/${taskId}/preview`);
      return res.data?.data ?? res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agent-tasks'] });
    },
  });

  const rebookAllMutation = useMutation({
    mutationFn: async (taskId: string) => {
      const res = await api.post(`/businesses/${business!.id}/agents/tasks/${taskId}/rebook-all`);
      return res.data?.data ?? res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agent-tasks'] });
      invalidateAiMutations(queryClient);
    },
  });

  const undoLatestMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post(`/businesses/${business!.id}/agents/tasks/undo-latest`);
      return res.data?.data ?? res.data;
    },
    onSuccess: () => {
      setUndoMessage({ type: 'success', text: t('ai.undoSuccess') });
      queryClient.invalidateQueries({ queryKey: ['agent-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['agent-tasks-undo-preview'] });
      invalidateAiMutations(queryClient);
    },
    onError: (error: any) => {
      const text =
        error?.response?.data?.message ??
        error?.response?.data?.error ??
        t('ai.undoFailed');
      setUndoMessage({ type: 'error', text: Array.isArray(text) ? text.join(', ') : String(text) });
    },
  });

  const applyFix = async (
    resolutionId: string,
    fix: { type: string; bookingId: string; startTime: string } | null | undefined,
  ) => {
    if (!business?.id || !fix || fix.type !== 'reschedule_booking') return;
    setApplyingFixId(resolutionId);
    try {
      await api.put(`/businesses/${business.id}/bookings/${fix.bookingId}`, {
        startTime: fix.startTime,
      });
      invalidateAiMutations(queryClient);
    } finally {
      setApplyingFixId(null);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">{t('ai.opsTitle')}</h1>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-4">
        <h2 className="text-lg font-semibold">{t('ai.tasksSection')}</h2>
        <div className="flex flex-col items-stretch sm:items-end gap-1">
          <button
            type="button"
            onClick={async () => {
              if (!undoPreview?.undoable) return;
              const label = t('ai.undoLatestConfirm').replace('{intent}', undoPreview.intent);
              if (!(await confirmDialog({ message: label, destructive: true }))) return;
              setUndoMessage(null);
              undoLatestMutation.mutate();
            }}
            disabled={
              !undoPreview?.undoable || undoLatestMutation.isPending || undoPreviewLoading
            }
            className="btn-secondary text-sm flex items-center justify-center gap-2 disabled:opacity-50"
            title={undoPreview?.undoable ? undoPreview.intent : undoPreview?.reason ?? t('ai.undoLatestNone')}
          >
            {undoLatestMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Undo2 className="w-4 h-4" />
            )}
            {undoLatestMutation.isPending ? t('ai.undoing') : t('ai.undoLatest')}
          </button>
          <p className="text-xs text-gray-500 text-right max-w-sm">
            {undoPreview?.undoable
              ? undoPreview.intent
              : undoPreview?.reason ?? t('ai.undoLatestNone')}
          </p>
        </div>
      </div>
      {undoMessage && (
        <div
          className={`mb-4 rounded-lg border px-4 py-3 text-sm ${
            undoMessage.type === 'success'
              ? 'border-green-800 bg-green-950/40 text-green-300'
              : 'border-red-800 bg-red-950/40 text-red-300'
          }`}
        >
          {undoMessage.text}
        </div>
      )}
      <div className="space-y-3">
        {isLoading ? (
          <div className="card text-center py-8 text-gray-500">{t('ai.loadingTasks')}</div>
        ) : !tasks || tasks.length === 0 ? (
          <div className="card text-center py-8">
            <Brain className="w-10 h-10 text-gray-600 mx-auto mb-2" />
            <p className="text-gray-400">{t('ai.tasksEmptyTitle')}</p>
            <p className="text-gray-500 text-sm">{t('ai.tasksEmptyBody')}</p>
          </div>
        ) : (
          tasks.map((task: any) => {
            const { Icon: StatusIcon, color } = getStatusConfig(task.status);
            const preview = task.result?.preview;
            const planDiff = preview?.planDiff ?? task.plan?.steps?.map((s: any) => ({
              id: s.id,
              action: s.action,
              description: s.description,
              impact: s.estimatedImpact ?? s.description,
              estimatedImpact: s.estimatedImpact,
            }));
            const expanded = expandedTaskId === task.id;

            return (
              <div key={task.id} className="card">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <StatusIcon
                      className={`w-5 h-5 ${color} mt-0.5 shrink-0 ${
                        task.status === 'executing' ? 'animate-spin' : ''
                      }`}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="font-medium">{task.intent}</p>
                      <p className="text-sm text-gray-400 mt-0.5">
                        {task.agentType?.replace(/_/g, ' ')} · {task.status?.replace(/_/g, ' ')}
                      </p>
                      {task.plan && (
                        <p className="mt-1 text-xs text-gray-500">
                          {t('ai.taskMeta')
                            .replace('{steps}', String(task.plan.steps?.length ?? 0))
                            .replace('{risk}', task.plan.riskAssessment?.level ?? 'unknown')}
                        </p>
                      )}
                      {task.error && <p className="text-sm text-red-400 mt-1">{task.error}</p>}
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 shrink-0">
                    {(task.status === 'validated' || task.status === 'requires_approval') && (
                      <button
                        onClick={() => approveMutation.mutate(task.id)}
                        disabled={approveMutation.isPending}
                        className="btn-primary text-sm flex items-center gap-1"
                      >
                        <Play className="w-3 h-3" /> {t('ai.approve')}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        const next = expanded ? null : task.id;
                        setExpandedTaskId(next);
                        if (next && !preview) previewMutation.mutate(task.id);
                      }}
                      className="text-xs text-gray-400 hover:text-gray-200 flex items-center gap-1"
                    >
                      <RefreshCw className={`w-3 h-3 ${previewMutation.isPending && expanded ? 'animate-spin' : ''}`} />
                      {expanded ? t('ai.hide') : t('ai.preview')}
                    </button>
                  </div>
                </div>

                {expanded && (
                  <div className="mt-4 space-y-4 border-t border-gray-800 pt-4">
                    {planDiff && (
                      <PlanDiffPreview
                        steps={planDiff}
                        policyPreview={preview?.policyPreview ?? task.result?.policyPreview}
                      />
                    )}

                    {preview?.conflictResolution && (
                      <ConflictResolutionWorkspace
                        data={preview.conflictResolution}
                        onApplyFix={applyFix}
                        applyingId={applyingFixId}
                      />
                    )}

                    {preview?.cancellationRecovery && (
                      <CancellationRecoveryBoard
                        data={preview.cancellationRecovery}
                        onRebookAll={() => rebookAllMutation.mutate(task.id)}
                        rebooking={rebookAllMutation.isPending}
                      />
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        <AiAutopilotSettings />
        <AiAuditLog />
      </div>
    </div>
  );
}
