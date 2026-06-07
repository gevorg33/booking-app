'use client';

import { AlertTriangle, X } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { useI18n } from '@/i18n';
import {
  patientAlertBodyKey,
  patientAlertTitleKey,
  unwrapPatientChartAlerts,
  type ClinicPatientAlertView,
} from '@/lib/clinic-patient-alerts';
import type { PatientChartTabId } from '@/lib/patient-chart';

export interface PatientChartAlertsBannerProps {
  businessId: string;
  customerId: string;
  onOpenTab: (tab: PatientChartTabId) => void;
}

function alertBodyParams(alert: ClinicPatientAlertView): Record<string, string> {
  if (alert.type === 'TestResultReleased') {
    return { testName: alert.testName?.trim() || '' };
  }
  if (alert.type === 'LabBookingRequestPending') {
    return {
      orderDisplayNames: alert.orderDisplayNames?.trim() || '',
      collectionServiceName: alert.collectionServiceName?.trim() || '',
    };
  }
  return { questionnaireTitle: alert.questionnaireTitle?.trim() || '' };
}

export function PatientChartAlertsBanner({
  businessId,
  customerId,
  onOpenTab,
}: PatientChartAlertsBannerProps) {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const queryKey = ['patient-chart-alerts', businessId, customerId] as const;

  const { data, isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      const { data: response } = await api.get(
        `/businesses/${businessId}/customers/${customerId}/patient-chart/alerts`,
      );
      return unwrapPatientChartAlerts(response);
    },
    enabled: !!businessId && !!customerId,
  });

  const dismissMutation = useMutation({
    mutationFn: async (alert: ClinicPatientAlertView) => {
      await api.post(
        `/businesses/${businessId}/customers/${customerId}/patient-chart/alerts/${alert.type}/${alert.sourceId}/dismiss`,
      );
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey });
    },
  });

  const alerts = data?.alerts ?? [];
  if (isLoading) {
    return null;
  }
  if (alerts.length === 0) {
    return null;
  }

  return (
    <div
      className="space-y-2"
      role="region"
      aria-label={t('clinic.patientAlerts.regionLabel')}
    >
      {alerts.map((alert) => {
        const bodyParams = alertBodyParams(alert);
        const bodyText = t(patientAlertBodyKey(alert.type), bodyParams);
        const showBodyFallback =
          alert.type === 'TestResultReleased'
            ? !bodyParams.testName
            : alert.type === 'LabBookingRequestPending'
              ? !bodyParams.orderDisplayNames && !bodyParams.collectionServiceName
              : !bodyParams.questionnaireTitle;

        return (
          <div
            key={alert.id}
            className="flex flex-col gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-amber-950 dark:border-amber-500/40 dark:bg-amber-950/30 dark:text-amber-50 md:flex-row md:items-start md:justify-between"
          >
            <div className="flex min-w-0 items-start gap-3">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-300" />
              <div className="min-w-0 space-y-1">
                <p className="text-sm font-semibold">{t(patientAlertTitleKey(alert.type))}</p>
                <p className="text-sm text-amber-900/90 dark:text-amber-100/90">
                  {showBodyFallback ? alert.messages[0]?.title ?? bodyText : bodyText}
                </p>
              </div>
            </div>
            <div className="flex shrink-0 flex-wrap items-center gap-2">
              <button
                type="button"
                className="btn-secondary text-xs"
                onClick={() => onOpenTab(alert.chartTab)}
              >
                {t('clinic.patientAlerts.viewAction')}
              </button>
              <button
                type="button"
                className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-amber-900 hover:bg-amber-100 dark:text-amber-100 dark:hover:bg-amber-900/40"
                disabled={dismissMutation.isPending}
                onClick={() => dismissMutation.mutate(alert)}
              >
                <X className="h-3.5 w-3.5" />
                {t('clinic.patientAlerts.dismiss')}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
