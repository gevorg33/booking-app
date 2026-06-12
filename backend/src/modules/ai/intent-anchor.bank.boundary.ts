/**
 * pipe-1.4.1 — intent anchor bank must stay generic (no person names, codes, emails).
 * @see docs/INTENT_ANCHOR_BANK_BOUNDARY.md
 */
export const INTENT_ANCHOR_BANK_BOUNDARY_DOC =
  'docs/INTENT_ANCHOR_BANK_BOUNDARY.md';

export const INTENT_ANCHOR_BOUNDARY_MARKER = 'pipe-1.4.1';

/** Data files that define anchor phrases shown to semantic matcher. */
export const INTENT_ANCHOR_BANK_DATA_FILES = [
  'intent-phrasing.bank.ts',
  'intent-anchor.bank.ts',
] as const;

/** Forbidden in anchor phrases and concept-group tokens. */
export const INTENT_ANCHOR_FORBIDDEN_ENTITY_TOKENS = [
  'anna',
  'maria',
  'james',
  'gevorg',
  'mary',
  'karo',
  'sophie',
  'john',
  'jane',
  'lisa',
  'david',
  'sarah',
] as const;
