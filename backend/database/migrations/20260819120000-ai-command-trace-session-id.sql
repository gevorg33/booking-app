-- AI-ROADMAP Phase 1 — `session_id` on the command trace.
--
-- This column was deferred for months on the grounds that "nothing in the
-- request identifies a conversation" (e2e-bug.357), and that adding it now
-- would create exactly the permanently-empty column the roadmap warns against.
--
-- §50 removed the premise. `AiCommandDto.history` is replayed IN FULL on every
-- request — the clients send `messages.map(...)` over their entire message
-- list — so the first user message is stable for the life of a conversation and
-- a key is derivable server-side:
--
--   session_id = 'cv_' || left(sha256(user_id || SEP || business_id || SEP ||
--                                     lower(first user message)), 32)
--
-- computed by `deriveConversationIdentity` in `ai-conversation.util.ts`. No
-- client change was needed; the field was already on the wire.
--
-- NULLABLE, and it will stay partly null on purpose. Anonymous public-surface
-- visitors have no `user_id`, and for them the only hash inputs would be the
-- business and the message text — so two strangers opening with "book a
-- haircut" would collide into one conversation and share whatever is keyed by
-- it. A null there is the correct answer, not a gap to backfill.
--
-- Existing rows stay null: the derivation needs the history that accompanied
-- the request, and that was never stored. Backfilling from `prompt_raw` alone
-- would invent conversation boundaries that did not exist.

ALTER TABLE ai_command_trace
  ADD COLUMN IF NOT EXISTS session_id VARCHAR(40);

COMMENT ON COLUMN ai_command_trace.session_id IS
  'Conversation key derived server-side from the replayed history (AI-ROADMAP §50). Null for anonymous visitors by design, and for rows written before 2026-08-07.';

-- Turn number within the conversation, 1 for the opening message.
--
-- Stored alongside because §48's binding expiry needs it and cannot recover it
-- later: the turn index is a property of the request, not of the row.
ALTER TABLE ai_command_trace
  ADD COLUMN IF NOT EXISTS session_turn SMALLINT;

COMMENT ON COLUMN ai_command_trace.session_turn IS
  'User-turn number within the conversation, 1-based. Null when no conversation could be identified.';

-- Follow-up resolution reads a conversation in order; that is the only access
-- pattern, so the index matches it. Partial, because the null rows are the
-- anonymous ones and no query will ever ask for "all conversations that are
-- null".
CREATE INDEX IF NOT EXISTS idx_ai_command_trace_session
  ON ai_command_trace (session_id, created_at)
  WHERE session_id IS NOT NULL;
