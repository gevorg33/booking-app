import { handleExplainWhySignInLogic } from './ai-explain-why-sign-in.logic.js';
import { EXPLAIN_WHY_SIGN_IN_PROMPTS } from './ai-explain-why-sign-in.fixtures.js';
import { EXPLAIN_WHY_SIGN_IN_MULTILINGUAL_SCENARIOS } from './ai-explain-why-sign-in-multilingual.fixtures.js';

describe('ai-explain-why-sign-in.logic (ai-cmd-customer-4.17.1)', () => {
  it.each(EXPLAIN_WHY_SIGN_IN_PROMPTS.map((row) => [row.id, row] as const))(
    'handles prompt $0',
    async (_id, row) => {
      const result = await handleExplainWhySignInLogic('biz-1', {}, row.prompt);
      expect(result.success).toBe(true);
      expect(result.action).toBe('explain_why_sign_in');
      expect(result.summary.length).toBeGreaterThan(20);
    },
  );

  it('explains account is optional', async () => {
    const result = await handleExplainWhySignInLogic(
      'biz-1',
      {},
      'Do I need an account?',
    );
    expect(result.success).toBe(true);
    expect(result.details?.aspect).toBe('required');
    expect(result.summary).toMatch(/do not need an account/i);
  });

  it('navigates guests to login for how_to aspect', async () => {
    const result = await handleExplainWhySignInLogic(
      'biz-1',
      {},
      'How do I sign in?',
    );
    expect(result.details?.navigate).toEqual({ path: 'login', query: {} });
  });

  it('tailors summary when session customer is present', async () => {
    const result = await handleExplainWhySignInLogic(
      'biz-1',
      { sessionCustomerId: 'cust-1' },
      "What's the benefit of signing in?",
    );
    expect(result.success).toBe(true);
    expect(result.details?.signedIn).toBe(true);
    expect(result.summary).toMatch(/already signed in/i);
  });

  it.each(
    EXPLAIN_WHY_SIGN_IN_MULTILINGUAL_SCENARIOS.map(
      (row) => [row.id, row] as const,
    ),
  )('handles multilingual prompt $0', async (_id, row) => {
    const result = await handleExplainWhySignInLogic('biz-1', {}, row.prompt);
    expect(result.success).toBe(true);
  });

  it('fails clarify when prompt does not match', async () => {
    const result = await handleExplainWhySignInLogic(
      'biz-1',
      {},
      'What is the weather today?',
    );
    expect(result.success).toBe(false);
    expect(result.details?.clarify).toBe(true);
  });
});
