'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { CircleHelp, ExternalLink, X } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useI18n } from '@/i18n';
import api from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { DashboardPageToolbar } from '@/components/dashboard/dashboard-page-shell';
import {
  getHelpTopicCorpusTopicId,
  getHelpTopicGuidePath,
  helpTopicTranslationPrefix,
  listHelpStepKeys,
  type HelpTopicId,
} from '@/lib/help-center-topics';
import { GuideTopicAskAiButton } from '@/components/guide-topic-ask-ai-button';
import {
  resolveGuideHelpArticleUrl,
  resolveHelpTopicZendeskArticleId,
} from '@/lib/guide-topic-help-articles';

function unwrap<T>(res: unknown): T {
  return ((res as { data?: T })?.data ?? res) as T;
}

export function ContextualHelpButton({ topicId }: { topicId: HelpTopicId }) {
  const { t, locale } = useI18n();
  const { business } = useAuthStore();
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const prefix = helpTopicTranslationPrefix(topicId);
  const steps = listHelpStepKeys(topicId)
    .map((key) => t(key))
    .filter((step) => !step.startsWith('helpCenter.'));
  const zendeskArticleId = resolveHelpTopicZendeskArticleId(topicId);
  const { data: zendesk } = useQuery({
    queryKey: ['integrations-zendesk-widget', business?.id],
    queryFn: async () => {
      const { data: res } = await api.get(
        `/businesses/${business!.id}/integrations/zendesk/widget`,
      );
      return unwrap<{ widgetKey: string | null; subdomain?: string }>(res);
    },
    enabled: Boolean(business?.id && zendeskArticleId),
  });
  const helpArticleUrl = resolveGuideHelpArticleUrl(
    zendeskArticleId ? { zendeskArticleId } : undefined,
    zendesk?.subdomain,
    locale,
  );

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open]);

  return (
    <div className="relative inline-flex">
      <button
        type="button"
        aria-label={t('helpCenter.buttonLabel')}
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:text-blue-400 hover:bg-blue-600/10 transition-colors"
      >
        <CircleHelp className="h-4 w-4" />
      </button>

      {open && (
        <>
          <button
            type="button"
            aria-label={t('helpCenter.close')}
            className="fixed inset-0 z-40 bg-black/20"
            onClick={() => setOpen(false)}
          />
          <div
            ref={panelRef}
            className="absolute right-0 top-10 z-50 w-[min(22rem,calc(100vw-2rem))] rounded-xl border border-gray-700 bg-gray-900 shadow-xl p-4"
          >
            <div className="flex items-start justify-between gap-3 mb-3">
              <div>
                <p className="text-sm font-semibold text-gray-100">{t(`${prefix}.title`)}</p>
                <p className="text-xs text-gray-400 mt-1">{t(`${prefix}.summary`)}</p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg p-1 text-gray-500 hover:text-gray-200 hover:bg-gray-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {steps.length > 0 && (
              <ol className="space-y-2 mb-4">
                {steps.map((step, index) => (
                  <li key={step} className="flex gap-2 text-sm text-gray-300">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-600/15 text-[11px] font-semibold text-blue-400">
                      {index + 1}
                    </span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            )}

            <div className="flex flex-wrap items-center gap-3">
              <Link
                href={getHelpTopicGuidePath(topicId)}
                className="inline-flex text-sm font-medium text-blue-400 hover:text-blue-300"
                onClick={() => setOpen(false)}
              >
                {t('helpCenter.openFullGuide')}
              </Link>
              {helpArticleUrl ? (
                <a
                  href={helpArticleUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-sm font-medium text-blue-300 hover:text-blue-200"
                  onClick={() => setOpen(false)}
                >
                  {t('ai.guideReadHelpArticle')}
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              ) : null}
              <GuideTopicAskAiButton topicId={getHelpTopicCorpusTopicId(topicId)} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export function PageHelpHeader({
  title,
  subtitle,
  topicId,
  actions,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  topicId: HelpTopicId;
  actions?: ReactNode;
}) {
  return (
    <DashboardPageToolbar
      title={title}
      subtitle={subtitle}
      actions={actions}
      helpTopicId={topicId}
    />
  );
}
