'use client';

import { AlertTriangle, Shield } from 'lucide-react';
import { useI18n } from '@/i18n';

export interface PolicyExplain {
  headline: string;
  explanation: string;
  riskLevel: 'low' | 'medium' | 'high';
}

const RISK_STYLES = {
  low: 'border-gray-600 bg-gray-800/50 text-gray-200',
  medium: 'border-amber-600/40 bg-amber-950/25 text-amber-100',
  high: 'border-red-600/40 bg-red-950/25 text-red-100',
};

export function AiPolicyRiskBadge({ explain }: { explain: PolicyExplain }) {
  const { t } = useI18n();
  const style = RISK_STYLES[explain.riskLevel] ?? RISK_STYLES.medium;
  const Icon = explain.riskLevel === 'high' ? AlertTriangle : Shield;

  return (
    <div className={`rounded-md border px-2.5 py-2 text-xs ${style}`}>
      <p className="font-semibold flex items-center gap-1.5">
        <Icon className="w-3.5 h-3.5 shrink-0" />
        {explain.headline}
      </p>
      <p className="mt-1 opacity-90 leading-relaxed">{explain.explanation}</p>
      <p className="mt-1 text-[10px] uppercase tracking-wide opacity-70">
        {t('ai.riskLevelLabel', { level: explain.riskLevel })}
      </p>
    </div>
  );
}
