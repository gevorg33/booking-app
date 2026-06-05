import type { EntityMemory, EntityMemoryEntry } from './ai-settings.types.js';

export const ENTITY_MEMORY_ALIAS_LIMIT = 20;

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
  if (entry.customerName) parts.push(`customer=${entry.customerName}`);
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
    if (!next.customerName && entry.customerName)
      next.customerName = entry.customerName;
    if (!next.templateName && entry.templateName)
      next.templateName = entry.templateName;
    if (!next.waitlistCustomerName && entry.customerName) {
      next.waitlistCustomerName = entry.customerName;
    }
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
