import type { MessageTree } from './types';

export function translate(
  messages: MessageTree,
  key: string,
  vars?: Record<string, string | number>,
): string {
  const parts = key.split('.');
  let cur: unknown = messages;
  for (const part of parts) {
    if (cur == null || typeof cur !== 'object') return key;
    cur = (cur as MessageTree)[part];
  }
  if (typeof cur !== 'string') return key;
  if (!vars) return cur;
  return cur.replace(/\{(\w+)\}/g, (_, name: string) =>
    vars[name] !== undefined ? String(vars[name]) : `{${name}}`,
  );
}
