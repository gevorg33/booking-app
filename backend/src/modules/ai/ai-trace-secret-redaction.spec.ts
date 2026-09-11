/**
 * e2e-bug.464 — credentials must not reach `ai_command_trace.prompt_raw`.
 *
 * The column is non-nullable `text` with **no retention policy**: nothing in
 * `src` deletes from the table and the entity has no TTL, so anything stored
 * here is stored permanently. The gateway persists every command result
 * (`shouldPersistCommandTrace` is a de-duplication guard, not a filter), and
 * `command-completion.validator.ts` actively invites the user to type an
 * OpenAI key into the conversation.
 *
 * The redaction seam already existed and was already correct for PHI — it
 * simply had no credential patterns.
 */
import {
  redactCommandTracePrompt,
  redactCommandTraceParams,
} from './ai-command-trace.util.js';

describe('trace prompts are stripped of credentials', () => {
  it.each([
    // Same shape `parseApiKey` uses to extract a key from prompt text, so the
    // scraper and the redactor cannot drift apart.
    ['Use my OpenAI key sk-proj-AbCdEf1234567890XyZ', 'sk-proj'],
    ['apiToken=9f8e7d6c5b4a3210', '9f8e7d6c5b4a3210'],
    ['api token: 9f8e7d6c5b4a', '9f8e7d6c5b4a'],
    ['password = hunter2hunter2', 'hunter2hunter2'],
  ])('redacts %s', (prompt, secret) => {
    const redacted = redactCommandTracePrompt(prompt);
    expect(redacted).not.toContain(secret);
    expect(redacted).toContain('[REDACTED_SECRET]');
  });

  it.each([
    'Book a massage tomorrow at 3pm',
    'What is my sales tax rate configured to?',
    'Show me my customer reviews and ratings',
    'Create categories Y and Z. Under Y add service A (30 min, $50)',
    'Set up online payments with Stripe',
  ])('leaves ordinary prompts untouched: %s', (prompt) => {
    expect(redactCommandTracePrompt(prompt)).toBe(prompt);
  });

  it('still redacts PHI, which this must not regress', () => {
    expect(redactCommandTracePrompt('symptoms: severe headache')).toContain(
      '[REDACTED_PHI]',
    );
  });

  it('does not yet cover the prose form, and says so', () => {
    // "api token TO x" rather than "api token: x". Extending the pattern to
    // bare prepositions risks redacting ordinary sentences, so this is recorded
    // as a known gap rather than guessed at — see e2e-bug.464.
    expect(
      redactCommandTracePrompt('Set the Zendesk api token to 9f8e7d6c5b4a3210'),
    ).toContain('9f8e7d6c5b4a3210');
  });
});

describe('trace params are stripped of credentials too (§222)', () => {
  // The prompt half has been redacted since §170. The structured half was not:
  // `redactCommandTraceParams` ran `redactPhiFromValue` only, which knows about
  // patients and nothing about secrets. So a key was scrubbed out of
  // `promptRaw` and stored verbatim one column over in `params.apiKey` — same
  // value, same row, same trace. Redacting one half of a record is not
  // redacting the record.
  it('redacts an api key and an access token', () => {
    const out = redactCommandTraceParams({
      apiKey: 'sk-live1234567890abcdefghij',
      accessToken: 'EAAGtok3nvalue000111222',
    });

    expect(out).toEqual({
      apiKey: '[REDACTED_SECRET]',
      accessToken: '[REDACTED_SECRET]',
    });
  });

  it('leaves ordinary params alone', () => {
    // The redaction is keyed on field name, so the guard that matters is that
    // it stays narrow: a trace with every field masked is no more useful than
    // no trace.
    const out = redactCommandTraceParams({
      apiKey: 'sk-live1234567890abcdefghij',
      usePlatformDefault: false,
      serviceName: 'Haircut',
      limit: 10,
    });

    expect(out).toMatchObject({
      usePlatformDefault: false,
      serviceName: 'Haircut',
      limit: 10,
    });
  });

  it('does not invent a redaction marker for an absent credential', () => {
    // Masking a key that was never sent would read, in the trace, as though
    // the user had supplied one.
    const out = redactCommandTraceParams({ serviceName: 'Haircut' });
    expect(out).toEqual({ serviceName: 'Haircut' });
    expect(out).not.toHaveProperty('apiKey');
  });
});
