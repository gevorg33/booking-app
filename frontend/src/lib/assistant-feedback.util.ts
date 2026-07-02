export type AssistantFeedbackRecord = {
  rating: 'up' | 'down';
  reason?: string;
  lastAssistantReply?: string;
  lastAction?: string;
  submittedAt: string;
};

const STORAGE_KEY = 'booking-assistant-feedback-queue';

export function recordAssistantFeedback(
  input: Omit<AssistantFeedbackRecord, 'submittedAt'>,
): void {
  if (typeof window === 'undefined') return;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const queue: AssistantFeedbackRecord[] = raw ? JSON.parse(raw) : [];
    queue.push({ ...input, submittedAt: new Date().toISOString() });
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(queue.slice(-20)));
    window.dispatchEvent(
      new CustomEvent('booking:assistant-feedback', { detail: input }),
    );
  } catch {
    // ignore storage failures
  }
}

export function handleAssistantFeedbackClientAction(
  details: Record<string, unknown> | undefined,
): void {
  if (!details?.clientAction) return;
  const rating =
    details.feedbackRating === 'up' || details.feedbackRating === 'down'
      ? details.feedbackRating
      : undefined;
  if (!rating) return;

  if (details.clientAction === 'submitAssistantFeedback') {
    recordAssistantFeedback({
      rating,
      reason:
        typeof details.feedbackReason === 'string'
          ? details.feedbackReason
          : undefined,
      lastAssistantReply:
        typeof details.lastAssistantReply === 'string'
          ? details.lastAssistantReply
          : undefined,
      lastAction:
        typeof details.lastAction === 'string' ? details.lastAction : undefined,
    });
    return;
  }

  if (details.clientAction === 'openAssistantFeedback') {
    window.dispatchEvent(
      new CustomEvent('booking:assistant-feedback-open', { detail: details }),
    );
  }
}
