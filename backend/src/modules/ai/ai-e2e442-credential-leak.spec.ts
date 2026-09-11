/**
 * e2e-bug.442 — integration commands returned plaintext credentials to the client.
 *
 * `configure_openai_integration` and `configure_whatsapp_integration` both put
 * `patch: parsed` in their result details. `parsed` is the mutation itself, so
 * it carries `apiKey` ("sk-…", which is only encrypted once it reaches storage)
 * and `accessToken` respectively. Neither field is `_`-prefixed and `patch` was
 * not an internal detail key, so `sanitizeCommandDetailsForClient` passed both
 * through verbatim.
 *
 * The fix strips `patch` as a **category**. Redacting `apiKey`/`accessToken` by
 * name would leave the next credential-bearing patch to leak — the same
 * blacklist-chases-an-open-set problem as e2e-bug.446, where a contact-noun
 * blacklist repaired two prompts and missed eight.
 */
import {
  sanitizeCommandDetailsForClient,
  INTERNAL_COMMAND_DETAIL_KEYS,
} from './ai-command-client-sanitize.util.js';

describe('e2e-bug.442 — credentials never reach the client', () => {
  it('strips an OpenAI apiKey echoed back in patch', () => {
    const out = sanitizeCommandDetailsForClient({
      settings: { usingPlatformDefault: false },
      patch: { usePlatformDefault: false, apiKey: 'sk-live-REALSECRET123' },
    });
    expect(JSON.stringify(out)).not.toContain('sk-live-REALSECRET123');
    expect(out).not.toHaveProperty('patch');
  });

  it('strips a WhatsApp accessToken echoed back in patch', () => {
    const out = sanitizeCommandDetailsForClient({
      patch: { accessToken: 'EAAG-REALTOKEN', phoneNumberId: '123' },
    });
    expect(JSON.stringify(out)).not.toContain('EAAG-REALTOKEN');
  });

  it('keeps the user-facing result', () => {
    // The fix must not blank the response: `settings` is what the user sees.
    const out = sanitizeCommandDetailsForClient({
      settings: { usingPlatformDefault: true },
      patch: { apiKey: 'sk-x' },
    });
    expect(out).toHaveProperty('settings');
  });

  it('pins patch as an internal key so it is not quietly re-exposed', () => {
    expect(INTERNAL_COMMAND_DETAIL_KEYS).toContain('patch');
  });
});
