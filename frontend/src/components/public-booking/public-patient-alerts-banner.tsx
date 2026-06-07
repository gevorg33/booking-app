'use client';

import { AlertTriangle, X } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  dismissPublicCustomerClinicPatientAlert,
  getPublicCustomerClinicPatientAlerts,
} from '@/lib/public-api';
import { useI18n } from '@/i18n';
import {
  publicPatientAlertBodyKey,
  publicPatientAlertTitleKey,
  resolvePatientAlertAccountAnchor,
  unwrapPatientChartAlerts,
  type ClinicPatientAlertView,
} from '@/lib/clinic-patient-alerts';

export interface PublicPatientAlertsBannerProps {
  slug: string;
  onViewAlert?: (alert: ClinicPatientAlertView, anchorId: string) => void;
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

function scrollToAccountAnchor(anchorId: string) {
  document.getElementById(anchorId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

export function PublicPatientAlertsBanner({
  slug,
  onViewAlert,
}: PublicPatientAlertsBannerProps) {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const queryKey = ['public-patient-alerts', slug] as const;

  const { data, isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      const response = await getPublicCustomerClinicPatientAlerts(slug);
      return unwrapPatientChartAlerts(response);
    },
    enabled: !!slug,
  });

  const dismissMutation = useMutation({
    mutationFn: async (alert: ClinicPatientAlertView) => {
      await dismissPublicCustomerClinicPatientAlert(slug, alert.type, alert.sourceId);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey });
    },
  });

  const alerts = data?.alerts ?? [];
  if (isLoading || alerts.length === 0) {
    return null;
  }

  return (
    <div
      className="mt-6 space-y-2"
      role="region"
      aria-label={t('public.patientAlerts.regionLabel')}
    >
      {alerts.map((alert) => {
        const bodyParams = alertBodyParams(alert);
        const bodyText = t(publicPatientAlertBodyKey(alert.type), bodyParams);
        const anchorId = resolvePatientAlertAccountAnchor(alert.chartTab);
        const showBodyFallback =
          alert.type === 'TestResultReleased'
            ? !bodyParams.testName
            : alert.type === 'LabBookingRequestPending'
              ? !bodyParams.orderDisplayNames && !bodyParams.collectionServiceName
              : !bodyParams.questionnaireTitle;

        return (
          <div
            key={alert.id}
            className="flex flex-col gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-amber-950 md:flex-row md:items-start md:justify-between"
          >
            <div className="flex min-w-0 items-start gap-3">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
              <div className="min-w-0 space-y-1">
                <p className="text-sm font-semibold">
                  {t(publicPatientAlertTitleKey(alert.type))}
                </p>
                <p className="text-sm text-amber-900/90">
                  {showBodyFallback ? alert.messages[0]?.title ?? bodyText : bodyText}
                </p>
              </div>
            </div>
            <div className="flex shrink-0 flex-wrap items-center gap-2">
              <button
                type="button"
                className="rounded-lg border border-amber-300 bg-white px-3 py-1.5 text-xs font-medium text-amber-950 hover:bg-amber-100"
                onClick={() => {
                  if (onViewAlert) {
                    onViewAlert(alert, anchorId);
                  } else {
                    scrollToAccountAnchor(anchorId);
                  }
                }}
              >
                {t('public.patientAlerts.viewAction')}
              </button>
              <button
                type="button"
                className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-amber-900 hover:bg-amber-100"
                disabled={dismissMutation.isPending}
                onClick={() => dismissMutation.mutate(alert)}
              >
                <X className="h-3.5 w-3.5" />
                {t('public.patientAlerts.dismiss')}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
