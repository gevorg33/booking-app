'use client';

import { Smartphone } from 'lucide-react';
import { useI18n } from '@/i18n';
import { AdoptionDashboardPanel } from '@/components/adoption-dashboard-panel';

export default function AdoptionPage() {
  const { t } = useI18n();

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <Smartphone className="h-6 w-6 text-blue-400" />
          <h1 className="text-2xl font-bold">{t('adoption.pageTitle')}</h1>
        </div>
        <p className="text-gray-400 mt-1">{t('adoption.pageSubtitle')}</p>
      </div>
      <AdoptionDashboardPanel />
    </div>
  );
}
