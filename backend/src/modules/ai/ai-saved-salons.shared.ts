export type RecentSalonEntry = {
  slug: string;
  name: string;
};

export function parseRecentSalonsFromParams(
  params: Record<string, unknown>,
): RecentSalonEntry[] {
  if (!Array.isArray(params.recentSalons)) return [];
  return params.recentSalons
    .filter(
      (entry): entry is RecentSalonEntry =>
        !!entry &&
        typeof entry === 'object' &&
        typeof (entry as { slug?: string }).slug === 'string' &&
        typeof (entry as { name?: string }).name === 'string',
    )
    .slice(0, 8);
}

export function normalizeSalonMatchText(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, ' ');
}

export function matchRecentSalonByHint(
  recentSalons: RecentSalonEntry[],
  hint: string,
): RecentSalonEntry | null | 'ambiguous' {
  const normalizedHint = normalizeSalonMatchText(hint);
  if (!normalizedHint) return null;

  const slugMatches = recentSalons.filter(
    (salon) => normalizeSalonMatchText(salon.slug) === normalizedHint,
  );
  if (slugMatches.length === 1) return slugMatches[0];

  const nameMatches = recentSalons.filter((salon) => {
    const normalizedName = normalizeSalonMatchText(salon.name);
    return (
      normalizedName === normalizedHint ||
      normalizedName.includes(normalizedHint) ||
      normalizedHint.includes(normalizedName)
    );
  });

  if (nameMatches.length === 1) return nameMatches[0];
  if (nameMatches.length > 1) return 'ambiguous';
  return null;
}

export function extractSalonHintFromPrompt(prompt: string): string | undefined {
  const patterns = [
    /\b(?:go\s+back\s+to|switch\s+to|open|return\s+to|take\s+me\s+to)\s+(.+?)(?:\?|\.|$)/i,
    /\b(?:salon|place|business)\s+(.+?)(?:\?|\.|$)/i,
  ];
  for (const pattern of patterns) {
    const match = prompt.match(pattern);
    const candidate = match?.[1]?.trim();
    if (candidate && candidate.length >= 2) {
      return candidate.replace(/\bsalon\b/i, '').trim();
    }
  }
  return undefined;
}
