/**
 * tech-debt B8 / e2e-bug.401 — the conversation state store.
 *
 * ## Why Redis
 *
 * Decided 2026-08-04 with the deployment answer. Production runs a **single**
 * backend instance today (`deploy/docker-compose.prod.yml` declares one
 * `backend:` with no `replicas:`; each nginx upstream names one server), so an
 * in-process `Map` would work *right now* — but horizontal scaling is expected,
 * which makes process-local state a future silent-corruption bug.
 *
 * Redis was already provisioned in both `docker-compose.yml` and
 * `deploy/docker-compose.prod.yml`, `ioredis` was already a dependency, and
 * `app.config.ts` already read `REDIS_HOST`/`REDIS_PORT` — while **no line of
 * `src/` used any of it**. The infrastructure was deployed, running and idle.
 *
 * It also fits B3 (`e2e-bug.369`, "stale clarifications never expire"): with
 * Redis, expiry is a storage primitive (`SET ... EX`) rather than a sweeper to
 * write, schedule and monitor.
 *
 * ## Safety properties
 *
 * This activates a dependency that has never been on a request path, so every
 * property below is about *not* making things worse:
 *
 * 1. **Off by default.** Nothing reads this store yet — B3 and B5 will. Until
 *    then `AI_CONVERSATION_STATE_ENABLED` is unset and every method is a no-op,
 *    so shipping it changes no runtime behaviour.
 * 2. **Never throws.** Every failure is swallowed and logged. Losing context
 *    degrades an answer; an exception would fail a request that would otherwise
 *    have succeeded.
 * 3. **Cannot hang a request.** `enableOfflineQueue: false` plus a short
 *    connect timeout means a down Redis fails *immediately* instead of queueing
 *    commands until they time out. A dead cache must not become added latency.
 * 4. **Lazy.** No connection is opened until the first enabled call, so a dev
 *    machine without Redis never sees connection noise.
 */
import { Injectable, Logger, Optional, type OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import {
  decodeConversationState,
  encodeConversationState,
} from './ai-conversation-state.codec.js';
import type { ConversationState } from './ai-conversation-state.types.js';

export const CONVERSATION_STATE_ENABLED_KEY = 'AI_CONVERSATION_STATE_ENABLED';
export const CONVERSATION_STATE_TTL_KEY = 'AI_CONVERSATION_STATE_TTL_SECONDS';

/**
 * 12 hours.
 *
 * Long enough that a conversation resumed after lunch still knows what "it"
 * meant; short enough that resolved customer names are not retained
 * indefinitely. The TTL is refreshed on every write, so an active conversation
 * never expires mid-use.
 */
export const DEFAULT_TTL_SECONDS = 12 * 60 * 60;

/** Namespaced and versioned so a shape change cannot read old records. */
export function conversationStateKey(conversationId: string): string {
  return `ai:conv:v1:${conversationId}`;
}

/** The slice of ioredis this store uses — keeps tests free of a real client. */
export interface ConversationStateClient {
  get(key: string): Promise<string | null>;
  set(
    key: string,
    value: string,
    mode: 'EX',
    ttlSeconds: number,
  ): Promise<unknown>;
  del(key: string): Promise<unknown>;
  quit(): Promise<unknown>;
}

@Injectable()
export class AiConversationStateStore implements OnModuleDestroy {
  private readonly logger = new Logger(AiConversationStateStore.name);
  private client: ConversationStateClient | null = null;
  /** Set once a connection attempt has failed, so we stop retrying per request. */
  private clientUnavailable = false;

  constructor(
    @Optional() private readonly config?: ConfigService,
    /** Injected by tests; production builds one lazily. */
    @Optional() injectedClient?: ConversationStateClient,
  ) {
    if (injectedClient) this.client = injectedClient;
  }

  private setting(key: string): string | undefined {
    return this.config?.get<string>(key) ?? process.env[key];
  }

  isEnabled(): boolean {
    const raw = this.setting(CONVERSATION_STATE_ENABLED_KEY);
    return raw === '1' || raw?.toLowerCase() === 'true';
  }

  ttlSeconds(): number {
    const raw = Number(this.setting(CONVERSATION_STATE_TTL_KEY));
    return Number.isFinite(raw) && raw > 0 ? Math.floor(raw) : DEFAULT_TTL_SECONDS;
  }

  private resolveClient(): ConversationStateClient | null {
    if (this.client) return this.client;
    if (this.clientUnavailable) return null;

    try {
      this.client = new Redis({
        host: this.setting('REDIS_HOST') ?? 'localhost',
        port: Number(this.setting('REDIS_PORT') ?? 6379),
        lazyConnect: true,
        // A down Redis must fail fast rather than queue commands until they
        // time out — otherwise an outage becomes latency on every AI request.
        enableOfflineQueue: false,
        maxRetriesPerRequest: 1,
        connectTimeout: 1000,
      }) as unknown as ConversationStateClient;
      // ioredis emits 'error' on an EventEmitter; unhandled, it would crash the
      // process. Swallow it here — `isEnabled` callers already tolerate misses.
      (this.client as unknown as { on?: (e: string, cb: (err: Error) => void) => void }).on?.(
        'error',
        (err: Error) => {
          this.logger.warn(`Conversation state Redis error: ${err.message}`);
        },
      );
      return this.client;
    } catch (err: unknown) {
      this.clientUnavailable = true;
      this.logger.warn(
        `Conversation state store unavailable: ${err instanceof Error ? err.message : String(err)}`,
      );
      return null;
    }
  }

  /**
   * Read a conversation's state.
   *
   * Returns `null` for every miss — disabled, no id, Redis down, unreadable
   * record. Callers cannot distinguish them, and should not: all four mean
   * "start from nothing", which is exactly today's behaviour.
   */
  async load(conversationId: string | null): Promise<ConversationState | null> {
    if (!this.isEnabled() || !conversationId) return null;
    const client = this.resolveClient();
    if (!client) return null;

    try {
      const raw = await client.get(conversationStateKey(conversationId));
      return decodeConversationState(raw);
    } catch (err: unknown) {
      this.logger.warn(
        `Conversation state load failed: ${err instanceof Error ? err.message : String(err)}`,
      );
      return null;
    }
  }

  /** Write, refreshing the TTL. Returns whether it was actually persisted. */
  async save(
    conversationId: string | null,
    state: ConversationState,
  ): Promise<boolean> {
    if (!this.isEnabled() || !conversationId) return false;
    const client = this.resolveClient();
    if (!client) return false;

    try {
      await client.set(
        conversationStateKey(conversationId),
        encodeConversationState(state),
        'EX',
        this.ttlSeconds(),
      );
      return true;
    } catch (err: unknown) {
      this.logger.warn(
        `Conversation state save failed: ${err instanceof Error ? err.message : String(err)}`,
      );
      return false;
    }
  }

  /** Forget a conversation — for topic changes and for privacy erasure. */
  async clear(conversationId: string | null): Promise<void> {
    if (!this.isEnabled() || !conversationId) return;
    const client = this.resolveClient();
    if (!client) return;

    try {
      await client.del(conversationStateKey(conversationId));
    } catch (err: unknown) {
      this.logger.warn(
        `Conversation state clear failed: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  async onModuleDestroy(): Promise<void> {
    if (!this.client) return;
    try {
      await this.client.quit();
    } catch {
      // Shutting down; a failed quit is not worth reporting.
    }
  }
}
