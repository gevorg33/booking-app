'use client';

import { CheckCircle, XCircle, Clock, Loader2, RefreshCw } from 'lucide-react';
import { useI18n } from '@/i18n';

export interface ExecutionTimelineStep {
  stepId: string;
  description?: string;
  status: string;
  error?: string;
  canRetry?: boolean;
}

interface AiExecutionTimelineProps {
  steps: ExecutionTimelineStep[];
  taskId?: string;
  onRetry?: (taskId: string, stepId: string) => void;
  retryingStepId?: string | null;
}

export function AiExecutionTimeline({
  steps,
  taskId,
  onRetry,
  retryingStepId,
}: AiExecutionTimelineProps) {
  const { t } = useI18n();
  if (!steps.length) return null;

  const icon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-3.5 h-3.5 text-green-400" />;
      case 'failed':
        return <XCircle className="w-3.5 h-3.5 text-red-400" />;
      case 'running':
      case 'executing':
        return <Loader2 className="w-3.5 h-3.5 text-violet-400 animate-spin" />;
      default:
        return <Clock className="w-3.5 h-3.5 text-gray-500" />;
    }
  };

  return (
    <div className="mt-2 rounded-lg border border-gray-700 bg-gray-900/60 p-2 space-y-1.5">
      <p className="text-[10px] uppercase tracking-wide text-gray-500">{t('ai.executionTimeline')}</p>
      {steps.map((step) => (
        <div key={step.stepId} className="flex items-start gap-2 text-xs">
          {icon(step.status)}
          <div className="flex-1 min-w-0">
            <p className="text-gray-200 truncate">{step.description || step.stepId}</p>
            {step.error && (
              <p className="text-red-400/90 text-[10px] mt-0.5">{step.error}</p>
            )}
          </div>
          {step.canRetry && taskId && onRetry && (
            <button
              type="button"
              onClick={() => onRetry(taskId, step.stepId)}
              disabled={retryingStepId === step.stepId}
              className="shrink-0 flex items-center gap-1 text-[10px] text-violet-300 hover:text-violet-100 disabled:opacity-50"
            >
              <RefreshCw className={`w-3 h-3 ${retryingStepId === step.stepId ? 'animate-spin' : ''}`} />
              {t('ai.retryStep')}
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
