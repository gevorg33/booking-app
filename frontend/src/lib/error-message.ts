/** Extract a user-facing message from API/unknown errors (axios-style or Error). */
export function getErrorMessage(error: unknown, fallback = 'Something went wrong'): string {
  if (typeof error === 'string' && error.trim()) return error.trim();
  if (error instanceof Error && error.message.trim()) return error.message.trim();
  const response = (error as { response?: { data?: { message?: unknown } } })?.response?.data
    ?.message;
  if (typeof response === 'string' && response.trim()) return response.trim();
  if (Array.isArray(response)) {
    const joined = response
      .filter((part): part is string => typeof part === 'string' && part.trim().length > 0)
      .join(', ');
    if (joined) return joined;
  }
  return fallback;
}
