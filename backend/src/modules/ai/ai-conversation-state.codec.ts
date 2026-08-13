/**
 * tech-debt B8 / e2e-bug.401 — serialising conversation state.
 *
 * Kept apart from the store because the interesting failure here is not Redis,
 * it is JSON: `EntityRef.recordedAt` is a `Date`, and `JSON.parse` gives back a
 * string. A ref whose `recordedAt` is a string still *looks* fine — it only
 * misbehaves later, when staleness is compared and a string loses to a Date.
 * So decoding revives it explicitly and rejects anything it cannot.
 */
import {
  CONVERSATION_STATE_VERSION,
  type ConversationState,
} from './ai-conversation-state.types.js';
import type { EntityRef, EntityStore } from './ai-entity-store.util.js';

export function encodeConversationState(state: ConversationState): string {
  return JSON.stringify(state);
}

function reviveDate(value: unknown): Date | null {
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  if (typeof value !== 'string' && typeof value !== 'number') return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function reviveRef(raw: unknown): EntityRef | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  const recordedAt = reviveDate(r.recordedAt);
  if (
    typeof r.kind !== 'string' ||
    typeof r.id !== 'string' ||
    typeof r.label !== 'string' ||
    typeof r.turnIndex !== 'number' ||
    !recordedAt
  ) {
    return null;
  }
  return {
    kind: r.kind as EntityRef['kind'],
    id: r.id,
    label: r.label,
    turnIndex: r.turnIndex,
    recordedAt,
  };
}

/**
 * Decode a stored record.
 *
 * Returns `null` for anything unreadable — wrong version, malformed JSON, a
 * missing entity store. Never throws and never partially trusts a record: a
 * conversation that forgets is a worse experience, but a conversation that
 * binds a pronoun to a corrupted ref is a wrong action.
 *
 * Individual unreadable refs are dropped rather than failing the whole record,
 * because one bad ref among twelve should not discard eleven good ones.
 */
export function decodeConversationState(
  raw: string | null | undefined,
): ConversationState | null {
  if (!raw) return null;

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!parsed || typeof parsed !== 'object') return null;

  const record = parsed as Record<string, unknown>;
  if (record.version !== CONVERSATION_STATE_VERSION) return null;

  const store = record.entityStore;
  if (!store || typeof store !== 'object') return null;
  const storeRecord = store as Record<string, unknown>;
  if (typeof storeRecord.conversationId !== 'string') return null;

  const rawRefs = Array.isArray(storeRecord.refs) ? storeRecord.refs : [];
  const refs = rawRefs
    .map(reviveRef)
    .filter((ref): ref is EntityRef => ref !== null);

  const entityStore: EntityStore = {
    conversationId: storeRecord.conversationId,
    refs,
  };

  return {
    version: CONVERSATION_STATE_VERSION,
    entityStore,
    updatedAt: reviveDate(record.updatedAt) ?? new Date(0),
  };
}
