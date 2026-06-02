'use client';

import Link from 'next/link';
import { Sparkles } from 'lucide-react';
import { useI18n } from '@/i18n';
import type { PlanFeatureFlag, PlanLimitKind } from '@/lib/plan-entitlements';
import { FEATURE_LABEL_KEYS } from '@/lib/plan-entitlements';

type UpgradePromptProps = {
  title?: string;
  message?: string;
  limit?: PlanLimitKind;
  feature?: PlanFeatureFlag;
  compact?: boolean;
  className?: string;
};

export function UpgradePrompt({
  title,
  message,
  limit,
  feature,
  compact = false,
  className = '',
}: UpgradePromptProps) {
  const { t } = useI18n();

  const body =
    message ??
    (feature ? t(FEATURE_LABEL_KEYS[feature]) : t('billing.upgradeDefaultMessage'));

  const heading = title ?? t('billing.upgradeTitle');

  return (
    <div
      className={`rounded-xl border border-violet-500/30 bg-violet-950/20 ${
        compact ? 'px-4 py-3' : 'px-5 py-4'
      } ${className}`}
    >
      <div className={`flex ${compact ? 'items-center' : 'items-start'} gap-3`}>
        <Sparkles className={`shrink-0 text-violet-400 ${compact ? 'w-4 h-4' : 'w-5 h-5'}`} />
        <div className="min-w-0 flex-1">
          <p className={`font-medium text-violet-100 ${compact ? 'text-sm' : ''}`}>{heading}</p>
          <p className={`text-gray-400 mt-1 ${compact ? 'text-xs' : 'text-sm'}`}>{body}</p>
          {limit === 'provider_seats' && (
            <p className="text-xs text-gray-500 mt-1">{t('billing.upgradeSeatsHint')}</p>
          )}
          {limit === 'ai_commands' && (
            <p className="text-xs text-gray-500 mt-1">{t('billing.upgradeAiHint')}</p>
          )}
        </div>
        <Link
          href="/dashboard/billing"
          className={`shrink-0 btn-primary text-sm whitespace-nowrap ${compact ? 'px-3 py-1.5' : ''}`}
        >
          {t('billing.upgradeCta')}
        </Link>
      </div>
    </div>
  );
}
