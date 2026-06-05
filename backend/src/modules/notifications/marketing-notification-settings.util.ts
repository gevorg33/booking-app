import type { BusinessNotificationSettings } from './notification.types.js';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function parseMarketingTeamEmails(raw: unknown): string[] {
  const candidates: string[] = [];
  if (Array.isArray(raw)) {
    for (const entry of raw) {
      if (typeof entry === 'string') candidates.push(entry);
    }
  } else if (typeof raw === 'string') {
    candidates.push(...raw.split(/[,;\n]+/));
  }

  const seen = new Set<string>();
  const result: string[] = [];
  for (const entry of candidates) {
    const email = entry.trim().toLowerCase();
    if (!email || !EMAIL_RE.test(email) || seen.has(email)) continue;
    seen.add(email);
    result.push(email);
  }
  return result;
}

export function mergeMarketingNotificationSettings(
  raw?: Record<string, unknown>,
): Pick<
  BusinessNotificationSettings,
  'emailOnNewCustomerRegistration' | 'marketingTeamEmails'
> {
  return {
    emailOnNewCustomerRegistration:
      raw?.emailOnNewCustomerRegistration === true,
    marketingTeamEmails: parseMarketingTeamEmails(raw?.marketingTeamEmails),
  };
}

export function serializeMarketingTeamEmailsInput(raw: string): string[] {
  return parseMarketingTeamEmails(raw);
}
