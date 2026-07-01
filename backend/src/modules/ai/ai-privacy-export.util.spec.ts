import {
  PRIVACY_EXPORT_PROMPTS,
  PRIVACY_EXPORT_RESCUE_SCENARIOS,
} from './ai-privacy-export.fixtures.js';
import { PRIVACY_GDPR_MULTILINGUAL_SCENARIOS } from './ai-privacy-gdpr-multilingual.fixtures.js';
import {
  buildPrivacyExportNavigate,
  isPrivacyExportCustomerPrompt,
  rescuePrivacyExportIntent,
} from './ai-privacy-export.util.js';
import { rescueExplainDataRightsIntent } from './ai-data-rights.util.js';

describe('ai-privacy-export.util (ai-cmd-customer-4.17.5)', () => {
  it.each(PRIVACY_EXPORT_PROMPTS.map((row) => [row.id, row] as const))(
    'detects export prompt $0',
    (_id, row) => {
      expect(isPrivacyExportCustomerPrompt(row.prompt)).toBe(true);
      expect(rescuePrivacyExportIntent(row.prompt, 'unknown')?.action).toBe(
        'privacy_export',
      );
    },
  );

  it.each(
    PRIVACY_GDPR_MULTILINGUAL_SCENARIOS.filter(
      (row) => row.expectedAction === 'privacy_export',
    ).map((row) => [row.id, row] as const),
  )('rescues multilingual export prompt $0', (_id, row) => {
    expect(rescuePrivacyExportIntent(row.prompt, 'unknown')?.action).toBe(
      'privacy_export',
    );
  });

  it.each(PRIVACY_EXPORT_RESCUE_SCENARIOS.map((row) => [row.id, row] as const))(
    'rescues misclassified export prompt $0',
    (_id, row) => {
      expect(
        rescuePrivacyExportIntent(row.prompt, row.misclassifiedAction)?.action,
      ).toBe(row.expectedAction);
    },
  );

  it('does not steal explain_data_rights read prompts', () => {
    expect(
      rescueExplainDataRightsIntent(
        'How can I export my personal data?',
        'unknown',
      )?.action,
    ).toBe('explain_data_rights');
    expect(
      rescuePrivacyExportIntent(
        'How can I export my personal data?',
        'unknown',
      ),
    ).toBeNull();
  });

  it('builds account privacy navigate', () => {
    expect(buildPrivacyExportNavigate()).toEqual({
      path: 'account',
      query: { section: 'privacy', privacyAction: 'export' },
    });
  });
});
