'use client';

import { useState } from 'react';
import { LifeBuoy, Loader2 } from 'lucide-react';
import { useI18n } from '@/i18n';
import type { GuideSupportHandoff } from '@/lib/guide-support-handoff.util';
import { openZendeskMessengerWidget } from '@/lib/guide-support-handoff.util';

interface GuideStillStuckButtonProps {
  handoff: GuideSupportHandoff;
  onSubmit: () => Promise<{ url?: string } | void>;
  fallbackToWidget?: boolean;
  className?: string;
}

export function GuideStillStuckButton({
  handoff,
  onSubmit,
  fallbackToWidget = true,
  className,
}: GuideStillStuckButtonProps) {
  const { t } = useI18n();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successUrl, setSuccessUrl] = useState<string | null>(null);

  const handleClick = async () => {
    setLoading(true);
    setError(null);
    setSuccessUrl(null);
    try {
      const result = await onSubmit();
      if (result?.url) {
        setSuccessUrl(result.url);
        return;
      }
      if (fallbackToWidget && openZendeskMessengerWidget()) {
        return;
      }
    } catch {
      if (fallbackToWidget && openZendeskMessengerWidget()) {
        return;
      }
      setError(t('ai.guideSupportHandoffFailed'));
    } finally {
      setLoading(false);
    }
  };

  if (successUrl) {
    return (
      <a
        href={successUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={
          className ??
          'text-xs px-2.5 py-1 rounded-md border border-emerald-500/40 bg-emerald-950/30 hover:bg-emerald-900/40 text-emerald-100 inline-flex items-center gap-1'
        }
      >
        {t('support.openInZendesk')}
      </a>
    );
  }

  return (
    <div className="inline-flex flex-col gap-1">
      <button
        type="button"
        onClick={() => void handleClick()}
        disabled={loading}
        className={
          className ??
          'text-xs px-2.5 py-1 rounded-md border border-amber-500/40 bg-amber-950/30 hover:bg-amber-900/40 text-amber-100 inline-flex items-center gap-1 disabled:opacity-60'
        }
      >
        {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <LifeBuoy className="w-3 h-3" />}
        {handoff.label || t('ai.guideStillStuck')}
      </button>
      {error ? <span className="text-[11px] text-red-400">{error}</span> : null}
    </div>
  );
}
