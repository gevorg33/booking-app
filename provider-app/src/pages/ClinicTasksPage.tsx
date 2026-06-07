import { useCallback, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
} from '@ionic/react';
import api, { unwrap } from '../services/api';
import { useAuthStore } from '../services/auth-store';
import { useI18n } from '../i18n';
import { isTeamView } from '../lib/provider-access';
import type { ProviderClinicTaskInbox } from '../lib/provider-clinic-tasks';
import { ProviderClinicTasksList } from '../components/ProviderClinicTasksList';

export default function ClinicTasksPage() {
  const { t } = useI18n();
  const { business } = useAuthStore();
  const queryClient = useQueryClient();
  const [busyTaskId, setBusyTaskId] = useState<string | null>(null);

  const queryKey = ['provider-clinic-tasks', business?.id];

  const refresh = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey });
  }, [queryClient, queryKey]);

  const { data, isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      const { data: res } = await api.get(
        `/businesses/${business!.id}/provider/clinic-tasks`,
      );
      return unwrap<ProviderClinicTaskInbox>(res);
    },
    enabled: !!business?.id,
    refetchInterval: 60_000,
  });

  const claimMutation = useMutation({
    mutationFn: async (taskId: string) => {
      setBusyTaskId(taskId);
      const { data: res } = await api.post(
        `/businesses/${business!.id}/provider/clinic-tasks/${taskId}/claim`,
      );
      return unwrap(res);
    },
    onSettled: () => {
      setBusyTaskId(null);
      refresh();
    },
  });

  const completeMutation = useMutation({
    mutationFn: async (taskId: string) => {
      setBusyTaskId(taskId);
      const { data: res } = await api.post(
        `/businesses/${business!.id}/provider/clinic-tasks/${taskId}/complete`,
        {},
      );
      return unwrap(res);
    },
    onSettled: () => {
      setBusyTaskId(null);
      refresh();
    },
  });

  if (data && !data.labFeaturesEnabled) {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar>
            <IonTitle>{t('provider.clinicTasksTitle')}</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent className="ion-padding">
          <p className="ion-text-center ion-padding">{t('clinic.labState.gate.disabledReason')}</p>
        </IonContent>
      </IonPage>
    );
  }

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>{t('provider.clinicTasksTitle')}</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <p className="booking-meta">{t('provider.clinicTasksSubtitle')}</p>
        {isTeamView(data?.viewMode) ? (
          <p className="booking-meta">{t('provider.clinicTasksTeamLabel')}</p>
        ) : (
          data?.employee && <p className="booking-meta">{data.employee.name}</p>
        )}

        <ProviderClinicTasksList
          tasks={data?.tasks ?? []}
          loading={isLoading}
          showAssigneeName={isTeamView(data?.viewMode)}
          busyTaskId={busyTaskId}
          onClaim={(taskId) => claimMutation.mutate(taskId)}
          onComplete={(taskId) => completeMutation.mutate(taskId)}
        />
      </IonContent>
    </IonPage>
  );
}
