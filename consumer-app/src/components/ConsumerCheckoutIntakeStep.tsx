import {
  IonButton,
  IonContent,
  IonHeader,
  IonItem,
  IonLabel,
  IonPage,
  IonSpinner,
  IonTextarea,
  IonTitle,
  IonToolbar,
} from '@ionic/react';
import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createPublicPreVisitIntakeDraft,
  fetchPublicPreVisitIntakeFlow,
  startPublicPreVisitIntake,
  submitPublicPreVisitIntakeAnswer,
} from '../services/public-api.js';
import type { ConsumerCopy } from '../lib/copy.js';

export interface ConsumerCheckoutIntakeStepProps {
  slug: string;
  serviceId: string;
  copy: ConsumerCopy;
  onSkip: () => void;
  onCompleted: (intakeId: string) => void;
}

export function ConsumerCheckoutIntakeStep({
  slug,
  serviceId,
  copy,
  onSkip,
  onCompleted,
}: ConsumerCheckoutIntakeStepProps) {
  const queryClient = useQueryClient();
  const [intakeId, setIntakeId] = useState<string | null>(null);
  const [values, setValues] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (intakeId) return;
    void createPublicPreVisitIntakeDraft(slug, { serviceId })
      .then((draft) => setIntakeId(draft.id))
      .catch(() => setError(copy.publicIntakeLoadFailed));
  }, [intakeId, serviceId, slug]);

  const { data: flow, isLoading } = useQuery({
    queryKey: ['consumer-pre-visit-intake', slug, intakeId],
    queryFn: () => fetchPublicPreVisitIntakeFlow(slug, intakeId!),
    enabled: !!intakeId,
  });

  useEffect(() => {
    if (flow?.isCompleted && intakeId) {
      onCompleted(intakeId);
    }
  }, [flow?.isCompleted, intakeId, onCompleted]);

  useEffect(() => {
    if (!flow?.nextQuestion) {
      setValues([]);
      return;
    }
    setValues(flow.answers[flow.nextQuestion.id] ?? []);
  }, [flow?.nextQuestion?.id, flow?.answers, flow?.nextQuestion]);

  const invalidate = async () => {
    await queryClient.invalidateQueries({
      queryKey: ['consumer-pre-visit-intake', slug, intakeId],
    });
  };

  const startMutation = useMutation({
    mutationFn: () => startPublicPreVisitIntake(slug, intakeId!),
    onSuccess: () => void invalidate(),
    onError: () => setError(copy.publicIntakeLoadFailed),
  });

  const submitMutation = useMutation({
    mutationFn: () =>
      submitPublicPreVisitIntakeAnswer(slug, intakeId!, {
        questionId: flow?.nextQuestion?.id,
        values,
      }),
    onSuccess: () => {
      setError(null);
      void invalidate();
    },
    onError: () => setError(copy.publicIntakeSubmitFailed),
  });

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>{copy.publicIntakeCheckoutTitle}</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>{copy.publicIntakeCheckoutSubtitle}</p>
        <IonButton fill="clear" size="small" onClick={onSkip}>
          {copy.publicIntakeSkip}
        </IonButton>

        {error ? <p style={{ color: '#b91c1c' }}>{error}</p> : null}
        {isLoading || !flow ? (
          <IonSpinner className="ion-margin-top" />
        ) : flow.status === 'assigned' && !flow.responseId ? (
          <IonButton expand="block" className="ion-margin-top" onClick={() => startMutation.mutate()}>
            {copy.publicIntakeStart}
          </IonButton>
        ) : flow.nextQuestion ? (
          <>
            <h2 style={{ fontSize: '1rem', fontWeight: 600, marginTop: 16 }}>
              {flow.nextQuestion.text ?? copy.publicIntakeUntitledQuestion}
            </h2>
            <IonItem>
              <IonLabel position="stacked">{copy.publicIntakeAnswerLabel}</IonLabel>
              <IonTextarea
                value={values[0] ?? ''}
                onIonInput={(e) => setValues([String(e.detail.value ?? '')])}
              />
            </IonItem>
            <IonButton
              expand="block"
              className="ion-margin-top"
              disabled={submitMutation.isPending}
              onClick={() => submitMutation.mutate()}
            >
              {copy.publicIntakeContinue}
            </IonButton>
          </>
        ) : null}
      </IonContent>
    </IonPage>
  );
}
