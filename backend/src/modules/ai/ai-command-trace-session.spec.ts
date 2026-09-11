/**
 * AI-ROADMAP Phase 1 / §50 — the derived conversation key reaches the trace row.
 *
 * This suite exists because the recurring failure on this programme has been
 * building a correct util and never calling it (e2e-bug.368, .369, .370). The
 * assertions below are deliberately end-to-end through the real builders rather
 * than against `deriveConversationIdentity` directly, which is covered in
 * `ai-conversation.util.spec.ts`.
 */
import { buildGatewayCommandTraceInput } from './ai-command-trace-recorder.util.js';
import { buildAiCommandTraceRow } from './ai-command-trace.util.js';

const params = (over: Record<string, unknown> = {}) =>
  ({
    businessId: '11111111-1111-1111-1111-111111111111',
    userId: '22222222-2222-2222-2222-222222222222',
    prompt: 'book me a haircut tomorrow',
    history: [],
    ...over,
  }) as never;

const result = {
  success: true,
  action: 'create_booking',
  summary: 'Booked.',
  details: {},
};

const build = (over: Record<string, unknown> = {}) =>
  buildGatewayCommandTraceInput({
    params: params(over),
    result,
    surface: 'customer',
    traceId: '33333333-3333-3333-3333-333333333333',
  });

describe('session identity reaches the trace', () => {
  it('populates sessionId on the trace input', () => {
    expect(build().sessionId).toMatch(/^cv_[0-9a-f]{32}$/);
  });

  it('survives into the persisted row, not just the input', () => {
    // The row builder is what TypeORM saves; an input field that never reaches
    // it is the same as not having it.
    const row = buildAiCommandTraceRow(build());
    expect(row.sessionId).toMatch(/^cv_/);
    expect(row.sessionTurn).toBe(1);
  });

  it('gives the same sessionId to a later turn of one conversation', () => {
    // The property the column exists for.
    const first = build();
    const second = build({
      history: [
        { role: 'user', content: 'book me a haircut tomorrow' },
        { role: 'assistant', content: 'What time?' },
      ],
      prompt: '3pm',
    });
    expect(second.sessionId).toBe(first.sessionId);
    expect(second.sessionTurn).toBe(2);
  });

  it('records null for an anonymous visitor rather than a colliding id', () => {
    // Two strangers opening identically must not share a conversation.
    const anon = build({ userId: undefined });
    expect(anon.sessionId).toBeNull();
    expect(buildAiCommandTraceRow(anon).sessionId).toBeNull();
  });

  it('still records the turn index when there is no conversation id', () => {
    const anon = build({
      userId: undefined,
      history: [{ role: 'user', content: 'a' }],
    });
    expect(anon.sessionId).toBeNull();
    expect(anon.sessionTurn).toBe(2);
  });

  it('separates two users who sent the same opening message', () => {
    const a = build();
    const b = build({ userId: '44444444-4444-4444-4444-444444444444' });
    expect(b.sessionId).not.toBe(a.sessionId);
  });

  it('fits the column width', () => {
    // session_id is VARCHAR(40); `cv_` + 32 hex = 35.
    expect(build().sessionId!.length).toBeLessThanOrEqual(40);
  });
});
