'use client';

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useI18n } from '@/i18n';
import {
  getPublicPreVisitIntakeConfig,
  createPublicPreVisitIntakeDraft,
  getPublicPreVisitIntakeFlow,
  startPublicPreVisitIntake,
  submitPublicPreVisitIntakeAnswer,
} from '@/lib/public-api';
import { IntakeFormLayout } from '@/components/intake-form/intake-form-layout';
import { IntakeFormQuestionField } from '@/components/intake-form/intake-form-question-field';

export interface PublicCheckoutIntakeStepProps {
  slug: string;
  serviceId: string;
  onSkip: () => void;
  onCompleted: (intakeId: string) => void;
}

export function PublicCheckoutIntakeStep({
  slug,
  serviceId,
  onSkip,
  onCompleted,
}: PublicCheckoutIntakeStepProps) {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const [intakeId, setIntakeId] = useState<string | null>(null);
  const [values, setValues] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [draftError, setDraftError] = useState<string | null>(null);

  const { data: config, isLoading: configLoading } = useQuery({
    queryKey: ['public-pre-visit-intake-config', slug, serviceId],
    queryFn: () => getPublicPreVisitIntakeConfig(slug, serviceId),
  });

  useEffect(() => {
    if (!config?.offersPreVisitIntake || intakeId) return;
    void createPublicPreVisitIntakeDraft(slug, { serviceId })
      .then((draft) => setIntakeId(draft.id))
      .catch(() => setDraftError(t('clinic.intakeForm.loadFailed')));
  }, [config?.offersPreVisitIntake, intakeId, serviceId, slug, t]);

  const { data: flow, isLoading: flowLoading } = useQuery({
    queryKey: ['public-pre-visit-intake-flow', slug, intakeId],
    queryFn: () => getPublicPreVisitIntakeFlow(slug, intakeId!),
    enabled: !!intakeId,
  });

  useEffect(() => {
    if (flow?.isCompleted && intakeId) {
      onCompleted(intakeId);
    }
  }, [flow?.isCompleted, intakeId, onCompleted]);

  useEffect(() => {
    if (!flow?.nextQuestion) {
      queueMicrotask(() => setValues([]));
      return;
    }
    const existing = flow.answers[flow.nextQuestion.id];
    queueMicrotask(() => setValues(existing ?? []));
  }, [flow?.nextQuestion?.id, flow?.answers, flow?.nextQuestion]);

  const invalidate = async () => {
    await queryClient.invalidateQueries({
      queryKey: ['public-pre-visit-intake-flow', slug, intakeId],
    });
  };

  const startMutation = useMutation({
    mutationFn: () => startPublicPreVisitIntake(slug, intakeId!),
    onSuccess: () => void invalidate(),
    onError: (mutationError: Error) => {
      setError(mutationError.message || t('clinic.intakeForm.loadFailed'));
    },
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
    onError: (mutationError: Error) => {
      setError(mutationError.message || t('clinic.intakeForm.submitFailed'));
    },
  });

  if (configLoading || !config?.offersPreVisitIntake) {
    return null;
  }

  if (draftError) {
    return (
      <div className="card space-y-3">
        <p className="text-sm text-red-600">{draftError}</p>
        <button type="button" className="btn-secondary" onClick={onSkip}>
          {t('clinic.publicIntake.skip')}
        </button>
      </div>
    );
  }

  if (!intakeId || flowLoading || !flow) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    );
  }

  const needsStart = flow.status === 'assigned' && !flow.responseId;

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            {t('clinic.publicIntake.checkoutTitle')}
          </h2>
          <p className="text-sm text-gray-500">{t('clinic.publicIntake.checkoutSubtitle')}</p>
        </div>
        <button type="button" className="text-sm text-gray-500 hover:text-gray-800" onClick={onSkip}>
          {t('clinic.publicIntake.skip')}
        </button>
      </div>

      <IntakeFormLayout
        title={flow.questionnaire.title}
        subtitle={t(`clinic.intakeForm.status.${flow.status}`)}
        introTitle={flow.introTitle}
        introBody={flow.introBody}
      >
        {needsStart ? (
          <div className="space-y-3">
            <p className="text-sm text-gray-600">{t('clinic.intakeForm.startPrompt')}</p>
            <button
              type="button"
              className="btn-primary"
              disabled={startMutation.isPending}
              onClick={() => startMutation.mutate()}
            >
              {startMutation.isPending ? t('common.loading') : t('clinic.intakeForm.start')}
            </button>
          </div>
        ) : flow.nextQuestion ? (
          <div className="space-y-4">
            <IntakeFormQuestionField
              question={flow.nextQuestion}
              values={values}
              onChange={setValues}
              disabled={submitMutation.isPending}
            />
            {error ? <p className="text-sm text-red-600">{error}</p> : null}
            <button
              type="button"
              className="btn-primary"
              disabled={submitMutation.isPending}
              onClick={() => submitMutation.mutate()}
            >
              {submitMutation.isPending ? t('common.saving') : t('clinic.intakeForm.continue')}
            </button>
          </div>
        ) : (
          <p className="text-sm text-gray-500">{t('clinic.intakeForm.noActiveQuestion')}</p>
        )}
      </IntakeFormLayout>
    </div>
  );
}
