export const CUSTOMER_TAGS = [
  'vip',
  'regular',
  'persona',
  'corporate',
  'referral',
  'waitlist',
] as const;

export type CustomerTag = (typeof CUSTOMER_TAGS)[number];

export function isCustomerTag(value: string): value is CustomerTag {
  return (CUSTOMER_TAGS as readonly string[]).includes(value);
}

export function sanitizeCustomerTags(tags?: string[]): CustomerTag[] {
  if (!tags?.length) return [];
  return tags.filter(isCustomerTag);
}

export function primaryCustomerTag(tags?: string[]): CustomerTag | '' {
  const sanitized = sanitizeCustomerTags(tags);
  return sanitized[0] ?? '';
}
