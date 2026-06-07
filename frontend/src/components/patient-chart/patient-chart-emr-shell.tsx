'use client';

import { useI18n } from '@/i18n';
import {
  PATIENT_CHART_TIER_I_TABS,
  patientChartTabLabelKey,
  type PatientChartTabId,
} from '@/lib/patient-chart';

export interface PatientChartEmrShellProps {
  activeTab: PatientChartTabId;
  onTabChange: (tab: PatientChartTabId) => void;
  children: React.ReactNode;
}

export function PatientChartEmrShell({
  activeTab,
  onTabChange,
  children,
}: PatientChartEmrShellProps) {
  const { t } = useI18n();

  return (
    <div className="space-y-4">
      <div
        className="flex flex-wrap gap-1 rounded-lg border border-gray-200 bg-white p-1 dark:border-gray-800 dark:bg-gray-900/40"
        role="tablist"
        aria-label={t('clinic.patientChart.tabListLabel')}
      >
        {PATIENT_CHART_TIER_I_TABS.map((tab) => {
          const enabled = tab.enabled;
          const selected = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={selected}
              disabled={!enabled}
              title={
                enabled
                  ? undefined
                  : t('clinic.patientChart.tabsComingSoon')
              }
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                !enabled
                  ? 'cursor-not-allowed text-gray-400 opacity-60'
                  : selected
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100'
              }`}
              onClick={() => {
                if (enabled) onTabChange(tab.id);
              }}
            >
              {t(patientChartTabLabelKey(tab.id))}
            </button>
          );
        })}
      </div>
      <div role="tabpanel">{children}</div>
    </div>
  );
}
