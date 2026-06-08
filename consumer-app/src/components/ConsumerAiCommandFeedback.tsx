import { useState } from 'react';
import { IonText } from '@ionic/react';
import { sendPublicAssistantFeedback } from '../services/public-api.js';
import type { ConsumerCopy } from '../lib/consumer-copy.types.js';

const FEEDBACK_REASONS = [
  { key: 'wrong_action', label: (copy: ConsumerCopy) => copy.feedbackReasonWrongAction },
  { key: 'wrong_date', label: (copy: ConsumerCopy) => copy.feedbackReasonWrongDate },
  { key: 'wrong_person', label: (copy: ConsumerCopy) => copy.feedbackReasonWrongPerson },
  { key: 'wrong_service', label: (copy: ConsumerCopy) => copy.feedbackReasonWrongService },
  {
    key: 'did_not_understand',
    label: (copy: ConsumerCopy) => copy.feedbackReasonDidNotUnderstand,
  },
] as const;

type FeedbackReason = (typeof FEEDBACK_REASONS)[number]['key'];

export function ConsumerAiCommandFeedback({
  slug,
  traceId,
  copy,
}: {
  slug: string;
  traceId?: string;
  copy: ConsumerCopy;
}) {
  const [rating, setRating] = useState<'up' | 'down' | null>(null);
  const [showReasons, setShowReasons] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  if (!traceId) return null;

  if (rating) {
    return (
      <IonText color="medium">
        <p className="consumer-ai-feedback-thanks">{copy.feedbackThanks}</p>
      </IonText>
    );
  }

  const submitFeedback = async (nextRating: 'up' | 'down', reason?: FeedbackReason) => {
    if (submitting) return;
    setSubmitting(true);
    try {
      await sendPublicAssistantFeedback(slug, traceId, { rating: nextRating, reason });
      setRating(nextRating);
      setShowReasons(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="consumer-ai-feedback">
      <div className="consumer-ai-feedback-actions">
        <button
          type="button"
          disabled={submitting}
          className="consumer-ai-feedback-thumb"
          aria-label={copy.feedbackUp}
          title={copy.feedbackUp}
          onClick={() => void submitFeedback('up')}
        >
          👍
        </button>
        <button
          type="button"
          disabled={submitting}
          className="consumer-ai-feedback-thumb"
          aria-label={copy.feedbackDown}
          title={copy.feedbackDown}
          onClick={() => setShowReasons(true)}
        >
          👎
        </button>
      </div>

      {showReasons && (
        <div className="consumer-ai-feedback-reasons">
          {FEEDBACK_REASONS.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              disabled={submitting}
              className="consumer-ai-feedback-reason"
              onClick={() => void submitFeedback('down', key)}
            >
              {label(copy)}
            </button>
          ))}
          <button
            type="button"
            disabled={submitting}
            className="consumer-ai-feedback-reason"
            onClick={() => void submitFeedback('down')}
          >
            {copy.feedbackReasonSkip}
          </button>
        </div>
      )}
    </div>
  );
}
