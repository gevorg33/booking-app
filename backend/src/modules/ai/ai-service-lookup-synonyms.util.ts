/**
 * Shared service-name synonym expansion for catalog lookup.
 * Kept in a leaf module so rank filters and orchestration helpers can both
 * use it without circular imports (e2e-bug.199).
 */

/** Collapse spaces/punctuation so "face massage" matches catalog "facemassage". */
export function normalizeServiceLookup(text: string): string {
  return text.toLowerCase().replace(/[\s_-]+/g, '');
}

/**
 * e2e-bug.199 — customers say "haircut" but many salon catalogs only list
 * "hairstyle" (exact substring match fails). Expand lookup queries with known
 * aliases; exact catalog names still win before synonyms are tried.
 */
const SERVICE_LOOKUP_SYNONYM_GROUPS: readonly (readonly string[])[] = [
  [
    'haircut',
    'haircuts',
    'hairstyle',
    'hairstyles',
    'hair style',
    'hair styling',
    'haircut style',
    // e2e-bug.298 — rank aliases (trim/cut/style → haircut) must also expand
    // through catalog lookup so recommend/list resolve hairstyle.
    'trim',
    'cut',
    'cuts',
    'style',
    'styles',
    'styling',
  ],
  // e2e-bug.279 — customers say "facial" but catalogs list Face Pilling /
  // Face Plasma / facemassage (no literal "facial"). Alias "face" covers the
  // family via substring match after normalizeServiceLookup.
  [
    'facial',
    'facials',
    'face',
    'facemassage',
    'face massage',
    'face pilling',
    'face plasma',
  ],
];

/** Alternate phrasings for the same service family (original query first). */
export function expandServiceLookupQueries(query: string): string[] {
  const cleaned = query.trim();
  if (!cleaned) return [];
  const normalized = normalizeServiceLookup(cleaned);
  const out: string[] = [cleaned];
  const seen = new Set<string>([normalized]);
  for (const group of SERVICE_LOOKUP_SYNONYM_GROUPS) {
    const hit = group.some(
      (alias) => normalizeServiceLookup(alias) === normalized,
    );
    if (!hit) continue;
    for (const alias of group) {
      const aliasNorm = normalizeServiceLookup(alias);
      if (seen.has(aliasNorm)) continue;
      seen.add(aliasNorm);
      out.push(alias);
    }
  }
  return out;
}

/**
 * e2e-bug.297 — longest synonym-group alias mentioned in the prompt (e.g. "facials"
 * in "show me facials"). Used so list/browse does not collapse a multi-match
 * family onto the first fuzzy catalog hit (Face Pilling).
 */
export function findServiceLookupSynonymTokenInPrompt(
  prompt: string,
): string | null {
  if (!prompt?.trim()) return null;
  let best: string | null = null;
  let bestLen = 0;
  for (const group of SERVICE_LOOKUP_SYNONYM_GROUPS) {
    for (const alias of group) {
      const trimmed = alias.trim();
      if (trimmed.length < 3) continue;
      const escaped = trimmed.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const pattern = new RegExp(
        `\\b${escaped.replace(/\s+/g, '\\s+')}\\b`,
        'i',
      );
      if (!pattern.test(prompt)) continue;
      const normLen = normalizeServiceLookup(trimmed).length;
      if (normLen > bestLen) {
        best = trimmed;
        bestLen = normLen;
      }
    }
  }
  return best;
}
