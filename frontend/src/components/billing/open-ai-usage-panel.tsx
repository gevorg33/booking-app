'use client';

import { Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { useI18n } from '@/i18n';
import { usePlanEntitlements } from '@/lib/use-plan-entitlements';
import { UpgradePrompt } from '@/components/billing/upgrade-prompt';

interface AiUsageSummary {
  periodStart: string;
  periodEnd: string;
  totalRequests: number;
  totalTokens: number;
  estimatedPlatformCostUsd: number;
  bySurface: Array<{
    surface: string;
    totalTokens: number;
    platformCostUsd: number;
  }>;
}

interface OpenAiIntegrationResponse {
  usage?: AiUsageSummary;
}

function formatUsd(amount: number): string {
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  }).format(amount);
}

function formatSurfaceLabel(surface: string, t: (key: string) => string): string {
  const key = `settings.openAiSurface_${surface}`;
  const translated = t(key);
  return translated !== key ? translated : surface.replace(/_/g, ' ');
}

export function OpenAiUsagePanel({ businessId }: { businessId: string }) {
  const { t } = useI18n();
  const { data: entitlements } = usePlanEntitlements(businessId);

  const { data, isLoading } = useQuery({
    queryKey: ['openai-integration', businessId],
    queryFn: async () => {
      const { data: res } = await api.get(`/businesses/${businessId}/integrations/openai`);
      return (res.data || res) as OpenAiIntegrationResponse;
    },
    enabled: !!businessId,
  });

  if (isLoading) {
    return (
      <div className="card mb-8 flex justify-center py-10">
        <Loader2 className="w-5 h-5 animate-spin text-blue-400" />
      </div>
    );
  }

  if (!data?.usage) return null;

  const usage = data.usage;

  return (
    <div className="card mb-8 space-y-3">
      {entitlements?.atLimit.aiCommands && (
        <UpgradePrompt limit="ai_commands" compact />
      )}
      {entitlements?.aiUsageWarning && !entitlements.atLimit.aiCommands && (
        <p className="text-xs text-amber-400">{t('billing.aiUsageNearLimit')}</p>
      )}
      <h2 className="font-semibold">{t('settings.openAiUsageTitle')}</h2>
      {entitlements && (
        <p className="text-xs text-gray-500">
          {t('billing.usageAi')}: {entitlements.usage.aiCommandsThisMonth} /{' '}
          {entitlements.limits.aiCommandsPerMonth}
        </p>
      )}
      <p className="text-xs text-gray-500">
        {t('settings.openAiUsagePeriod')}: {usage.periodStart} → {usage.periodEnd}
      </p>
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <p className="text-gray-500 text-xs">{t('settings.openAiUsageRequests')}</p>
          <p className="font-medium text-gray-100">{usage.totalRequests}</p>
        </div>
        <div>
          <p className="text-gray-500 text-xs">{t('settings.openAiUsageTokens')}</p>
          <p className="font-medium text-gray-100">{usage.totalTokens.toLocaleString()}</p>
        </div>
        <div className="col-span-2">
          <p className="text-gray-500 text-xs">{t('settings.openAiUsagePlatformCost')}</p>
          <p className="font-medium text-gray-100">{formatUsd(usage.estimatedPlatformCostUsd)}</p>
          <p className="text-xs text-gray-500 mt-1">{t('settings.openAiUsagePlatformCostHint')}</p>
        </div>
      </div>
      {usage.bySurface.length > 0 && (
        <div>
          <p className="text-xs font-medium text-gray-400 mb-2">{t('settings.openAiUsageBySurface')}</p>
          <ul className="text-xs space-y-1 text-gray-400">
            {usage.bySurface.map((row) => (
              <li key={row.surface} className="flex justify-between gap-2">
                <span>{formatSurfaceLabel(row.surface, t)}</span>
                <span>
                  {row.totalTokens.toLocaleString()} {t('settings.openAiUsageTokensShort')}
                  {row.platformCostUsd > 0 ? ` · ${formatUsd(row.platformCostUsd)}` : ''}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
