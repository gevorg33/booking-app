/** Extract a user-facing message from API/unknown errors (axios-style or Error). */

const AXIOS_STATUS_MESSAGE_RE = /^request failed with status code \d+$/i;
const VISIT_DURATION_CAP_RE =
  /total visit duration|\bexceeds the \d+ minute limit\b/i;

function extractApiErrorMessage(error: unknown): string | null {
  const response = (error as { response?: { data?: { message?: unknown } } })?.response?.data
    ?.message;
  if (typeof response === 'string' && response.trim()) return response.trim();
  if (Array.isArray(response)) {
    const joined = response
      .filter((part): part is string => typeof part === 'string' && part.trim().length > 0)
      .join(', ');
    if (joined) return joined;
  }
  return null;
}

export function getErrorMessage(error: unknown, fallback = 'Something went wrong'): string {
  const apiMessage = extractApiErrorMessage(error);
  if (apiMessage) return apiMessage;

  if (typeof error === 'string' && error.trim()) {
    const trimmed = error.trim();
    if (AXIOS_STATUS_MESSAGE_RE.test(trimmed)) return fallback;
    return trimmed;
  }
  if (error instanceof Error && error.message.trim()) {
    const trimmed = error.message.trim();
    if (AXIOS_STATUS_MESSAGE_RE.test(trimmed)) return fallback;
    return trimmed;
  }
  return fallback;
}

/** e2e-bug.15 — package suggest-block / block-slots duration-cap vs other schedule errors. */
export function getPackageScheduleErrorMessage(
  error: unknown,
  copy: { packageCannotSchedule: string; fallback: string },
): string {
  const apiMessage = extractApiErrorMessage(error);
  if (apiMessage && VISIT_DURATION_CAP_RE.test(apiMessage)) {
    return copy.packageCannotSchedule;
  }
  if (error instanceof Error && VISIT_DURATION_CAP_RE.test(error.message)) {
    return copy.packageCannotSchedule;
  }
  return getErrorMessage(error, copy.fallback);
}

export function isVisitDurationCapError(error: unknown): boolean {
  const apiMessage = extractApiErrorMessage(error);
  if (apiMessage && VISIT_DURATION_CAP_RE.test(apiMessage)) return true;
  if (error instanceof Error && VISIT_DURATION_CAP_RE.test(error.message)) return true;
  return false;
}
