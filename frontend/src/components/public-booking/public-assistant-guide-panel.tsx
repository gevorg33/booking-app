'use client';

import { useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { useI18n } from '@/i18n';
import type { AiGuideResponse } from '@/lib/ai-client.types';
import { hasPublicAssistantGuideSteps } from '@/lib/public-assistant-guide.util';
import { GuideStillStuckButton } from '@/components/guide-still-stuck-button';
import {
  buildGuideStepCompletedEvent,
  createGuideTelemetrySessionId,
} from '@/lib/guide-telemetry.util';
import { ingestPublicGuideTelemetryEvents } from '@/lib/public-api';

interface PublicAssistantGuidePanelProps {
  guide: AiGuideResponse;
  slug: string;
  onNavigate?: (url: string) => void;
}

export function PublicAssistantGuidePanel({
  guide,
  slug,
  onNavigate,
}: PublicAssistantGuidePanelProps) {
  const { t, locale } = useI18n();
  const [cursor, setCursor] = useState(0);
  const [telemetrySessionId] = useState(() => createGuideTelemetrySessionId());
  const telemetrySurface = guide.supportHandoff?.snapshot.surface ?? 'public';
  const telemetryRoute = guide.supportHandoff?.snapshot.route;
  const recordGuideTelemetry = async (
    events: ReturnType<typeof buildGuideStepCompletedEvent>[],
  ) => {
    try {
      await ingestPublicGuideTelemetryEvents(slug, events);
    } catch {
      // Non-blocking telemetry (acc-1).
    }
  };

  if (!hasPublicAssistantGuideSteps(guide)) return null;

  const steps = guide.steps;
  const step = steps[cursor];
  if (!step) return null;

  const atEnd = cursor >= steps.length - 1;
  const stepNavigate = step.navigate;
  const guideNavigate = guide.navigate;
  const navigateTarget = stepNavigate ?? (atEnd ? guideNavigate : undefined);
  const supportHandoff = atEnd ? guide.supportHandoff : undefined;

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
              onClick={() => {
                void recordGuideTelemetry([
                  buildGuideStepCompletedEvent({
                    surface: telemetrySurface,
                    topicId: guide.topicId,
                    route: telemetryRoute,
                    locale,
                    sessionId: telemetrySessionId,
                    stepIndex: cursor,
                    totalSteps: steps.length,
                  }),
                ]);
                setCursor((current) => Math.min(current + 1, steps.length - 1));
              }}
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
          {supportHandoff ? (
            <GuideStillStuckButton
              handoff={supportHandoff}
              onSubmit={async () => undefined}
              className="text-xs px-2.5 py-1 rounded-md border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 inline-flex items-center gap-1"
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}
