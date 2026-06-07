import { MULTILINGUAL_BUSINESS_COMPLIANCE_EVAL_SCENARIOS } from './ai-business-compliance-multilingual.fixtures.js';
import {
  parseAdminDeleteCustomerDataFromPrompt,
  parseConfigureGranularConsentFromPrompt,
  parseConfigurePrivacyRetentionFromPrompt,
  parseEnableHipaaModeFromPrompt,
  parseExplainComplianceStatusFromPrompt,
  rescueBusinessComplianceIntent,
} from './ai-business-compliance.util.js';

describe('ai-business-compliance multilingual (ai-cmd-compliance-6)', () => {
  it.each(MULTILINGUAL_BUSINESS_COMPLIANCE_EVAL_SCENARIOS)(
    'rescues $locale $id → $expectedAction',
    ({ prompt, expectedAction, rescueReason, paramsPartial }) => {
      const rescued = rescueBusinessComplianceIntent(prompt, 'unknown');
      expect(rescued?.action).toBe(expectedAction);
      expect(rescued?.rescueReason).toBe(rescueReason);

      if (expectedAction === 'configure_privacy_retention' && paramsPartial) {
        const parsed = parseConfigurePrivacyRetentionFromPrompt(prompt);
        expect(parsed).not.toBeNull();
        if ('customerPiiDays' in paramsPartial) {
          expect(parsed?.retention?.customerPiiDays).toBe(
            paramsPartial.customerPiiDays,
          );
        }
        if ('cookieBannerEnabled' in paramsPartial) {
          expect(parsed?.cookieBanner?.enabled).toBe(
            paramsPartial.cookieBannerEnabled,
          );
        }
      }
      if (expectedAction === 'configure_granular_consent' && paramsPartial) {
        expect(parseConfigureGranularConsentFromPrompt(prompt)).toEqual(
          expect.objectContaining(paramsPartial),
        );
      }
      if (expectedAction === 'enable_hipaa_mode' && paramsPartial) {
        expect(parseEnableHipaaModeFromPrompt(prompt)).toEqual(
          expect.objectContaining(paramsPartial),
        );
      }
      if (expectedAction === 'explain_compliance_status' && paramsPartial) {
        expect(parseExplainComplianceStatusFromPrompt(prompt)).toEqual(
          expect.objectContaining(paramsPartial),
        );
      }
      if (expectedAction === 'admin_delete_customer_data') {
        expect(parseAdminDeleteCustomerDataFromPrompt(prompt)).not.toBeNull();
      }
    },
  );
});
