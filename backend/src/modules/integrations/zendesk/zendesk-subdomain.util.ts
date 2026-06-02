/** Strip URL noise so "https://acme.zendesk.com/" → "acme". */
export function normalizeZendeskSubdomain(raw: string): string {
  let value = raw.trim().toLowerCase();
  value = value.replace(/^https?:\/\//, '');
  value = value.replace(/\.zendesk\.com\/?.*$/, '');
  value = value.split('/')[0] ?? value;
  return value;
}
