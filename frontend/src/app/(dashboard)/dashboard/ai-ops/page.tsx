'use client';

import { useState } from 'react';
import {
  Brain,
  Send,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  AlertTriangle,
  Play,
  RefreshCw,
} from 'lucide-react';
import { useAuthStore } from '@/lib/store';
import api from '@/lib/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useI18n } from '@/i18n';
import { AiPagePanel } from '@/components/ai-page-panel';
import { AI_MUTATION_QUERY_KEYS, AI_PAGE_SUGGESTIONS } from '@/lib/ai-orchestration';
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

const AGENT_TYPES = [
  { value: 'scheduling_optimization', label: 'Schedule Optimization', description: 'Optimize staff schedules and fill gaps' },
  { value: 'cancellation_recovery', label: 'Cancellation Recovery', description: 'Recover and reassign cancelled slots' },
  { value: 'conflict_resolution', label: 'Conflict Resolution', description: 'Detect and resolve scheduling conflicts' },
  { value: 'utilization_optimization', label: 'Utilization Optimization', description: 'Maximize employee utilization' },
];

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
  const [intent, setIntent] = useState('');
  const [agentType, setAgentType] = useState('scheduling_optimization');
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);
  const [applyingFixId, setApplyingFixId] = useState<string | null>(null);

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

  const intentMutation = useMutation({
    mutationFn: async (data: { agentType: string; intent: string }) => {
      const res = await api.post(`/businesses/${business!.id}/agents/intent`, {
        agentType: data.agentType,
        intent: data.intent,
        dateRange: {
          start: new Date().toISOString(),
          end: new Date(Date.now() + 7 * 86400000).toISOString(),
        },
      });
      return res.data?.data ?? res.data;
    },
    onSuccess: (task) => {
      queryClient.invalidateQueries({ queryKey: ['agent-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['agent-tasks-pending'] });
      invalidateAiMutations(queryClient);
      setIntent('');
      if (task?.id) setExpandedTaskId(task.id);
    },
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
        <p className="text-gray-400 text-sm">Express intent and let AI plan optimal operations</p>
      </div>

      <AiPagePanel suggestions={AI_PAGE_SUGGESTIONS['/dashboard/ai-ops']} context={{ route: '/dashboard/ai-ops' }} />

      <div className="card mb-6">
        <div className="flex items-start gap-4 mb-4">
          <Brain className="w-6 h-6 text-blue-400 mt-1 flex-shrink-0" />
          <div className="flex-1">
            <h3 className="font-semibold mb-3">What would you like to optimize?</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
              {AGENT_TYPES.map((a) => (
                <button
                  key={a.value}
                  onClick={() => setAgentType(a.value)}
                  className={`text-left p-3 rounded-lg border text-sm transition-colors ${
                    agentType === a.value
                      ? 'border-blue-500 bg-blue-600/10 text-blue-400'
                      : 'border-gray-700 hover:border-gray-600 text-gray-400'
                  }`}
                >
                  <p className="font-medium text-gray-200">{a.label}</p>
                  <p className="text-xs mt-0.5">{a.description}</p>
                </button>
              ))}
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (intent.trim()) intentMutation.mutate({ agentType, intent });
              }}
              className="flex gap-2"
            >
              <input
                className="input flex-1"
                placeholder="e.g., Fill all empty slots tomorrow, Optimize next week schedule..."
                value={intent}
                onChange={(e) => setIntent(e.target.value)}
              />
              <button
                type="submit"
                disabled={!intent.trim() || intentMutation.isPending}
                className="btn-primary flex items-center gap-2"
              >
                {intentMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                Send
              </button>
            </form>
          </div>
        </div>
      </div>

      <h2 className="text-lg font-semibold mb-4">Agent Tasks</h2>
      <div className="space-y-3">
        {isLoading ? (
          <div className="card text-center py-8 text-gray-500">Loading tasks...</div>
        ) : !tasks || tasks.length === 0 ? (
          <div className="card text-center py-8">
            <Brain className="w-10 h-10 text-gray-600 mx-auto mb-2" />
            <p className="text-gray-400">No agent tasks yet</p>
            <p className="text-gray-500 text-sm">Express an intent above to get started</p>
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
                          {task.plan.steps?.length ?? 0} steps · risk {task.plan.riskAssessment?.level ?? 'unknown'}
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
                        <Play className="w-3 h-3" /> Approve
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
                      {expanded ? 'Hide' : 'Preview'}
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
