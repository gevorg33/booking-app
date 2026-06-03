import type { EmailTemplateKey } from '@/components/dashboard/notification-email-templates-panel';

/** UI metadata for email templates — tenant-edited subject/body stay as stored. */
export function emailTemplateLabel(
  t: (key: string) => string,
  key: EmailTemplateKey,
  fallback: string,
): string {
  const path = `settings.emailTemplateKeys.${key}.label`;
  const value = t(path);
  return value === path ? fallback : value;
}

export function emailTemplateDescription(
  t: (key: string) => string,
  key: EmailTemplateKey,
  fallback: string,
): string {
  const path = `settings.emailTemplateKeys.${key}.description`;
  const value = t(path);
  return value === path ? fallback : value;
}

export function emailTemplateVarLabel(
  t: (key: string) => string,
  varKey: string,
  fallback: string,
): string {
  const path = `settings.emailTemplateVars.${varKey}.label`;
  const value = t(path);
  return value === path ? fallback : value;
}

export function emailTemplateVarDescription(
  t: (key: string) => string,
  varKey: string,
  fallback: string,
): string {
  const path = `settings.emailTemplateVars.${varKey}.description`;
  const value = t(path);
  return value === path ? fallback : value;
}
