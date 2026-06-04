import type { MessageTree } from './types';

/** Deep-merge locale catalog over English so missing keys fall back to en. */
export function deepMergeMessages(base: MessageTree, override: MessageTree): MessageTree {
  const result: MessageTree = { ...base };
  for (const key of Object.keys(override)) {
    const ov = override[key];
    const b = base[key];
    if (
      ov != null &&
      typeof ov === 'object' &&
      !Array.isArray(ov) &&
      b != null &&
      typeof b === 'object' &&
      !Array.isArray(b)
    ) {
      result[key] = deepMergeMessages(b as MessageTree, ov as MessageTree);
    } else if (ov !== undefined) {
      result[key] = ov;
    }
  }
  return result;
}
