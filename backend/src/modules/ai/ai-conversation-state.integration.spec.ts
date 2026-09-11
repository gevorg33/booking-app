/**
 * tech-debt B8 / e2e-bug.401 — against a real Redis.
 *
 * The unit spec drives a hand-written fake. A fake can drift from the real
 * client: `set(key, value, 'EX', ttl)` is an ioredis overload, and TTL
 * behaviour is a server feature no fake can prove. This file runs the same
 * store against an actual Redis and checks the two things only the real server
 * can answer — that the write lands under the expected key, and that the TTL
 * is applied.
 *
 * Skipped, not failed, when no Redis is reachable: `docker-compose.yml`
 * provides one for development, but the suite must stay runnable without it.
 */
import Redis from 'ioredis';
import {
  AiConversationStateStore,
  CONVERSATION_STATE_ENABLED_KEY,
  CONVERSATION_STATE_TTL_KEY,
  conversationStateKey,
  type ConversationStateClient,
} from './ai-conversation-state.store.js';
import { createConversationState } from './ai-conversation-state.types.js';
import { createEntityStore, recordResolution } from './ai-entity-store.util.js';

const HOST = process.env.REDIS_HOST ?? 'localhost';
const PORT = Number(process.env.REDIS_PORT ?? 6379);
const CONVERSATION_ID = `cv_test_${Date.now()}`;

let redis: Redis | null = null;
let reachable = false;

beforeAll(async () => {
  try {
    redis = new Redis({
      host: HOST,
      port: PORT,
      lazyConnect: true,
      enableOfflineQueue: false,
      maxRetriesPerRequest: 1,
      connectTimeout: 500,
    });
    redis.on('error', () => {});
    await redis.connect();
    await redis.ping();
    reachable = true;
  } catch {
    reachable = false;
    if (redis) {
      redis.disconnect();
      redis = null;
    }
  }
});

afterAll(async () => {
  if (!redis) return;
  try {
    await redis.del(conversationStateKey(CONVERSATION_ID));
  } catch {
    // best effort
  }
  redis.disconnect();
});

function buildStore(ttl?: string) {
  const config = {
    get: (key: string) => {
      if (key === CONVERSATION_STATE_ENABLED_KEY) return 'true';
      if (key === CONVERSATION_STATE_TTL_KEY) return ttl;
      if (key === 'REDIS_HOST') return HOST;
      if (key === 'REDIS_PORT') return String(PORT);
      return undefined;
    },
  };
  return new AiConversationStateStore(
    config as never,
    redis as unknown as ConversationStateClient,
  );
}

function sampleState() {
  return createConversationState(
    recordResolution(createEntityStore(CONVERSATION_ID), {
      kind: 'appointment',
      id: 'apt-real',
      label: 'Real Redis appointment',
      turnIndex: 1,
      recordedAt: new Date('2026-08-04T09:30:00.000Z'),
    }),
  );
}

describe('AiConversationStateStore against a real Redis', () => {
  it('reports whether these assertions actually ran', () => {
    // Every test below early-returns when Redis is absent, which makes a skip
    // indistinguishable from a pass. This one prints the truth so a green run
    // on a machine without Redis cannot be mistaken for verified behaviour.
    // eslint-disable-next-line no-console
    console.log(
      reachable
        ? `[real-redis] connected to ${HOST}:${PORT} — assertions ran`
        : `[real-redis] NO redis at ${HOST}:${PORT} — assertions SKIPPED`,
    );
    expect(typeof reachable).toBe('boolean');
  });

  it('round-trips state through the actual client', async () => {
    if (!reachable) return; // no Redis here — covered by the unit spec
    const store = buildStore();

    expect(await store.save(CONVERSATION_ID, sampleState())).toBe(true);
    const loaded = await store.load(CONVERSATION_ID);

    expect(loaded?.entityStore.refs[0].id).toBe('apt-real');
    expect(loaded?.entityStore.refs[0].recordedAt).toBeInstanceOf(Date);
  });

  it('applies a TTL the server actually honours', async () => {
    if (!reachable || !redis) return;
    await buildStore('120').save(CONVERSATION_ID, sampleState());

    const ttl = await redis.ttl(conversationStateKey(CONVERSATION_ID));
    // -1 means "no expiry", which is the bug this asserts against.
    expect(ttl).toBeGreaterThan(0);
    expect(ttl).toBeLessThanOrEqual(120);
  });

  it('refreshes the TTL on rewrite, so an active conversation cannot expire mid-use', async () => {
    if (!reachable || !redis) return;
    const store = buildStore('100');
    await store.save(CONVERSATION_ID, sampleState());
    await redis.expire(conversationStateKey(CONVERSATION_ID), 5);
    expect(
      await redis.ttl(conversationStateKey(CONVERSATION_ID)),
    ).toBeLessThanOrEqual(5);

    await store.save(CONVERSATION_ID, sampleState());
    expect(
      await redis.ttl(conversationStateKey(CONVERSATION_ID)),
    ).toBeGreaterThan(50);
  });

  it('clear removes the key', async () => {
    if (!reachable || !redis) return;
    const store = buildStore();
    await store.save(CONVERSATION_ID, sampleState());
    await store.clear(CONVERSATION_ID);

    expect(await redis.exists(conversationStateKey(CONVERSATION_ID))).toBe(0);
    expect(await store.load(CONVERSATION_ID)).toBeNull();
  });
});
