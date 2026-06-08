'use client';

import { useState } from 'react';
import api from '@/lib/api';
import { sendPublicAssistantFeedback } from '@/lib/public-api';
import { useI18n } from '@/i18n';

export const AI_COMMAND_FEEDBACK_REASONS = [
  'wrong_action',
  'wrong_date',
  'wrong_person',
  'wrong_service',
  'did_not_understand',
] as const;

type FeedbackReason = (typeof AI_COMMAND_FEEDBACK_REASONS)[number];

export type AiCommandFeedbackProps = {
  businessId?: string;
  slug?: string;
  traceId?: string;
  compact?: boolean;
  variant?: 'dark' | 'light';
};

async function postFeedback(
  props: Pick<AiCommandFeedbackProps, 'businessId' | 'slug'>,
  traceId: string,
  rating: 'up' | 'down',
  reason?: FeedbackReason,
) {
  if (props.businessId) {
    await api.post(
      `/businesses/${props.businessId}/ai/trace/${traceId}/feedback`,
      { rating, reason },
    );
    return;
  }
  if (props.slug) {
    await sendPublicAssistantFeedback(props.slug, traceId, { rating, reason });
    return;
  }
}

export function AiCommandFeedback({
  businessId,
  slug,
  traceId,
  compact = false,
  variant = 'dark',
}: AiCommandFeedbackProps) {
  const { t } = useI18n();
  const [rating, setRating] = useState<'up' | 'down' | null>(null);
  const [showReasons, setShowReasons] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  if (!traceId || (!businessId && !slug)) return null;

  const submitFeedback = async (
    nextRating: 'up' | 'down',
    reason?: FeedbackReason,
  ) => {
    if (submitting || rating) return;
    setSubmitting(true);
    try {
      await postFeedback({ businessId, slug }, traceId, nextRating, reason);
      setRating(nextRating);
      setShowReasons(false);
    } finally {
      setSubmitting(false);
    }
  };

  const isLight = variant === 'light';
  const upActive =
    rating === 'up'
      ? isLight
        ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
        : 'border-green-600 bg-green-950/40 text-green-300'
      : isLight
        ? 'border-gray-200 text-gray-500 hover:border-emerald-400 hover:text-emerald-700'
        : 'border-gray-700 text-gray-400 hover:text-green-300 hover:border-green-700';
  const downActive =
    rating === 'down'
      ? isLight
        ? 'border-red-400 bg-red-50 text-red-700'
        : 'border-red-600 bg-red-950/40 text-red-300'
      : isLight
        ? 'border-gray-200 text-gray-500 hover:border-red-400 hover:text-red-700'
        : 'border-gray-700 text-gray-400 hover:text-red-300 hover:border-red-700';
  const reasonChipClass = isLight
    ? 'text-[10px] px-2 py-1 rounded-full border border-gray-200 text-gray-600 hover:border-red-300 hover:text-red-700'
    : 'text-[10px] px-2 py-1 rounded-full border border-gray-700 text-gray-400 hover:border-red-700 hover:text-red-200';
  const thanksClass = isLight ? 'text-[10px] text-gray-500' : 'text-[10px] text-gray-500';
  const promptClass = isLight ? 'text-[11px] text-gray-500' : 'text-[11px] text-gray-500';

  return (
    <div className={`${compact ? 'mt-2' : 'mt-3'} space-y-2`}>
      <div className="flex items-center gap-1.5">
        {!compact && (
          <span className={promptClass}>{t('ai.feedbackPrompt')}</span>
        )}
        <button
          type="button"
          disabled={submitting || rating != null}
          onClick={() => void submitFeedback('up')}
          className={`inline-flex items-center justify-center rounded-full w-7 h-7 text-base border transition-colors ${upActive}`}
          aria-label={t('ai.feedbackUp')}
          title={t('ai.feedbackUp')}
        >
          👍
        </button>
        <button
          type="button"
          disabled={submitting || rating != null}
          onClick={() => setShowReasons(true)}
          className={`inline-flex items-center justify-center rounded-full w-7 h-7 text-base border transition-colors ${downActive}`}
          aria-label={t('ai.feedbackDown')}
          title={t('ai.feedbackDown')}
        >
          👎
        </button>
      </div>

      {showReasons && !rating && (
        <div className="flex flex-wrap gap-1.5">
          {AI_COMMAND_FEEDBACK_REASONS.map((reason) => (
            <button
              key={reason}
              type="button"
              disabled={submitting}
              onClick={() => void submitFeedback('down', reason)}
              className={reasonChipClass}
            >
              {t(`ai.feedbackReason.${reason}`)}
            </button>
          ))}
          <button
            type="button"
            disabled={submitting}
            onClick={() => void submitFeedback('down')}
            className={reasonChipClass}
          >
            {t('ai.feedbackReasonSkip')}
          </button>
        </div>
      )}

      {rating && <p className={thanksClass}>{t('ai.feedbackThanks')}</p>}
    </div>
  );
}

export function reportClarifyAbandoned(businessId: string, traceId: string) {
  void api.post(`/businesses/${businessId}/ai/trace/${traceId}/abandon`).catch(() => {
    // Best-effort telemetry — ignore network failures.
  });
}

type ClarifyTraceMessage = {
  role: string;
  details?: Record<string, unknown> | null;
};

/** Most recent assistant clarify still awaiting user input (acc-1.5). */
export function findPendingClarifyTraceId(
  messages: ClarifyTraceMessage[],
): string | undefined {
  const pending = [...messages]
    .reverse()
    .find(
      (msg) =>
        msg.role === 'assistant' &&
        msg.details &&
        msg.details.needsClarification === true &&
        typeof msg.details.traceId === 'string',
    );
  return pending?.details?.traceId ? String(pending.details.traceId) : undefined;
}
