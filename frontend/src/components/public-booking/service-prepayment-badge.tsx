'use client';

import type { PublicService } from '@/lib/public-api';
import { resolveServicePrepaymentBadge } from '@/lib/service-prepayment-badge.util';
import { useI18n } from '@/i18n';

interface ServicePrepaymentBadgeProps {
  service: PublicService;
  businessCurrency?: string;
  className?: string;
}

/** e2e-bug.209 — deposit / pay-online chip on public service cards. */
export function ServicePrepaymentBadge({
  service,
  businessCurrency,
  className = '',
}: ServicePrepaymentBadgeProps) {
  const { t } = useI18n();
  const badge = resolveServicePrepaymentBadge(
    service,
    {
      deposit: t('public.serviceDepositBadge'),
      payOnline: t('public.servicePayOnlineBadge'),
      payOnlineAmount: t('public.servicePayOnlineAmountBadge'),
    },
    businessCurrency,
  );
  if (!badge) return null;

  return (
    <span
      data-testid={`service-prepayment-badge-${service.id}`}
      data-prepayment-kind={badge.kind}
      className={`inline-block mt-1 text-xs font-medium text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full ${className}`.trim()}
    >
      {badge.label}
    </span>
  );
}
