import type { EntityMemory, EntityMemoryEntry } from './ai-settings.types.js';

export const ENTITY_MEMORY_ALIAS_LIMIT = 20;

/**
 * `customerName` must never enter or leave the shared alias map — e2e-bug.371.
 *
 * `AiEntityMemoryService` keys one map per **business**, with no user
 * dimension, and every user of that business both contributes to it and is
 * served from it. `employeeName`, `serviceName` and `templateName` are
 * business-level facts and sharing them is the point. A customer's name is not
 * a business-level fact.
 *
 * There were two paths out, and the second is the worse one:
 *
 * 1. `formatEntityMemoryContextBlock` printed `customer=<name>` into the
 *    classifier context of whoever asked next — disclosure;
 * 2. `applyEntityMemoryToParams` wrote `customerName` **and**
 *    `waitlistCustomerName` into command params — so one person's customer could
 *    be *acted on* in another person's request, not merely mentioned.
 *
 * Enforced on read as well as on write, deliberately. Stopping the writes would
 * leave every name already in the map still reachable; filtering the reads
 * neutralises the stored data without a migration. Purging it is still worth
 * doing and is tracked separately.
 *
 * Per-user memory would keep the capability, and is the right shape if anyone
 * wants "my regular" back. It needs a user dimension in storage
 * (`e2e-bug.401`), which does not exist yet — and until it does, the safe entry
 * is no entry.
 */
export function stripSharedEntityMemoryPii(
  entry: EntityMemoryEntry,
): EntityMemoryEntry {
  const { customerName: _customerName, ...shareable } = entry;
  return shareable;
}

export function normalizeEntityAlias(alias: string): string {
  return alias.toLowerCase().trim();
}

export function formatEntityMemoryLine(
  alias: string,
  entry: EntityMemoryEntry,
): string {
  const parts: string[] = [];
  if (entry.employeeName) parts.push(`provider=${entry.employeeName}`);
  if (entry.serviceName) parts.push(`service=${entry.serviceName}`);
  // e2e-bug.371 — never `customer=`; see `stripSharedEntityMemoryPii`.
  if (entry.templateName) parts.push(`template=${entry.templateName}`);
  return `"${alias}" → ${parts.join(', ') || '—'}`;
}

export function formatEntityMemoryContextBlock(
  memory: EntityMemory,
  limit = ENTITY_MEMORY_ALIAS_LIMIT,
): string {
  const entries = Object.entries(memory.aliases ?? {});
  if (entries.length === 0) return '';

  const lines = entries
    .slice(0, limit)
    .map(([alias, entry]) => formatEntityMemoryLine(alias, entry));
  return `Learned entity defaults for this business (use when user mentions alias):\n${lines.join('\n')}`;
}

/** Fill missing params from learned aliases when the prompt mentions the alias. */
export function applyEntityMemoryToParams(
  params: Record<string, unknown>,
  memory: EntityMemory,
  prompt: string,
): Record<string, unknown> {
  const next = { ...params };
  const lowerPrompt = prompt.toLowerCase();
  const aliases = memory.aliases ?? {};

  for (const [alias, entry] of Object.entries(aliases)) {
    const key = normalizeEntityAlias(alias);
    if (!key || !lowerPrompt.includes(key)) continue;

    if (!next.employeeName && entry.employeeName)
      next.employeeName = entry.employeeName;
    if (!next.serviceName && entry.serviceName)
      next.serviceName = entry.serviceName;
    if (!next.templateName && entry.templateName)
      next.templateName = entry.templateName;
    // e2e-bug.371 — `customerName` and `waitlistCustomerName` are deliberately
    // not filled from this map. They named a person from whichever
    // conversation happened to teach the alias, and this map is shared by
    // every user of the business.
  }

  return next;
}

export function findAliasMentionsInPrompt(
  prompt: string,
  aliases: Record<string, EntityMemoryEntry>,
): string[] {
  const lower = prompt.toLowerCase();
  return Object.keys(aliases).filter((alias) =>
    lower.includes(normalizeEntityAlias(alias)),
  );
}
