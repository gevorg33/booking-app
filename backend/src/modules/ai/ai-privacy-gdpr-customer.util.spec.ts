import {
  CUSTOMER_PRIVACY_GDPR_CLASSIFIER_RULES,
  PRIVACY_DELETE_PROMPTS,
  PRIVACY_EXPORT_PROMPTS,
  PRIVACY_GDPR_CUSTOMER_PROMPTS,
  detectPrivacyGdprCustomerAction,
  rescuePrivacyGdprCustomerIntent,
} from './ai-privacy-gdpr-customer.util.js';
import {
  isPrivacyDeletePrompt,
  isPrivacyExportPrompt,
  rescueCustomerCrmIntent,
} from './ai-customer-crm.util.js';
import { AI_COMMAND_EVAL_PRIVACY_GDPR_CUSTOMER_CASES } from './eval/ai-command-eval.cases.js';
import { evaluateDeterministicEvalCase } from './eval/ai-command-eval.runner.js';
import {
  isExplainDataRightsPrompt,
  rescueExplainDataRightsIntent,
} from './ai-data-rights.util.js';

describe('ai-privacy-gdpr-customer.util (ai-cmd-customer-4.0 P2)', () => {
  it('exports classifier rules for privacy export and delete', () => {
    expect(CUSTOMER_PRIVACY_GDPR_CLASSIFIER_RULES).toContain('privacy_export');
    expect(CUSTOMER_PRIVACY_GDPR_CLASSIFIER_RULES).toContain('privacy_delete');
  });

  it.each(PRIVACY_EXPORT_PROMPTS.map((row) => [row.id, row] as const))(
    'detects privacy export prompt $id',
    (_id, row) => {
      expect(isPrivacyExportPrompt(row.prompt)).toBe(true);
      expect(detectPrivacyGdprCustomerAction(row.prompt)).toBe(
        row.expectedAction,
      );
    },
  );

  it.each(PRIVACY_DELETE_PROMPTS.map((row) => [row.id, row] as const))(
    'detects privacy delete prompt $id',
    (_id, row) => {
      expect(isPrivacyDeletePrompt(row.prompt)).toBe(true);
      expect(detectPrivacyGdprCustomerAction(row.prompt)).toBe(
        row.expectedAction,
      );
    },
  );

  it.each(PRIVACY_GDPR_CUSTOMER_PROMPTS.map((row) => [row.id, row] as const))(
    'rescues privacy GDPR prompt $id from unknown',
    (_id, row) => {
      const rescued = rescuePrivacyGdprCustomerIntent(row.prompt, 'unknown');
      expect(rescued?.action).toBe(row.expectedAction);
      expect(rescued?.rescueReason).toBe(row.rescueReason);
      expect(rescueCustomerCrmIntent(row.prompt, 'unknown')?.action).toBe(
        row.expectedAction,
      );
    },
  );

  it('does not steal explain_data_rights or dashboard admin prompts', () => {
    expect(
      isExplainDataRightsPrompt('How can I export my personal data?'),
    ).toBe(true);
    expect(
      rescueExplainDataRightsIntent(
        'How can I export my personal data?',
        'unknown',
      )?.action,
    ).toBe('explain_data_rights');
    expect(
      detectPrivacyGdprCustomerAction('How can I export my personal data?'),
    ).toBeNull();
    expect(
      rescuePrivacyGdprCustomerIntent(
        'How can I export my personal data?',
        'unknown',
      ),
    ).toBeNull();

    expect(isPrivacyExportPrompt('Export customer data for Anna')).toBe(false);
    expect(isPrivacyDeletePrompt('Delete customer data for Anna')).toBe(false);
    expect(
      rescuePrivacyGdprCustomerIntent(
        'Export customer data for Anna',
        'unknown',
      ),
    ).toBeNull();
  });

  it('prefers privacy_delete over privacy_export when both cues appear', () => {
    expect(
      detectPrivacyGdprCustomerAction(
        'Delete my data and do not export it again',
      ),
    ).toBe('privacy_delete');
  });

  it('maps privacy GDPR fixtures to passing eval golden cases', () => {
    expect(PRIVACY_EXPORT_PROMPTS.length).toBeGreaterThanOrEqual(10);
    expect(PRIVACY_DELETE_PROMPTS.length).toBeGreaterThanOrEqual(10);
    expect(AI_COMMAND_EVAL_PRIVACY_GDPR_CUSTOMER_CASES.length).toBe(
      PRIVACY_GDPR_CUSTOMER_PROMPTS.length,
    );
    for (const evalCase of AI_COMMAND_EVAL_PRIVACY_GDPR_CUSTOMER_CASES) {
      expect(evaluateDeterministicEvalCase(evalCase).errors).toEqual([]);
    }
  });
});
