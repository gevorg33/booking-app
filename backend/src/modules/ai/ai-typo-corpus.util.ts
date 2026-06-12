export type TypoVariantKind = 'lowercase' | 'no_punctuation' | 'compact_spacing';

export type TypoVariant = {
  kind: TypoVariantKind;
  prompt: string;
};

export function lowercasePrompt(prompt: string): string {
  return prompt.toLowerCase();
}

export function stripPromptPunctuation(prompt: string): string {
  return prompt.replace(/[?!.,;:]+/g, '').replace(/\s+/g, ' ').trim();
}

export function compactPromptSpacing(prompt: string): string {
  return prompt.replace(/\s+/g, ' ').trim();
}

/** acc-2.5 — deterministic typo/fuzzy variants that must still rescue correctly. */
export function generateTypoVariants(prompt: string): TypoVariant[] {
  const base = prompt.trim();
  if (!base) return [];

  const variants: TypoVariant[] = [];
  const seenKeys = new Set<string>();

  const push = (kind: TypoVariantKind, value: string) => {
    const normalized = value.trim();
    if (!normalized || normalized === base) return;
    const key = normalized.toLowerCase();
    if (seenKeys.has(key)) return;
    seenKeys.add(key);
    variants.push({ kind, prompt: normalized });
  };

  push('lowercase', lowercasePrompt(base));

  if (/[?!.,;:]/i.test(base)) {
    push('no_punctuation', stripPromptPunctuation(base));
  }

  push('compact_spacing', base.replace(/\s+/g, '  '));

  return variants;
}
