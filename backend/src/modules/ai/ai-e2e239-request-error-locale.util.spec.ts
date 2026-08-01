import { t } from '../../common/i18n/messages.js';
import {
  buildCustomerBlockedRequestErrorResult,
  customerAssistantRequestErrorSummary,
  E2E239_REQUEST_ERROR_SCENARIOS,
} from './ai-e2e239-request-error-locale.util.js';

describe('e2e-bug.239 action:error request summary locale', () => {
  it.each(E2E239_REQUEST_ERROR_SCENARIOS.map((row) => [row.id, row] as const))(
    'localizes requestError for $id',
    (_id, row) => {
      expect(customerAssistantRequestErrorSummary(row.locale)).toBe(
        row.expectedSummary,
      );
      expect(t(row.locale, 'assistant.requestError')).toBe(row.expectedSummary);
    },
  );

  it.each(E2E239_REQUEST_ERROR_SCENARIOS.map((row) => [row.id, row] as const))(
    'buildCustomerBlockedRequestErrorResult $id',
    (_id, row) => {
      const result = buildCustomerBlockedRequestErrorResult(row.locale, {
        blockReason: 'empty prompt after normalization',
      });
      expect(result.action).toBe('error');
      expect(result.success).toBe(false);
      expect(result.summary).toBe(row.expectedSummary);
      if (row.locale !== 'en') {
        expect(result.summary).not.toBe(
          customerAssistantRequestErrorSummary('en'),
        );
      }
    },
  );

  it('hy and ru catalogs differ from English', () => {
    expect(customerAssistantRequestErrorSummary('hy')).not.toBe(
      customerAssistantRequestErrorSummary('en'),
    );
    expect(customerAssistantRequestErrorSummary('ru')).not.toBe(
      customerAssistantRequestErrorSummary('en'),
    );
  });
});
