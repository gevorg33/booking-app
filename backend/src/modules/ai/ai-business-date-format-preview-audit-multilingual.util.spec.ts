import { MULTILINGUAL_PREVIEW_AUDIT_BUSINESS_DATE_FORMAT_EVAL_SCENARIOS } from './ai-business-date-format-preview-audit-multilingual.fixtures.js';
import {
  isAuditDashboardDateSurfacesPrompt,
  isPreviewBusinessDateFormatPrompt,
  parseBusinessDateFormatFromPrompt,
  rescueBusinessDateFormatIntent,
} from './ai-business-date-format.util.js';

describe('ai-business-date-format preview/audit multilingual (ai-cmd-fmt-8)', () => {
  it.each(MULTILINGUAL_PREVIEW_AUDIT_BUSINESS_DATE_FORMAT_EVAL_SCENARIOS)(
    'rescues $locale $id → $expectedAction',
    ({ prompt, expectedAction, rescueReason, paramsPartial }) => {
      const rescued = rescueBusinessDateFormatIntent(prompt, 'unknown');
      expect(rescued?.action).toBe(expectedAction);
      expect(rescued?.rescueReason).toBe(rescueReason);

      if (expectedAction === 'preview_business_date_format') {
        expect(isPreviewBusinessDateFormatPrompt(prompt)).toBe(true);
        if (paramsPartial) {
          expect(parseBusinessDateFormatFromPrompt(prompt)).toEqual(
            expect.objectContaining(paramsPartial),
          );
        }
      } else {
        expect(isAuditDashboardDateSurfacesPrompt(prompt)).toBe(true);
      }
    },
  );
});
