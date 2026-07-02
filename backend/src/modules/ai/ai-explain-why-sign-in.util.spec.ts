import {
  CUSTOMER_PUBLIC_EXPLAIN_WHY_SIGN_IN_CLASSIFIER_RULES,
  buildExplainWhySignInNavigate,
  buildExplainWhySignInSummary,
  enrichExplainWhySignInParamsFromPrompt,
  hasExplainWhySignInCue,
  isExplainWhySignInPrompt,
  parseExplainWhySignInFromPrompt,
  rescueExplainWhySignInIntent,
} from './ai-explain-why-sign-in.util.js';
import {
  EXPLAIN_WHY_SIGN_IN_PROMPTS,
  EXPLAIN_WHY_SIGN_IN_RESCUE_SCENARIOS,
} from './ai-explain-why-sign-in.fixtures.js';
import { EXPLAIN_WHY_SIGN_IN_MULTILINGUAL_SCENARIOS } from './ai-explain-why-sign-in-multilingual.fixtures.js';
import { isExplainGuestCheckoutFieldsPrompt } from './ai-explain-guest-checkout-fields.util.js';

describe('ai-explain-why-sign-in.util (ai-cmd-customer-4.17.1)', () => {
  it('exports classifier rules for explain_why_sign_in', () => {
    expect(CUSTOMER_PUBLIC_EXPLAIN_WHY_SIGN_IN_CLASSIFIER_RULES).toContain(
      'explain_why_sign_in',
    );
  });

  it.each(EXPLAIN_WHY_SIGN_IN_PROMPTS.map((row) => [row.id, row] as const))(
    'detects why sign in prompt for $0',
    (_id, row) => {
      expect(isExplainWhySignInPrompt(row.prompt)).toBe(true);
      expect(parseExplainWhySignInFromPrompt(row.prompt)?.aspect).toBe(
        row.aspect ?? expect.any(String),
      );
      expect(rescueExplainWhySignInIntent(row.prompt, 'unknown')).toEqual({
        action: 'explain_why_sign_in',
        rescueReason: 'why_sign_in',
      });
    },
  );

  it.each(
    EXPLAIN_WHY_SIGN_IN_MULTILINGUAL_SCENARIOS.map(
      (row) => [row.id, row] as const,
    ),
  )('detects multilingual why sign in prompt for $0', (_id, row) => {
    expect(isExplainWhySignInPrompt(row.prompt)).toBe(true);
    expect(rescueExplainWhySignInIntent(row.prompt, 'unknown')?.action).toBe(
      'explain_why_sign_in',
    );
  });

  it.each(
    EXPLAIN_WHY_SIGN_IN_RESCUE_SCENARIOS.map((row) => [row.id, row] as const),
  )('rescues $0 from misclassified action', (_id, row) => {
    expect(
      rescueExplainWhySignInIntent(row.prompt, row.misclassifiedAction),
    ).toEqual({
      action: 'explain_why_sign_in',
      rescueReason: 'why_sign_in',
    });
  });

  it('does not steal checkout field prompts', () => {
    expect(
      isExplainWhySignInPrompt('Why do you need my email at checkout?'),
    ).toBe(false);
    expect(
      isExplainGuestCheckoutFieldsPrompt(
        'Why do you need my email at checkout?',
      ),
    ).toBe(true);
  });

  it('does not steal post-booking save prompts', () => {
    expect(
      isExplainWhySignInPrompt(
        'Save this booking to my account after checkout',
      ),
    ).toBe(false);
  });

  it('does not steal explain_tenant_currency prompts', () => {
    expect(
      isExplainWhySignInPrompt(
        'Why does the salon app show prices in euros after I log in?',
      ),
    ).toBe(false);
    expect(
      rescueExplainWhySignInIntent(
        'Why does the salon app show prices in euros after I log in?',
        'unknown',
      ),
    ).toBeNull();
  });

  it('returns null rescue when already classified correctly', () => {
    expect(
      rescueExplainWhySignInIntent(
        'Do I need an account?',
        'explain_why_sign_in',
      ),
    ).toBeNull();
  });

  it('covers heuristic aspect inference and helpers', () => {
    expect(hasExplainWhySignInCue('Why sign in on the booking page?')).toBe(
      true,
    );
    expect(parseExplainWhySignInFromPrompt('Where do I sign in?')?.aspect).toBe(
      'how_to',
    );
    expect(
      parseExplainWhySignInFromPrompt(
        'Can I see my past appointments without signing in?',
      )?.aspect,
    ).toBe('history');
    expect(
      parseExplainWhySignInFromPrompt('Guest vs signed in checkout difference')
        ?.aspect,
    ).toBe('guest_vs_signed_in');
    expect(
      enrichExplainWhySignInParamsFromPrompt({}, 'Do I need an account?'),
    ).toEqual({ aspect: 'required' });
    expect(buildExplainWhySignInNavigate('benefits', false)).toEqual({
      path: 'login',
      query: { reason: 'account_benefits' },
    });
    expect(buildExplainWhySignInNavigate('history', true)).toEqual({
      path: 'account',
      query: {},
    });
    expect(
      buildExplainWhySignInSummary({ aspect: 'how_to', signedIn: true }),
    ).toMatch(/already signed in/i);
    expect(
      buildExplainWhySignInSummary({ aspect: 'all', signedIn: false }),
    ).toMatch(/do not need an account/i);
  });

  it('does not treat GDPR export/delete as why sign in', () => {
    expect(isExplainWhySignInPrompt('How can I export my personal data?')).toBe(
      false,
    );
  });
});
