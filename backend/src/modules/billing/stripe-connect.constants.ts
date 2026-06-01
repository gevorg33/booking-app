/** Human-readable labels for Connect country picker (ISO 3166-1 alpha-2). */
export const STRIPE_CONNECT_COUNTRY_LABELS: Record<string, string> = {
  AE: 'United Arab Emirates',
  AM: 'Armenia',
  BH: 'Bahrain',
  CA: 'Canada',
  CH: 'Switzerland',
  DE: 'Germany',
  ES: 'Spain',
  FR: 'France',
  GB: 'United Kingdom',
  GE: 'Georgia',
  IT: 'Italy',
  KW: 'Kuwait',
  NL: 'Netherlands',
  OM: 'Oman',
  QA: 'Qatar',
  SA: 'Saudi Arabia',
  US: 'United States',
};

/** Self-serve defaults per platform country — conservative; expand via env after Stripe approves corridors. */
export const DEFAULT_CONNECT_COUNTRIES_BY_PLATFORM: Record<string, string[]> = {
  AE: ['AE'],
  US: ['US', 'CA', 'GB', 'DE', 'FR'],
  GB: ['GB', 'US', 'DE', 'FR', 'IE'],
};

export function parseAllowedConnectCountries(raw: string | undefined, platformDefault: string): string[] {
  if (raw?.trim()) {
    const parsed = raw
      .split(',')
      .map((c) => c.trim().toUpperCase())
      .filter((c) => /^[A-Z]{2}$/.test(c));
    if (parsed.length) return [...new Set(parsed)];
  }
  return (
    DEFAULT_CONNECT_COUNTRIES_BY_PLATFORM[platformDefault] ?? [platformDefault]
  );
}
