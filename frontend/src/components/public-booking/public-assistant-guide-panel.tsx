'use client';

import { useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { useI18n } from '@/i18n';
import type { AiGuideResponse } from '@/lib/ai-client.types';
import { hasPublicAssistantGuideSteps } from '@/lib/public-assistant-guide.util';

interface PublicAssistantGuidePanelProps {
  guide: AiGuideResponse;
  onNavigate?: (url: string) => void;
}

export function PublicAssistantGuidePanel({
  guide,
  onNavigate,
}: PublicAssistantGuidePanelProps) {
  const { t } = useI18n();
  const [cursor, setCursor] = useState(0);

  if (!hasPublicAssistantGuideSteps(guide)) return null;

  const steps = guide.steps;
  const step = steps[cursor];
  if (!step) return null;

  const atEnd = cursor >= steps.length - 1;
  const stepNavigate = step.navigate;
  const guideNavigate = guide.navigate;
  const navigateTarget = stepNavigate ?? (atEnd ? guideNavigate : undefined);

  return (
    <div className="space-y-3">
      {guide.summary ? (
        <p className="text-[13px] leading-relaxed text-gray-700">{guide.summary}</p>
      ) : null}

      <div className="rounded-xl border border-violet-200 bg-violet-50/70 p-3 space-y-2">
        <p className="text-[10px] uppercase tracking-wide text-violet-700/80">
          {t('ai.guideStepOf', { current: cursor + 1, total: steps.length })}
        </p>
        <p className="text-sm font-medium text-gray-900">{step.title}</p>
        <p className="text-xs leading-relaxed text-gray-600 whitespace-pre-wrap">{step.body}</p>

        <div className="flex flex-wrap gap-2 pt-1">
          {!atEnd ? (
            <button
              type="button"
              onClick={() => setCursor((current) => Math.min(current + 1, steps.length - 1))}
              className="text-xs px-2.5 py-1 rounded-md bg-violet-600 hover:bg-violet-500 text-white flex items-center gap-1"
            >
              {t('ai.guideNextStep')}
              <ChevronRight className="w-3 h-3" />
            </button>
          ) : null}
          {navigateTarget?.path && onNavigate ? (
            <button
              type="button"
              onClick={() => {
                const q = new URLSearchParams(navigateTarget.query ?? {}).toString();
                onNavigate(
                  q ? `/${navigateTarget.path}?${q}` : `/${navigateTarget.path}`,
                );
              }}
              className="text-xs px-2.5 py-1 rounded-md border border-violet-300 bg-white hover:bg-violet-50 text-violet-800"
            >
              {t('ai.guideOpenInApp')}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
