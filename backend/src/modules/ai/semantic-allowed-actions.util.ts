import type { CommandSurface } from './ai-command-registry.types.js';
import { CORE_SEMANTIC_INTENT_ACTIONS } from './intent-anchor.bank.js';
import { getIntentAnchorBank } from './intent-anchor.bank.js';

/** pipe-1.4.6 — proves semantic shortlist is wired in the understand pipeline. */
export const SEMANTIC_ALLOWED_ACTIONS_PIPE_MARKER = 'pipe-1.4.6';

/**
 * Surface-specific registry action names that map to semantic anchor actions
 * (public booking uses book_appointment / check_availability in the registry).
 */
const SURFACE_LAST_ACTION_ALIASES: Partial<Record<string, string>> = {
  check_availability: 'check_providers_for_service',
  book_appointment: 'create_booking',
};

/**
 * After these session actions, semantic match stays in the same conversational
 * thread — booking/availability follow-ups or schedule ops — not cross-domain.
 */
const SEMANTIC_LAST_ACTION_FOLLOW_UPS: Record<string, readonly string[]> = {
  check_providers_for_service: [
    'check_providers_for_service',
    'create_booking',
    'book_nearest_slot',
  ],
  check_availability: [
    'check_providers_for_service',
    'create_booking',
    'book_nearest_slot',
  ],
  create_booking: ['create_booking', 'book_nearest_slot'],
  book_nearest_slot: ['book_nearest_slot', 'create_booking'],
  book_appointment: ['create_booking'],
  create_direct_schedule: ['create_direct_schedule'],
  list_schedule_gaps: ['create_direct_schedule'],
  apply_schedule: ['create_direct_schedule'],
  summarize_utilization: ['create_direct_schedule'],
};

function normalizeLastActionForSemantic(lastAction: string): string {
  return SURFACE_LAST_ACTION_ALIASES[lastAction] ?? lastAction;
}

/** Anchor actions that have at least one phrase for the given surface. */
export function resolveSurfaceSemanticActions(
  surface: CommandSurface,
): string[] {
  const actions = new Set<string>();
  for (const anchor of getIntentAnchorBank()) {
    if (!anchor.surfaces.includes(surface)) continue;
    if (
      !(CORE_SEMANTIC_INTENT_ACTIONS as readonly string[]).includes(
        anchor.action,
      )
    ) {
      continue;
    }
    actions.add(anchor.action);
  }
  return [...actions].sort();
}

/**
 * Restrict semantic matcher anchors by surface registry coverage and optional
 * session lastAction follow-up thread (pipe-1.4.6).
 */
export function resolveSemanticAllowedActions(
  surface: CommandSurface,
  lastAction?: string,
): string[] {
  const base = resolveSurfaceSemanticActions(surface);
  if (!base.length) return [];

  const trimmed = lastAction?.trim();
  if (!trimmed) return base;

  const normalized = normalizeLastActionForSemantic(trimmed);
  const followUps = SEMANTIC_LAST_ACTION_FOLLOW_UPS[normalized];
  if (!followUps) return base;

  const allowed = new Set(
    base.filter(
      (action) => followUps.includes(action) || action === normalized,
    ),
  );
  if (base.includes(normalized)) {
    allowed.add(normalized);
  }

  return [...allowed].sort();
}
