import type { ConsumerCopy } from './consumer-copy.types.js';
import type { PublicSubscriptionUsageRow } from './types.js';

export function formatSubscriptionUsageAction(
  action: string,
  copy: ConsumerCopy,
): string {
  const normalized = action.trim().toLowerCase();
  // Real backend enum: SubscriptionUsageAction.CONSUME | RESTORE (e2e-bug.41).
  if (normalized === 'consume') return copy.subscriptionUsageRedeem;
  if (normalized === 'restore') return copy.subscriptionUsageRestore;
  // Legacy / defensive aliases
  if (normalized.includes('purchase')) return copy.subscriptionUsagePurchase;
  if (normalized.includes('redeem') || normalized.includes('use')) {
    return copy.subscriptionUsageRedeem;
  }
  if (normalized.includes('expire')) return copy.subscriptionUsageExpire;
  return action;
}

export function formatSubscriptionUsageLine(
  row: PublicSubscriptionUsageRow,
  copy: ConsumerCopy,
  locale: string,
): string {
  const date = new Date(row.createdAt).toLocaleDateString(locale, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  const action = formatSubscriptionUsageAction(row.action, copy);
  return copy.subscriptionUsageLine
    .replace('{action}', action)
    .replace('{date}', date)
    .replace('{remaining}', String(row.appointmentsRemainingAfter));
}
