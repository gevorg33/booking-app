import { IonButton, IonIcon } from '@ionic/react';
import { alertCircleOutline, closeOutline } from 'ionicons/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ConsumerCopy } from '../lib/consumer-copy.types.js';
import { formatCopy } from '../lib/copy.js';
import {
  dismissMyClinicPatientAlert,
  fetchMyClinicPatientAlerts,
} from '../services/public-api.js';
import {
  resolvePatientAlertAccountAnchor,
  resolvePatientAlertConsumerRoute,
  unwrapPatientChartAlerts,
  type ClinicPatientAlertView,
  type ConsumerPatientAlertRoute,
} from '../lib/clinic-patient-alerts.js';
import { shouldShowPatientResultsTab } from '../lib/clinic-service.js';

export interface ConsumerPatientAlertsBannerProps {
  slug: string;
  copy: ConsumerCopy;
  /** When set, clinic APIs are skipped for non-clinic businesses (e2e-bug.43). */
  businessType?: string | null;
  enabled?: boolean;
  onNavigate?: (route: ConsumerPatientAlertRoute, anchorId: string) => void;
}

function alertBody(copy: ConsumerCopy, alert: ClinicPatientAlertView): string {
  if (alert.type === 'TestResultReleased') {
    const testName = alert.testName?.trim() || copy.myResultsUnnamed;
    return formatCopy(copy.patientAlertBodyReleased, { testName });
  }
  if (alert.type === 'LabBookingRequestPending') {
    return formatCopy(copy.patientAlertBodyLabBooking, {
      collectionServiceName:
        alert.collectionServiceName?.trim() || copy.myLabToBookUnnamedOrder,
      orderDisplayNames: alert.orderDisplayNames?.trim() || copy.myLabToBookUnnamedOrder,
    });
  }
  return formatCopy(copy.patientAlertBodyIntake, {
    questionnaireTitle: alert.questionnaireTitle?.trim() || copy.publicIntakeCheckoutTitle,
  });
}

function alertTitle(copy: ConsumerCopy, type: ClinicPatientAlertView['type']): string {
  switch (type) {
    case 'TestResultReleased':
      return copy.patientAlertTitleReleased;
    case 'LabBookingRequestPending':
      return copy.patientAlertTitleLabBooking;
    case 'IntakeIncomplete':
      return copy.patientAlertTitleIntake;
  }
}

export function ConsumerPatientAlertsBanner({
  slug,
  copy,
  businessType,
  enabled = true,
  onNavigate,
}: ConsumerPatientAlertsBannerProps) {
  const queryClient = useQueryClient();
  const queryKey = ['consumer-patient-alerts', slug] as const;
  const clinicEnabled =
    enabled &&
    !!slug &&
    (businessType === undefined
      ? true
      : shouldShowPatientResultsTab(businessType));

  const { data, isLoading } = useQuery({
    queryKey,
    queryFn: async () => unwrapPatientChartAlerts(await fetchMyClinicPatientAlerts(slug)),
    enabled: clinicEnabled,
  });

  const dismissMutation = useMutation({
    mutationFn: async (alert: ClinicPatientAlertView) => {
      await dismissMyClinicPatientAlert(slug, alert.type, alert.sourceId);
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
      role="region"
      aria-label={copy.patientAlertsRegionLabel}
      style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 }}
    >
      {alerts.map((alert) => {
        const anchorId = resolvePatientAlertAccountAnchor(alert.chartTab);
        const route = resolvePatientAlertConsumerRoute(alert.chartTab);

        return (
          <div
            key={alert.id}
            className="salon-card"
            style={{
              borderColor: '#fcd34d',
              background: '#fffbeb',
            }}
          >
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <IonIcon icon={alertCircleOutline} style={{ fontSize: 22, color: '#d97706' }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontWeight: 600, marginBottom: 4 }}>{alertTitle(copy, alert.type)}</p>
                <p style={{ fontSize: '0.875rem', color: '#92400e' }}>{alertBody(copy, alert)}</p>
                <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
                  <IonButton
                    size="small"
                    fill="outline"
                    onClick={() => onNavigate?.(route, anchorId)}
                  >
                    {copy.patientAlertsViewAction}
                  </IonButton>
                  <IonButton
                    size="small"
                    fill="clear"
                    color="medium"
                    disabled={dismissMutation.isPending}
                    onClick={() => dismissMutation.mutate(alert)}
                  >
                    <IonIcon slot="start" icon={closeOutline} />
                    {copy.patientAlertsDismiss}
                  </IonButton>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
