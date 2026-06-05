'use client';

import { useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { useI18n } from '@/i18n';
import type { PlanDiffStep } from '@/components/ai-agent-workspaces';

export interface WizardStepView extends PlanDiffStep {
  index: number;
  status: 'pending' | 'current' | 'done';
}

interface AiCommandWizardProps {
  steps: WizardStepView[];
  onApprove: () => void;
  approving?: boolean;
}

export function AiCommandWizard({ steps, onApprove, approving }: AiCommandWizardProps) {
  const { t } = useI18n();
  const [cursor, setCursor] = useState(0);
  const step = steps[cursor];
  if (!step) return null;

  const atEnd = cursor >= steps.length - 1;

  return (
    <div className="mt-2 rounded-lg border border-violet-700/40 bg-violet-950/20 p-3 space-y-2">
      <p className="text-[10px] uppercase tracking-wide text-violet-300/80">
        {t('ai.wizardTitle')} · {t('ai.wizardStepOf', { current: cursor + 1, total: steps.length })}
      </p>
      <p className="text-sm font-medium text-gray-100">{step.description}</p>
      <p className="text-xs text-gray-400">{step.impact}</p>
      <div className="flex flex-wrap gap-1">
        {steps.map((s, i) => (
          <span
            key={s.id}
            className={`h-1.5 flex-1 min-w-[2rem] rounded-full ${
              i < cursor ? 'bg-violet-500' : i === cursor ? 'bg-violet-300' : 'bg-gray-700'
            }`}
          />
        ))}
      </div>
      <div className="flex gap-2 pt-1">
        {!atEnd ? (
          <button
            type="button"
            onClick={() => setCursor((c) => Math.min(c + 1, steps.length - 1))}
            className="text-xs px-2.5 py-1 rounded-md bg-violet-600 hover:bg-violet-500 text-white flex items-center gap-1"
          >
            {t('ai.wizardNext')}
            <ChevronRight className="w-3 h-3" />
          </button>
        ) : (
          <button
            type="button"
            onClick={onApprove}
            disabled={approving}
            className="text-xs px-2.5 py-1 rounded-md bg-violet-600 hover:bg-violet-500 text-white disabled:opacity-50"
          >
            {approving ? t('ai.executing') : t('ai.wizardApproveAll')}
          </button>
        )}
      </div>
    </div>
  );
}
