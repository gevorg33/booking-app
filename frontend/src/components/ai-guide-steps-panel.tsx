'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronRight, ExternalLink } from 'lucide-react';
import { useI18n } from '@/i18n';
import type { AiGuideRelatedAction, AiGuideResponse } from '@/lib/ai-client.types';
import { buildDashboardGuideTopicUrl } from '@/lib/dashboard-guide-corpus.util';
import {
  buildGuideStepNavigateUrl,
  hasInteractiveGuideSteps,
} from '@/lib/ai-guide-reply.util';

interface AiGuideStepsPanelProps {
  guide: AiGuideResponse;
  onNavigate: (url: string) => void;
  onHandoff?: (related: AiGuideRelatedAction) => void;
}

export function AiGuideStepsPanel({ guide, onNavigate, onHandoff }: AiGuideStepsPanelProps) {
  const { t } = useI18n();
  const [cursor, setCursor] = useState(0);

  if (!hasInteractiveGuideSteps(guide)) return null;

  const steps = guide.steps;
  const step = steps[cursor];
  if (!step) return null;

  const atEnd = cursor >= steps.length - 1;
  const navigateUrl = buildGuideStepNavigateUrl(guide, cursor);
  const fullGuideUrl = guide.topicId ? buildDashboardGuideTopicUrl(guide.topicId) : null;
  const handoffs = guide.relatedActions ?? [];
  const showHandoffs = atEnd && handoffs.length > 0 && onHandoff;

  return (
    <div className="space-y-3">
      {guide.summary ? (
        <p className="text-[13px] leading-relaxed text-gray-200">{guide.summary}</p>
      ) : null}

      <div className="rounded-lg border border-violet-700/40 bg-violet-950/20 p-3 space-y-2">
        <p className="text-[10px] uppercase tracking-wide text-violet-300/80">
          {t('ai.guideStepOf', { current: cursor + 1, total: steps.length })}
        </p>

        <ol className="space-y-1" aria-label={t('ai.guideStepOf', { current: cursor + 1, total: steps.length })}>
          {steps.map((item, index) => {
            const isCurrent = index === cursor;
            const isPast = index < cursor;
            return (
              <li
                key={`${item.title}-${index}`}
                className={`flex gap-2 text-xs ${
                  isCurrent
                    ? 'text-violet-100'
                    : isPast
                      ? 'text-gray-500'
                      : 'text-gray-600'
                }`}
              >
                <span
                  className={`mt-0.5 inline-flex h-4 min-w-[1rem] items-center justify-center rounded-full text-[10px] font-semibold ${
                    isCurrent
                      ? 'bg-violet-600 text-white'
                      : isPast
                        ? 'bg-violet-900/60 text-violet-300'
                        : 'bg-gray-800 text-gray-500'
                  }`}
                >
                  {index + 1}
                </span>
                <span className={isCurrent ? 'font-medium' : ''}>{item.title}</span>
              </li>
            );
          })}
        </ol>

        <p className="text-sm font-medium text-gray-100">{step.title}</p>
        <p className="text-xs leading-relaxed text-gray-400 whitespace-pre-wrap">{step.body}</p>

        <div className="flex flex-wrap gap-1 pt-1">
          {steps.map((item, index) => (
            <span
              key={`progress-${item.title}-${index}`}
              className={`h-1.5 flex-1 min-w-[2rem] rounded-full ${
                index < cursor ? 'bg-violet-500' : index === cursor ? 'bg-violet-300' : 'bg-gray-700'
              }`}
            />
          ))}
        </div>

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
          {navigateUrl ? (
            <button
              type="button"
              onClick={() => onNavigate(navigateUrl)}
              className="text-xs px-2.5 py-1 rounded-md border border-violet-500/40 bg-violet-950/40 hover:bg-violet-900/50 text-violet-100 flex items-center gap-1"
            >
              {t('ai.guideOpenInApp')}
              <ExternalLink className="w-3 h-3" />
            </button>
          ) : null}
          {fullGuideUrl ? (
            <Link
              href={fullGuideUrl}
              className="text-xs px-2.5 py-1 rounded-md border border-gray-600/60 bg-gray-900/60 hover:bg-gray-800/80 text-gray-200"
            >
              {t('ai.guideViewFullTopic')}
            </Link>
          ) : null}
          {showHandoffs
            ? handoffs.map((related) => (
                <button
                  key={`${related.action}-${related.label}`}
                  type="button"
                  onClick={() => onHandoff(related)}
                  className="text-xs px-2.5 py-1 rounded-md bg-emerald-700/80 hover:bg-emerald-600 text-white"
                >
                  {t('ai.guideDoThisForMe')}: {related.label}
                </button>
              ))
            : null}
        </div>
      </div>
    </div>
  );
}
