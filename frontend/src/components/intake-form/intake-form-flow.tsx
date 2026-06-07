'use client';

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { useI18n } from '@/i18n';
import {
  unwrapPreVisitIntakeRecord,
  type PreVisitIntakeFlowView,
} from '@/lib/clinic-pre-visit-intake';
import { IntakeFormLayout } from './intake-form-layout';
import { IntakeFormQuestionField } from './intake-form-question-field';

export interface IntakeFormFlowProps {
  businessId: string;
  intakeId: string;
  onCompleted?: () => void;
}

export function IntakeFormFlow({ businessId, intakeId, onCompleted }: IntakeFormFlowProps) {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const [values, setValues] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const { data: flow, isLoading } = useQuery({
    queryKey: ['pre-visit-intake-flow', businessId, intakeId],
    queryFn: async () => {
      const { data } = await api.get(
        `/businesses/${businessId}/pre-visit-intakes/${intakeId}`,
      );
      return unwrapPreVisitIntakeRecord<PreVisitIntakeFlowView>(data);
    },
    enabled: !!businessId && !!intakeId,
  });

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
      queryKey: ['pre-visit-intake-flow', businessId, intakeId],
    });
    await queryClient.invalidateQueries({
      queryKey: ['pre-visit-intakes', businessId],
    });
    await queryClient.invalidateQueries({
      queryKey: ['booking-pre-visit-intake', businessId],
    });
  };

  const startMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.post(
        `/businesses/${businessId}/pre-visit-intakes/${intakeId}/start`,
      );
      return unwrapPreVisitIntakeRecord<PreVisitIntakeFlowView>(data);
    },
    onSuccess: () => void invalidate(),
    onError: (mutationError: Error) => {
      setError(mutationError.message || t('clinic.intakeForm.loadFailed'));
    },
  });

  const submitMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.post(
        `/businesses/${businessId}/pre-visit-intakes/${intakeId}/answers`,
        {
          questionId: flow?.nextQuestion?.id,
          values,
        },
      );
      return unwrapPreVisitIntakeRecord<PreVisitIntakeFlowView>(data);
    },
    onSuccess: (result) => {
      setError(null);
      void invalidate();
      if (result.isCompleted) {
        onCompleted?.();
      }
    },
    onError: (mutationError: Error) => {
      setError(mutationError.message || t('clinic.intakeForm.submitFailed'));
    },
  });

  if (isLoading || !flow) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-5 w-5 animate-spin text-blue-400" />
      </div>
    );
  }

  if (flow.isCompleted) {
    return (
      <IntakeFormLayout title={flow.questionnaire.title} subtitle={t('clinic.intakeForm.completed')}>
        <p className="text-sm text-green-300">{t('clinic.intakeForm.completedBody')}</p>
      </IntakeFormLayout>
    );
  }

  const needsStart = flow.status === 'assigned' && !flow.responseId;

  return (
    <IntakeFormLayout
      title={flow.questionnaire.title}
      subtitle={t(preVisitIntakeStatusLabel(flow.status))}
      introTitle={flow.introTitle}
      introBody={flow.introBody}
    >
      {needsStart ? (
        <div className="space-y-3">
          <p className="text-sm text-gray-400">{t('clinic.intakeForm.startPrompt')}</p>
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
          {error ? <p className="text-sm text-red-400">{error}</p> : null}
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
        <p className="text-sm text-gray-400">{t('clinic.intakeForm.noActiveQuestion')}</p>
      )}
    </IntakeFormLayout>
  );
}

function preVisitIntakeStatusLabel(status: PreVisitIntakeFlowView['status']): string {
  return `clinic.intakeForm.status.${status}`;
}
