/**
 * tech-debt B8 / e2e-bug.401 — conversation state store.
 *
 * The store sits in front of a dependency that has never been on a request
 * path, so most of these assertions are about what it must *not* do: not run
 * unless asked, not throw, not hang, not trust a corrupted record.
 */
import {
  AiConversationStateStore,
  CONVERSATION_STATE_ENABLED_KEY,
  CONVERSATION_STATE_TTL_KEY,
  DEFAULT_TTL_SECONDS,
  conversationStateKey,
  type ConversationStateClient,
} from './ai-conversation-state.store.js';
import {
  decodeConversationState,
  encodeConversationState,
} from './ai-conversation-state.codec.js';
import {
  createConversationState,
  CONVERSATION_STATE_VERSION,
} from './ai-conversation-state.types.js';
import { createEntityStore, recordResolution } from './ai-entity-store.util.js';

const CONVERSATION_ID = 'cv_abc123';

function sampleState() {
  const store = recordResolution(createEntityStore(CONVERSATION_ID), {
    kind: 'appointment',
    id: 'apt-1',
    label: "John's 3pm",
    turnIndex: 2,
    recordedAt: new Date('2026-08-04T10:00:00.000Z'),
  });
  return createConversationState(store);
}

function fakeClient(overrides: Partial<ConversationStateClient> = {}) {
  const calls: Array<{ op: string; args: unknown[] }> = [];
  const data = new Map<string, string>();
  const client: ConversationStateClient = {
    get: async (key) => {
      calls.push({ op: 'get', args: [key] });
      return data.get(key) ?? null;
    },
    set: async (key, value, mode, ttl) => {
      calls.push({ op: 'set', args: [key, value, mode, ttl] });
      data.set(key, value);
      return 'OK';
    },
    del: async (key) => {
      calls.push({ op: 'del', args: [key] });
      data.delete(key);
      return 1;
    },
    quit: async () => 'OK',
    ...overrides,
  };
  return { client, calls, data };
}

function buildStore(
  enabled: boolean,
  client: ConversationStateClient,
  ttl?: string,
) {
  const config = {
    get: (key: string) => {
      if (key === CONVERSATION_STATE_ENABLED_KEY)
        return enabled ? 'true' : undefined;
      if (key === CONVERSATION_STATE_TTL_KEY) return ttl;
      return undefined;
    },
  };
  return new AiConversationStateStore(config as never, client);
}

describe('AiConversationStateStore — off by default', () => {
  const original = process.env[CONVERSATION_STATE_ENABLED_KEY];
  afterEach(() => {
    if (original === undefined)
      delete process.env[CONVERSATION_STATE_ENABLED_KEY];
    else process.env[CONVERSATION_STATE_ENABLED_KEY] = original;
  });

  it('is disabled when nothing is configured, and touches Redis not at all', async () => {
    delete process.env[CONVERSATION_STATE_ENABLED_KEY];
    const { client, calls } = fakeClient();
    const store = new AiConversationStateStore(undefined, client);

    expect(store.isEnabled()).toBe(false);
    expect(await store.load(CONVERSATION_ID)).toBeNull();
    expect(await store.save(CONVERSATION_ID, sampleState())).toBe(false);
    await store.clear(CONVERSATION_ID);

    // Shipping this must change no runtime behaviour until B3/B5 enable it.
    expect(calls).toHaveLength(0);
  });

  it('accepts only explicit truthy flags', () => {
    const { client } = fakeClient();
    for (const [raw, expected] of [
      ['true', true],
      ['TRUE', true],
      ['1', true],
      ['false', false],
      ['0', false],
      ['yes', false],
      ['', false],
    ] as const) {
      process.env[CONVERSATION_STATE_ENABLED_KEY] = raw;
      const store = new AiConversationStateStore(undefined, client);
      expect(store.isEnabled()).toBe(expected);
    }
  });
});

describe('AiConversationStateStore — round trip', () => {
  it('saves and loads the same entity refs back', async () => {
    const { client } = fakeClient();
    const store = buildStore(true, client);
    const state = sampleState();

    expect(await store.save(CONVERSATION_ID, state)).toBe(true);
    const loaded = await store.load(CONVERSATION_ID);

    expect(loaded?.entityStore.refs).toHaveLength(1);
    expect(loaded?.entityStore.refs[0].id).toBe('apt-1');
    expect(loaded?.entityStore.conversationId).toBe(CONVERSATION_ID);
  });

  it('revives recordedAt as a Date, not the string JSON gives back', async () => {
    // A string here would survive every type check and only misbehave later,
    // when staleness is compared.
    const { client } = fakeClient();
    const store = buildStore(true, client);
    await store.save(CONVERSATION_ID, sampleState());

    const loaded = await store.load(CONVERSATION_ID);
    expect(loaded?.entityStore.refs[0].recordedAt).toBeInstanceOf(Date);
    expect(loaded?.entityStore.refs[0].recordedAt.toISOString()).toBe(
      '2026-08-04T10:00:00.000Z',
    );
  });

  it('writes under a namespaced, versioned key with the TTL applied', async () => {
    const { client, calls } = fakeClient();
    const store = buildStore(true, client);
    await store.save(CONVERSATION_ID, sampleState());

    const set = calls.find((c) => c.op === 'set')!;
    expect(set.args[0]).toBe(`ai:conv:v1:${CONVERSATION_ID}`);
    expect(set.args[2]).toBe('EX');
    expect(set.args[3]).toBe(DEFAULT_TTL_SECONDS);
  });

  it('honours a configured TTL and ignores a nonsensical one', async () => {
    const { client, calls } = fakeClient();
    await buildStore(true, client, '60').save(CONVERSATION_ID, sampleState());
    expect(calls.at(-1)!.args[3]).toBe(60);

    const bad = fakeClient();
    await buildStore(true, bad.client, 'not-a-number').save(
      CONVERSATION_ID,
      sampleState(),
    );
    expect(bad.calls.at(-1)!.args[3]).toBe(DEFAULT_TTL_SECONDS);

    const negative = fakeClient();
    await buildStore(true, negative.client, '-5').save(
      CONVERSATION_ID,
      sampleState(),
    );
    expect(negative.calls.at(-1)!.args[3]).toBe(DEFAULT_TTL_SECONDS);
  });

  it('clears a conversation', async () => {
    const { client } = fakeClient();
    const store = buildStore(true, client);
    await store.save(CONVERSATION_ID, sampleState());
    await store.clear(CONVERSATION_ID);
    expect(await store.load(CONVERSATION_ID)).toBeNull();
  });
});

describe('AiConversationStateStore — a null conversation id is not a key', () => {
  it('never reads or writes for anonymous visitors', async () => {
    // `deriveConversationIdentity` returns null for anonymous visitors on
    // purpose (e2e-bug.371). Writing under a null key would reintroduce
    // exactly the cross-person sharing that decision avoids.
    const { client, calls } = fakeClient();
    const store = buildStore(true, client);

    expect(await store.load(null)).toBeNull();
    expect(await store.save(null, sampleState())).toBe(false);
    await store.clear(null);

    expect(calls).toHaveLength(0);
  });
});

describe('AiConversationStateStore — never throws', () => {
  it('survives a failing read', async () => {
    const { client } = fakeClient({
      get: async () => {
        throw new Error('ECONNREFUSED');
      },
    });
    await expect(
      buildStore(true, client).load(CONVERSATION_ID),
    ).resolves.toBeNull();
  });

  it('survives a failing write and reports it did not persist', async () => {
    const { client } = fakeClient({
      set: async () => {
        throw new Error('READONLY');
      },
    });
    await expect(
      buildStore(true, client).save(CONVERSATION_ID, sampleState()),
    ).resolves.toBe(false);
  });

  it('survives a failing clear', async () => {
    const { client } = fakeClient({
      del: async () => {
        throw new Error('down');
      },
    });
    await expect(
      buildStore(true, client).clear(CONVERSATION_ID),
    ).resolves.toBeUndefined();
  });
});

describe('decodeConversationState — refuses to half-trust a record', () => {
  it('returns null for empty, malformed or non-object payloads', () => {
    for (const raw of [
      '',
      null,
      undefined,
      'not json',
      '42',
      '"a string"',
      '[]',
    ]) {
      expect(decodeConversationState(raw as string | null)).toBeNull();
    }
  });

  it('discards a record written by a different version', () => {
    const encoded = JSON.stringify({
      ...sampleState(),
      version: CONVERSATION_STATE_VERSION + 1,
    });
    expect(decodeConversationState(encoded)).toBeNull();
  });

  it('discards a record with no usable entity store', () => {
    expect(
      decodeConversationState(
        JSON.stringify({ version: CONVERSATION_STATE_VERSION }),
      ),
    ).toBeNull();
    expect(
      decodeConversationState(
        JSON.stringify({
          version: CONVERSATION_STATE_VERSION,
          entityStore: { refs: [] },
        }),
      ),
    ).toBeNull();
  });

  it('drops only the unreadable refs, keeping the good ones', () => {
    // One corrupt ref among several should not cost the others.
    const encoded = JSON.stringify({
      version: CONVERSATION_STATE_VERSION,
      updatedAt: new Date().toISOString(),
      entityStore: {
        conversationId: CONVERSATION_ID,
        refs: [
          {
            kind: 'appointment',
            id: 'good',
            label: 'ok',
            turnIndex: 1,
            recordedAt: '2026-08-04T10:00:00.000Z',
          },
          { kind: 'appointment', id: 'no-date', label: 'x', turnIndex: 1 },
          {
            kind: 'appointment',
            id: 'bad-date',
            label: 'x',
            turnIndex: 1,
            recordedAt: 'nope',
          },
          null,
          'garbage',
        ],
      },
    });

    const decoded = decodeConversationState(encoded);
    expect(decoded?.entityStore.refs.map((r) => r.id)).toEqual(['good']);
  });

  it('round-trips through encode without loss', () => {
    const state = sampleState();
    const decoded = decodeConversationState(encodeConversationState(state));
    expect(decoded?.entityStore).toEqual(state.entityStore);
  });
});
