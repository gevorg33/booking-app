import { AiConversationCarrierService } from './ai-conversation-carrier.service.js';
import { createConversationState } from './ai-conversation-state.types.js';
import { createEntityStore } from './ai-entity-store.util.js';

/**
 * e2e-bug.401 — the carrier is the part that was missing, so these assert the
 * carrying rather than the store (which has its own suite).
 */
function buildStore(overrides: Record<string, unknown> = {}) {
  return {
    load: jest.fn(async () => null),
    save: jest.fn(async () => true),
    clear: jest.fn(async () => undefined),
    isEnabled: jest.fn(() => true),
    ...overrides,
  };
}

const TURN = {
  userId: 'user-1',
  businessId: 'biz-1',
  history: [] as Array<{ role: 'user' | 'assistant'; content: string }>,
  prompt: 'book me a haircut',
};

describe('AiConversationCarrierService (e2e-bug.401)', () => {
  it('starts a fresh store when nothing was saved before', async () => {
    const store = buildStore();
    const ctx = await new AiConversationCarrierService(store as never).begin(
      TURN,
    );
    expect(ctx.restored).toBe(false);
    expect(ctx.entityStore.refs).toEqual([]);
  });

  it('carries a previous turn’s entity store into this one', async () => {
    // The whole point of the ticket: state crossing a turn boundary.
    const previous = createEntityStore('conv-1');
    previous.refs.push({
      kind: 'service',
      id: 'svc-1',
      label: 'Haircut',
    } as never);
    const store = buildStore({
      load: jest.fn(async () => createConversationState(previous)),
    });

    const ctx = await new AiConversationCarrierService(store as never).begin(
      TURN,
    );

    expect(ctx.restored).toBe(true);
    expect(ctx.entityStore.refs).toHaveLength(1);
  });

  it('keys the load on the derived conversation id', async () => {
    const store = buildStore();
    const ctx = await new AiConversationCarrierService(store as never).begin(
      TURN,
    );
    expect(store.load).toHaveBeenCalledWith(ctx.identity.conversationId);
    expect(ctx.identity.conversationId).toBeTruthy();
  });

  it('is inert for an anonymous visitor', async () => {
    // `deriveConversationIdentity` returns a null id without a userId, and a
    // null id must not be turned into a shared bucket.
    const store = buildStore();
    const carrier = new AiConversationCarrierService(store as never);
    const ctx = await carrier.begin({ ...TURN, userId: null });

    expect(ctx.identity.conversationId).toBeNull();
    expect(store.load).toHaveBeenCalledWith(null);

    carrier.commit(ctx);
    expect(store.save).not.toHaveBeenCalled();
  });

  it('commits the entity store under the same id it loaded', async () => {
    const store = buildStore();
    const carrier = new AiConversationCarrierService(store as never);
    const ctx = await carrier.begin(TURN);

    carrier.commit(ctx);

    expect(store.save).toHaveBeenCalledTimes(1);
    const [id, state] = store.save.mock.calls[0] as [
      string,
      { entityStore: unknown },
    ];
    expect(id).toBe(ctx.identity.conversationId);
    expect(state.entityStore).toBe(ctx.entityStore);
  });

  it('does not await the write, and survives it rejecting', async () => {
    // `commit` runs after the response is built. A slow or failing Redis must
    // cost the next turn its context, never this turn its latency.
    const store = buildStore({
      save: jest.fn(async () => {
        throw new Error('redis down');
      }),
    });
    const carrier = new AiConversationCarrierService(store as never);
    const ctx = await carrier.begin(TURN);

    expect(() => carrier.commit(ctx)).not.toThrow();
    await new Promise((resolve) => setImmediate(resolve));
  });

  it('starts fresh when the load itself fails', async () => {
    // The store swallows its own errors and returns null; this pins that the
    // carrier does not reintroduce a throw on top of it.
    const store = buildStore({ load: jest.fn(async () => null) });
    const ctx = await new AiConversationCarrierService(store as never).begin(
      TURN,
    );
    expect(ctx.restored).toBe(false);
  });

  it('gives successive turns of one conversation the same id', async () => {
    // The id is derived from replayed history, so turn 2 must land on turn 1's
    // record — otherwise the carrier would write a new key every turn and
    // nothing would ever be restored.
    const store = buildStore();
    const carrier = new AiConversationCarrierService(store as never);

    const first = await carrier.begin(TURN);
    const second = await carrier.begin({
      ...TURN,
      history: [
        { role: 'user', content: TURN.prompt },
        { role: 'assistant', content: 'Sure — when?' },
      ],
      prompt: 'tomorrow at 3',
    });

    expect(second.identity.conversationId).toBe(first.identity.conversationId);
    expect(second.identity.turnIndex).toBe(2);
  });
});
