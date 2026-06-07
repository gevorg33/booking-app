import {
  IonButton,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonSpinner,
} from '@ionic/react';
import { useI18n } from '../i18n';
import { formatDateDisplay, formatTimeDisplay } from '../lib/date-format';
import type { ProviderClinicTaskItem } from '../lib/provider-clinic-tasks';
import { providerClinicTaskTypeKey } from '../lib/provider-clinic-tasks';

export interface ProviderClinicTasksListProps {
  tasks: ProviderClinicTaskItem[];
  loading: boolean;
  showAssigneeName: boolean;
  busyTaskId: string | null;
  onClaim: (taskId: string) => void;
  onComplete: (taskId: string) => void;
}

export function ProviderClinicTasksList({
  tasks,
  loading,
  showAssigneeName,
  busyTaskId,
  onClaim,
  onComplete,
}: ProviderClinicTasksListProps) {
  const { t } = useI18n();

  if (loading) {
    return (
      <div className="empty-state">
        <IonSpinner />
      </div>
    );
  }

  if (!tasks.length) {
    return <p className="empty-state">{t('provider.clinicTasksEmpty')}</p>;
  }

  return (
    <>
      {tasks.map((task) => {
        const isBusy = busyTaskId === task.id;
        return (
          <IonCard key={task.id}>
            <IonCardHeader>
              <IonCardTitle>{task.title}</IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              <p className="booking-meta">
                {t(providerClinicTaskTypeKey(task.taskType))}
                {task.priority === 'high'
                  ? ` · ${t('provider.clinicTasksPriorityHigh')}`
                  : ''}
                {task.isAutoManaged
                  ? ` · ${t('provider.clinicTasksAutoManaged')}`
                  : ''}
              </p>
              {task.customerName && <p>{task.customerName}</p>}
              {task.dueAt && (
                <p className="booking-meta">
                  {t('provider.clinicTasksDue')}: {formatDateDisplay(task.dueAt)}{' '}
                  {formatTimeDisplay(task.dueAt)}
                </p>
              )}
              {task.notes && <p className="booking-meta">{task.notes}</p>}
              {showAssigneeName && task.assigneeName && (
                <p className="booking-meta">
                  {t('common.provider')}: {task.assigneeName}
                </p>
              )}
              {!showAssigneeName && !task.assigneeName && task.canClaim && (
                <p className="booking-meta">{t('provider.clinicTasksUnassigned')}</p>
              )}
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '12px' }}>
                {task.canClaim && (
                  <IonButton
                    size="small"
                    disabled={isBusy}
                    onClick={() => onClaim(task.id)}
                  >
                    {t('provider.clinicTasksClaim')}
                  </IonButton>
                )}
                {task.canComplete && (
                  <IonButton
                    size="small"
                    color="success"
                    disabled={isBusy}
                    onClick={() => onComplete(task.id)}
                  >
                    {t('provider.clinicTasksComplete')}
                  </IonButton>
                )}
              </div>
            </IonCardContent>
          </IonCard>
        );
      })}
    </>
  );
}
