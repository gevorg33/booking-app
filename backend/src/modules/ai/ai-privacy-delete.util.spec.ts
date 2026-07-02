import {
  PRIVACY_DELETE_PROMPTS,
  PRIVACY_DELETE_RESCUE_SCENARIOS,
} from './ai-privacy-delete.fixtures.js';
import { PRIVACY_GDPR_MULTILINGUAL_SCENARIOS } from './ai-privacy-gdpr-multilingual.fixtures.js';
import {
  buildPrivacyDeleteNavigate,
  isPrivacyDeleteCustomerPrompt,
  rescuePrivacyDeleteIntent,
} from './ai-privacy-delete.util.js';

describe('ai-privacy-delete.util (ai-cmd-customer-4.17.5)', () => {
  it.each(PRIVACY_DELETE_PROMPTS.map((row) => [row.id, row] as const))(
    'detects delete prompt $0',
    (_id, row) => {
      expect(isPrivacyDeleteCustomerPrompt(row.prompt)).toBe(true);
      expect(rescuePrivacyDeleteIntent(row.prompt, 'unknown')?.action).toBe(
        'privacy_delete',
      );
    },
  );

  it.each(
    PRIVACY_GDPR_MULTILINGUAL_SCENARIOS.filter(
      (row) => row.expectedAction === 'privacy_delete',
    ).map((row) => [row.id, row] as const),
  )('rescues multilingual delete prompt $0', (_id, row) => {
    expect(rescuePrivacyDeleteIntent(row.prompt, 'unknown')?.action).toBe(
      'privacy_delete',
    );
  });

  it.each(PRIVACY_DELETE_RESCUE_SCENARIOS.map((row) => [row.id, row] as const))(
    'rescues misclassified delete prompt $0',
    (_id, row) => {
      expect(
        rescuePrivacyDeleteIntent(row.prompt, row.misclassifiedAction)?.action,
      ).toBe(row.expectedAction);
    },
  );

  it('prefers delete over export when both cues appear', () => {
    expect(
      rescuePrivacyDeleteIntent(
        'Delete my data and do not export it again',
        'unknown',
      )?.action,
    ).toBe('privacy_delete');
  });

  it('builds account privacy navigate', () => {
    expect(buildPrivacyDeleteNavigate()).toEqual({
      path: 'account',
      query: { section: 'privacy', privacyAction: 'delete' },
    });
  });
});
