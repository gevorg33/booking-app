import type { ResolvedGuideCorpusTopic } from './guide/ai-guide-corpus.util.js';

/**
 * Grounded `business.settings` / `settings` dot-paths product guides may cite (ai-guide-1.2.4).
 * Prefix match: citing `tax.rules` is allowed when `tax` is listed.
 */
export const GUIDE_GROUNDED_SETTINGS_PATHS = new Set([
  'businessType',
  'currency',
  'defaultCurrency',
  'defaultLocale',
  'enabledLocales',
  'dateFormat',
  'timeFormat',
  'tax',
  'tax.enabled',
  'tax.name',
  'tax.ratePercent',
  'tax.pricingModel',
  'tax.rules',
  'tax.taxNumber',
  'privacy',
  'privacy.granularConsent',
  'privacy.retention',
  'privacy.cookieBannerEnabled',
  'hipaa',
  'hipaa.enabled',
  'hipaa.sessionTimeoutMinutes',
  'hipaa.baaAcceptedAt',
  'notifications',
  'publicBooking',
  'publicBooking.multiService',
  'publicBooking.customerSelfService',
  'publicBooking.acceptCashPayments',
  'publicBooking.acceptOnlinePayments',
  'giftCards',
  'integrations',
  'integrations.openAi',
  'integrations.stripe',
  'integrations.zendesk',
  'integrations.zapier',
  'integrations.distribution',
  'marketingAutomation',
  'referralProgram',
  'staffMessageTemplates',
  'loyalty',
  'productRecommendations',
  'appointmentReminders',
  'customerSelfService',
  'payAtVenue',
  'onlineBooking',
  'privacyPolicyEffectiveDate',
]);

/** Matches `settings.foo`, `settings.foo.bar`, or `business.settings.foo`. */
export const GUIDE_SETTINGS_PATH_CITATION_PATTERN =
  /\b(?:business\.)?settings\.([a-z][a-zA-Z0-9]*(?:\.[a-z][a-zA-Z0-9]*)*)\b/g;

export function isGroundedSettingsPath(
  path: string,
  extraAllowedPaths: ReadonlySet<string> = new Set(),
): boolean {
  if (GUIDE_GROUNDED_SETTINGS_PATHS.has(path) || extraAllowedPaths.has(path)) {
    return true;
  }

  const segments = path.split('.');
  for (let length = segments.length - 1; length >= 1; length -= 1) {
    const prefix = segments.slice(0, length).join('.');
    if (
      GUIDE_GROUNDED_SETTINGS_PATHS.has(prefix) ||
      extraAllowedPaths.has(prefix)
    ) {
      return true;
    }
  }

  return false;
}

export function collectSettingsPathsFromGuideText(text: string): string[] {
  const paths = new Set<string>();
  for (const match of text.matchAll(GUIDE_SETTINGS_PATH_CITATION_PATTERN)) {
    const path = match[1]?.trim();
    if (path) paths.add(path);
  }
  return [...paths];
}

export function extractSettingsPathsFromCorpusTopic(
  resolved: ResolvedGuideCorpusTopic,
): string[] {
  const text = [
    resolved.title,
    resolved.summary,
    resolved.body,
    ...resolved.steps,
    ...resolved.bullets,
    ...resolved.content.map((row) => row.text),
  ]
    .filter(Boolean)
    .join('\n');
  return collectSettingsPathsFromGuideText(text);
}

export function collectUnknownSettingsPathIssues(
  text: string,
  extraAllowedPaths: readonly string[] = [],
): Array<{ code: 'unknown_setting_key'; message: string; value: string }> {
  const allowed = new Set(extraAllowedPaths);
  const issues: Array<{ code: 'unknown_setting_key'; message: string; value: string }> =
    [];

  for (const path of collectSettingsPathsFromGuideText(text)) {
    if (isGroundedSettingsPath(path, allowed)) continue;
    issues.push({
      code: 'unknown_setting_key',
      message: 'Guide text cites unknown business settings path',
      value: path,
    });
  }

  return issues;
}
