import {
  recordResolution,
  type EntityRef,
  type EntityRefKind,
  type EntityStore,
} from './ai-entity-store.util.js';
import type { CommandResult } from './command-completion.types.js';

/**
 * e2e-bug.373 — record what a turn resolved, from what the turn reported.
 *
 * The ticket said the §53 entity store *"needs EntityResolutionService to
 * record refs at resolution time, as no after-the-fact source works"*. §231
 * found the first half impossible as stated — that service is injected nowhere
 * — and counted **~44 places** where resolution actually happens. Hooking a
 * subset of them was rejected outright: a store fed by some resolutions and
 * not others is silently incomplete, and anaphora over incomplete refs binds
 * "it" to a confidently wrong entity rather than asking.
 *
 * The second half was not re-examined until now, and it does not hold. Command
 * results carry resolved ids — `details.serviceId`, `details.employeeId`,
 * `details.bookingId` appear in results about as often as the names do — and
 * every result, from every surface, passes through one place:
 * `AiGatewayService.executeCommandPipeline`, where the e2e-bug.401 carrier
 * already holds the store. Recording there means a resolution is captured
 * regardless of which of the 44 paths performed it, which is the coverage
 * property the resolution-time design could not offer without consolidating
 * all 44 first.
 *
 * ## What "incomplete" means now
 *
 * The gap moves from *which path resolved it* to *whether the handler reported
 * it*. A command that resolves an entity and does not surface its id in
 * `details` records nothing for that turn. That is a real gap, but a different
 * kind: it is per-command and visible (a handler either names what it acted
 * on or it does not), where the resolution-site gap was per-code-path and
 * invisible. And it fails safe — a turn that records nothing leaves the store
 * as it was, so an anaphor either binds to a ref that a *reported* resolution
 * wrote, or finds nothing and asks.
 *
 * ## Only success, and only ids
 *
 * A failed command resolved nothing the user acted on — a clarify naming three
 * candidate customers must not record any of them as "the customer". And a
 * name without an id is not recorded: the store exists so that "it" can be
 * acted on without re-resolving, and a label alone would put resolution back
 * on the read path.
 */

/** `details` keys that carry a resolved entity, by kind. */
const ID_FIELDS: ReadonlyArray<{
  kind: EntityRefKind;
  id: string;
  label: readonly string[];
}> = [
  { kind: 'service', id: 'serviceId', label: ['serviceName'] },
  { kind: 'employee', id: 'employeeId', label: ['employeeName'] },
  { kind: 'customer', id: 'customerId', label: ['customerName'] },
  { kind: 'appointment', id: 'bookingId', label: ['serviceName'] },
  { kind: 'package', id: 'packageId', label: ['packageName'] },
];

function asString(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

/**
 * Pull `{kind, id, label}` triples out of a result's `details`.
 *
 * Also understands the nested `details.employee: { id, name }` shape that
 * `buildEntityMemoryLearnPayload` reads, since the dashboard booking handlers
 * report the provider that way.
 */
export function extractEntityRefsFromResult(
  result: Pick<CommandResult, 'success' | 'details'>,
  turnIndex: number,
  now: Date = new Date(),
): EntityRef[] {
  if (!result.success) return [];
  const details = (result.details ?? {}) as Record<string, unknown>;
  const refs: EntityRef[] = [];
  const seen = new Set<string>();

  const push = (kind: EntityRefKind, id: string, label: string) => {
    const key = `${kind}:${id}`;
    if (seen.has(key)) return;
    seen.add(key);
    refs.push({ kind, id, label, turnIndex, recordedAt: now });
  };

  for (const field of ID_FIELDS) {
    const id = asString(details[field.id]);
    if (!id) continue;
    const label =
      field.label.map((k) => asString(details[k])).find(Boolean) ?? id;
    push(field.kind, id, label);
  }

  const employee = details.employee as { id?: unknown; name?: unknown } | null;
  const employeeId = employee ? asString(employee.id) : null;
  if (employeeId) {
    push('employee', employeeId, asString(employee?.name) ?? employeeId);
  }

  return refs;
}

/** Fold a turn's reported resolutions into the store. Newest first. */
export function recordEntityRefsFromResult(
  store: EntityStore,
  result: Pick<CommandResult, 'success' | 'details'>,
  turnIndex: number,
  now: Date = new Date(),
): EntityStore {
  let next = store;
  for (const ref of extractEntityRefsFromResult(result, turnIndex, now)) {
    next = recordResolution(next, ref);
  }
  return next;
}
