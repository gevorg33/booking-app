import { resolveLocale, t } from '../../common/i18n/messages.js';
import type { CommandResult } from './command-completion.types.js';

/** e2e-bug.239 — empty/whitespace prompt → localized action:error summary. */
export const E2E239_REQUEST_ERROR_SCENARIOS = [
  {
    id: 'e2e239-en-empty',
    locale: 'en' as const,
    prompt: '',
    expectedSummary: 'Could not understand that request. Try rephrasing.',
  },
  {
    id: 'e2e239-hy-empty',
    locale: 'hy' as const,
    prompt: '',
    expectedSummary: 'Չհաջողվեց հասկանալ այդ հարցումը։ Փորձեք վերաձևակերպել։',
  },
  {
    id: 'e2e239-ru-empty',
    locale: 'ru' as const,
    prompt: '',
    expectedSummary:
      'Не удалось понять этот запрос. Попробуйте переформулировать.',
  },
  {
    id: 'e2e239-hy-whitespace',
    locale: 'hy' as const,
    prompt: '   ',
    expectedSummary: 'Չհաջողվեց հասկանալ այդ հարցումը։ Փորձեք վերաձևակերպել։',
  },
  {
    id: 'e2e239-ru-whitespace',
    locale: 'ru' as const,
    prompt: '\n\t',
    expectedSummary:
      'Не удалось понять этот запрос. Попробуйте переформулировать.',
  },
] as const;

export function customerAssistantRequestErrorSummary(
  locale?: string | null,
): string {
  return t(resolveLocale(locale), 'assistant.requestError');
}

export function buildCustomerBlockedRequestErrorResult(
  locale: string | null | undefined,
  details?: Record<string, unknown>,
): CommandResult {
  return {
    success: false,
    action: 'error',
    summary: customerAssistantRequestErrorSummary(locale),
    details: details ?? {},
  };
}
