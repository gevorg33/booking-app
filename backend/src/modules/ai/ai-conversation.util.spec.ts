/**
 * AI-ROADMAP Phase 1 / Phase 6 — conversation identity from replayed history.
 *
 * The load-bearing property is stability: turn 1 and turn 5 of one conversation
 * must produce the same id, or the entity store it keys is worthless. The
 * second is isolation: two people must never share an id, because the store
 * behind it holds resolved customer names.
 */
import {
  buildTurnBuffer,
  DEFAULT_TURN_BUFFER_SIZE,
  deriveConversationIdentity,
  looksTruncated,
  previousUserMessage,
  type ConversationTurn,
} from './ai-conversation.util.js';

const turn = (
  role: ConversationTurn['role'],
  content: string,
): ConversationTurn => ({ role, content });

const base = {
  userId: 'u1',
  businessId: 'b1',
  history: [] as ConversationTurn[],
  prompt: 'book me a haircut tomorrow',
};

describe('deriveConversationIdentity', () => {
  describe('stability across turns — the whole point', () => {
    it('gives turn 1 and turn 2 the same id', () => {
      // Turn 1: history empty, the prompt IS the anchor.
      const first = deriveConversationIdentity(base);
      // Turn 2: the client replays turn 1 and sends a new prompt.
      const second = deriveConversationIdentity({
        ...base,
        history: [
          turn('user', 'book me a haircut tomorrow'),
          turn('assistant', 'What time suits you?'),
        ],
        prompt: '3pm',
      });
      expect(first.conversationId).not.toBeNull();
      expect(second.conversationId).toBe(first.conversationId);
    });

    it('stays stable across many turns', () => {
      const history: ConversationTurn[] = [
        turn('user', 'book me a haircut tomorrow'),
      ];
      const ids = new Set<string>();
      for (let i = 0; i < 6; i += 1) {
        const id = deriveConversationIdentity({
          ...base,
          history: [...history],
          prompt: `follow up ${i}`,
        }).conversationId;
        if (id) ids.add(id);
        history.push(turn('assistant', `reply ${i}`));
        history.push(turn('user', `follow up ${i}`));
      }
      expect(ids.size).toBe(1);
    });

    it('is not disturbed by the current prompt changing', () => {
      const a = deriveConversationIdentity({
        ...base,
        history: [turn('user', 'book me a haircut tomorrow')],
        prompt: 'actually make it friday',
      });
      const b = deriveConversationIdentity({
        ...base,
        history: [turn('user', 'book me a haircut tomorrow')],
        prompt: 'never mind, cancel',
      });
      expect(a.conversationId).toBe(b.conversationId);
    });

    it('starts a new conversation when the client clears history', () => {
      // `setMessages([])` resets the thread; the next message is a new anchor.
      const original = deriveConversationIdentity({
        ...base,
        history: [turn('user', 'book me a haircut tomorrow')],
        prompt: 'x',
      });
      const fresh = deriveConversationIdentity({
        ...base,
        history: [],
        prompt: 'show me my invoices',
      });
      expect(fresh.conversationId).not.toBe(original.conversationId);
    });

    it('ignores case and surrounding whitespace in the anchor', () => {
      const a = deriveConversationIdentity(base);
      const b = deriveConversationIdentity({
        ...base,
        prompt: '  Book Me A Haircut Tomorrow  ',
      });
      expect(b.conversationId).toBe(a.conversationId);
    });
  });

  describe('isolation — ids must never be shared', () => {
    it('separates two users who opened identically', () => {
      const a = deriveConversationIdentity(base);
      const b = deriveConversationIdentity({ ...base, userId: 'u2' });
      expect(b.conversationId).not.toBe(a.conversationId);
    });

    it('separates two businesses', () => {
      const a = deriveConversationIdentity(base);
      const b = deriveConversationIdentity({ ...base, businessId: 'b2' });
      expect(b.conversationId).not.toBe(a.conversationId);
    });

    it('separates ids whose fields concatenate identically', () => {
      // Without a field separator these are the same byte string: "ab"+"c" and
      // "a"+"bc" both give "abc", so two tenants would share a conversation and
      // therefore an entity store. This is the case the separator exists for —
      // it must be a genuine collision, not merely two different inputs.
      const a = deriveConversationIdentity({
        ...base,
        userId: 'ab',
        businessId: 'c',
      });
      const b = deriveConversationIdentity({
        ...base,
        userId: 'a',
        businessId: 'bc',
      });
      expect(a.conversationId).not.toBe(b.conversationId);
    });

    it('refuses to identify an anonymous visitor', () => {
      // Without a userId the only inputs are business + text, so two strangers
      // opening with "book a haircut" would hash alike and then share an
      // entity store holding resolved customer names.
      const result = deriveConversationIdentity({ ...base, userId: null });
      expect(result.conversationId).toBeNull();
      expect(result.reason).toContain('anonymous');
    });

    it('refuses when there is no message to anchor to', () => {
      const result = deriveConversationIdentity({
        ...base,
        history: [],
        prompt: '   ',
      });
      expect(result.conversationId).toBeNull();
    });
  });

  describe('turnIndex', () => {
    it('is 1 for the opening message', () => {
      expect(deriveConversationIdentity(base).turnIndex).toBe(1);
    });

    it('counts user turns, not assistant replies', () => {
      const result = deriveConversationIdentity({
        ...base,
        history: [
          turn('user', 'a'),
          turn('assistant', 'r1'),
          turn('assistant', 'r2'),
          turn('user', 'b'),
        ],
        prompt: 'c',
      });
      expect(result.turnIndex).toBe(3);
    });

    it('is reported even when no id could be derived', () => {
      // §48's binding expiry needs the turn count regardless of identity.
      const result = deriveConversationIdentity({
        ...base,
        userId: null,
        history: [turn('user', 'a')],
      });
      expect(result.conversationId).toBeNull();
      expect(result.turnIndex).toBe(2);
    });
  });
});

describe('buildTurnBuffer', () => {
  const long: ConversationTurn[] = Array.from({ length: 30 }, (_, i) =>
    turn(i % 2 === 0 ? 'user' : 'assistant', `m${i}`),
  );

  it('keeps the most recent turns, not the oldest', () => {
    // A follow-up refers to what was just said.
    const buffer = buildTurnBuffer(long, 4);
    expect(buffer.map((t) => t.content)).toEqual(['m26', 'm27', 'm28', 'm29']);
  });

  it('bounds a history the clients do not bound', () => {
    // The clients replay the entire conversation, so an unbounded buffer grows
    // without limit and is billed per token.
    expect(buildTurnBuffer(long)).toHaveLength(DEFAULT_TURN_BUFFER_SIZE);
  });

  it('returns everything when the history is shorter than the window', () => {
    expect(buildTurnBuffer([turn('user', 'a')], 10)).toHaveLength(1);
  });

  it('handles an empty history', () => {
    expect(buildTurnBuffer([])).toEqual([]);
  });

  it('returns nothing for a zero or negative window', () => {
    expect(buildTurnBuffer(long, 0)).toEqual([]);
    expect(buildTurnBuffer(long, -1)).toEqual([]);
  });

  it('copies rather than aliasing the caller history', () => {
    const history = [turn('user', 'a')];
    const buffer = buildTurnBuffer(history, 1);
    buffer[0].content = 'mutated';
    expect(history[0].content).toBe('a');
  });
});

describe('previousUserMessage', () => {
  it('finds the last user message, skipping assistant replies', () => {
    expect(
      previousUserMessage([
        turn('user', 'first'),
        turn('user', 'second'),
        turn('assistant', 'reply'),
      ]),
    ).toBe('second');
  });

  it('returns null on the opening turn', () => {
    expect(previousUserMessage([])).toBeNull();
  });

  it('returns null when only the assistant has spoken', () => {
    expect(previousUserMessage([turn('assistant', 'hello')])).toBeNull();
  });
});

describe('looksTruncated', () => {
  it('flags an assistant-first history', () => {
    // The clients seed no greeting — `ConsumerBookingAssistant` initialises
    // `messages` to []. So an assistant-first history means turns were dropped,
    // which would move the anchor and silently split the conversation.
    expect(looksTruncated([turn('assistant', 'hi'), turn('user', 'a')])).toBe(
      true,
    );
  });

  it('does not flag a normal user-first history', () => {
    expect(looksTruncated([turn('user', 'a'), turn('assistant', 'r')])).toBe(
      false,
    );
  });

  it('does not flag an empty history', () => {
    // Turn 1 is not truncation.
    expect(looksTruncated([])).toBe(false);
  });
});
