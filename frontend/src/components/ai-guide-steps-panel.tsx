'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronRight, ExternalLink } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useI18n } from '@/i18n';
import api from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import type { AiGuideRelatedAction, AiGuideResponse } from '@/lib/ai-client.types';
import { buildDashboardGuideTopicUrl } from '@/lib/dashboard-guide-corpus.util';
import {
  buildGuideStepNavigateUrl,
  hasInteractiveGuideSteps,
} from '@/lib/ai-guide-reply.util';
import { resolveGuideHelpArticleUrl } from '@/lib/guide-topic-help-articles';
import { GuideStillStuckButton } from '@/components/guide-still-stuck-button';
import { submitGuideSupportHandoff } from '@/lib/guide-support-handoff.util';
import {
  buildGuideHandoffTelemetryEvent,
  buildGuideStepCompletedEvent,
  createGuideTelemetrySessionId,
  ingestGuideTelemetryEvents,
  type GuideTelemetrySurface,
} from '@/lib/guide-telemetry.util';

interface AiGuideStepsPanelProps {
  guide: AiGuideResponse;
  onNavigate: (url: string) => void;
  onHandoff?: (related: AiGuideRelatedAction) => void;
}

function unwrap<T>(res: unknown): T {
  return ((res as { data?: T })?.data ?? res) as T;
}

export function AiGuideStepsPanel(props: AiGuideStepsPanelProps) {
  const sessionKey = `${props.guide.topicId ?? 'guide'}-${props.guide.guideSession?.guideStepIndex ?? 0}`;
  return <AiGuideStepsPanelInner key={sessionKey} {...props} />;
}

function AiGuideStepsPanelInner({ guide, onNavigate, onHandoff }: AiGuideStepsPanelProps) {
  const { t, locale } = useI18n();
  const { business, user } = useAuthStore();
  const [cursor, setCursor] = useState(() => guide.guideSession?.guideStepIndex ?? 0);
  const [telemetrySessionId] = useState(() => createGuideTelemetrySessionId());
  const telemetrySurface =
    (guide.supportHandoff?.snapshot.surface as GuideTelemetrySurface | undefined) ??
    'dashboard';
  const telemetryRoute = guide.supportHandoff?.snapshot.route;
  const recordGuideTelemetry = async (
    events: ReturnType<typeof buildGuideStepCompletedEvent>[],
  ) => {
    if (!business?.id) return;
    try {
      await ingestGuideTelemetryEvents(
        async (path, body) => {
          await api.post(path, body);
        },
        `/businesses/${business.id}/ai/guide-telemetry`,
        events,
      );
    } catch {
      // Non-blocking telemetry (acc-1).
    }
  };
  const { data: zendesk } = useQuery({
    queryKey: ['integrations-zendesk-widget', business?.id],
    queryFn: async () => {
      const { data: res } = await api.get(
        `/businesses/${business!.id}/integrations/zendesk/widget`,
      );
      return unwrap<{ widgetKey: string | null; subdomain?: string }>(res);
    },
    enabled: Boolean(business?.id && guide.helpArticle?.zendeskArticleId),
  });

  if (!hasInteractiveGuideSteps(guide)) return null;

  const steps = guide.steps;
  const step = steps[cursor];
  if (!step) return null;

  const atEnd = cursor >= steps.length - 1;
  const navigateUrl = buildGuideStepNavigateUrl(guide, cursor);
  const fullGuideUrl = guide.topicId ? buildDashboardGuideTopicUrl(guide.topicId) : null;
  const helpArticleUrl = resolveGuideHelpArticleUrl(
    guide.helpArticle,
    zendesk?.subdomain,
    locale,
  );
  const handoffs = guide.relatedActions ?? [];
  const showHandoffs = atEnd && handoffs.length > 0 && onHandoff;
  const supportHandoff = atEnd ? guide.supportHandoff : undefined;

  return (
    <div className="space-y-3">
      <p className="text-[13px] leading-relaxed text-gray-200">
        {t('ai.guideStepOf', { current: cursor + 1, total: steps.length })}: {step.title}
      </p>

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
          {helpArticleUrl ? (
            <a
              href={helpArticleUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs px-2.5 py-1 rounded-md border border-blue-500/40 bg-blue-950/30 hover:bg-blue-900/40 text-blue-100 inline-flex items-center gap-1"
            >
              {t('ai.guideReadHelpArticle')}
              <ExternalLink className="w-3 h-3" />
            </a>
          ) : null}
          {showHandoffs
            ? handoffs.map((related) => (
                <button
                  key={`${related.action}-${related.label}`}
                  type="button"
                  onClick={() => {
                    void recordGuideTelemetry([
                      buildGuideHandoffTelemetryEvent({
                        surface: telemetrySurface,
                        topicId: guide.topicId,
                        route: telemetryRoute,
                        locale,
                        sessionId: telemetrySessionId,
                        handoffAction: related.action,
                        totalSteps: steps.length,
                      }),
                    ]);
                    onHandoff(related);
                  }}
                  className="text-xs px-2.5 py-1 rounded-md bg-emerald-700/80 hover:bg-emerald-600 text-white"
                >
                  {t('ai.guideDoThisForMe')}: {related.label}
                </button>
              ))
            : null}
          {supportHandoff && business?.id ? (
            <GuideStillStuckButton
              handoff={supportHandoff}
              fallbackToWidget={false}
              onSubmit={async () =>
                submitGuideSupportHandoff(
                  async (path, body) => {
                    const { data } = await api.post(path, body);
                    return unwrap(data);
                  },
                  {
                    businessId: business.id,
                    handoff: supportHandoff,
                    requesterEmail: user?.email,
                    requesterName: user?.firstName
                      ? `${user.firstName}${user.lastName ? ` ${user.lastName}` : ''}`
                      : undefined,
                  },
                )
              }
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}
