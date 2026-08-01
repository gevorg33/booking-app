import {
  formatPrice,
  prepaymentDue,
  type PublicService,
} from '@/lib/public-api';
import { resolveTenantPriceCurrency } from '@/lib/business-currency';

export type ServicePrepaymentBadgeKind = 'deposit' | 'full';

export interface ServicePrepaymentBadgeLabels {
  deposit: string; // may include `{amount}`
  payOnline: string;
  payOnlineAmount: string; // may include `{amount}`
}

export interface ServicePrepaymentBadge {
  kind: ServicePrepaymentBadgeKind;
  amount: number;
  label: string;
}

function replaceAmount(template: string, amount: string): string {
  return template.includes('{amount}')
    ? template.replace('{amount}', amount)
    : `${template} ${amount}`.trim();
}

/** True when the public catalog should show a prepay/deposit badge on the card. */
export function shouldShowServicePrepaymentBadge(
  service: Pick<
    PublicService,
    'onlinePaymentEnabled' | 'prepaymentMode' | 'depositAmount' | 'price'
  >,
): boolean {
  if (!service.onlinePaymentEnabled) return false;
  if (service.prepaymentMode === 'full') return true;
  if (service.prepaymentMode === 'deposit') return true;
  if (service.depositAmount != null && Number(service.depositAmount) > 0) {
    return true;
  }
  return false;
}

/**
 * Resolve deposit / pay-online badge copy for public service cards.
 * Amounts follow `prepaymentDue` (full price, fixed deposit, or 50% default).
 */
export function resolveServicePrepaymentBadge(
  service: PublicService,
  labels: ServicePrepaymentBadgeLabels,
  businessCurrency?: string,
): ServicePrepaymentBadge | null {
  if (!shouldShowServicePrepaymentBadge(service)) return null;

  const amount = prepaymentDue(service);
  if (!(amount > 0)) return null;

  const currency = resolveTenantPriceCurrency(service.currency, businessCurrency);
  const formatted = formatPrice(amount, currency);
  const kind: ServicePrepaymentBadgeKind =
    service.prepaymentMode === 'full' ? 'full' : 'deposit';

  if (kind === 'full') {
    return {
      kind,
      amount,
      label: replaceAmount(labels.payOnlineAmount, formatted) || labels.payOnline,
    };
  }

  return {
    kind,
    amount,
    label: replaceAmount(labels.deposit, formatted),
  };
}
