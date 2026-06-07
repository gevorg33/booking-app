'use client';

import { useState } from 'react';
import { ClipboardList, Loader2, Plus } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { useI18n } from '@/i18n';
import {
  unwrapPreVisitIntakeList,
  unwrapPreVisitIntakeRecord,
  preVisitIntakeStatusLabelKey,
  type PreVisitIntakeSummary,
} from '@/lib/clinic-pre-visit-intake';
import { IntakeFormFlow } from '@/components/intake-form/intake-form-flow';

export interface PatientChartIntakeTabProps {
  businessId: string;
  customerId: string;
}

export function PatientChartIntakeTab({
  businessId,
  customerId,
}: PatientChartIntakeTabProps) {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const [activeIntakeId, setActiveIntakeId] = useState<string | null>(null);

  const { data: intakes = [], isLoading } = useQuery({
    queryKey: ['pre-visit-intakes', businessId, customerId],
    queryFn: async () => {
      const { data } = await api.get(
        `/businesses/${businessId}/customers/${customerId}/pre-visit-intakes`,
      );
      return unwrapPreVisitIntakeList(data);
    },
    enabled: !!businessId && !!customerId,
  });

  const assignMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.post(
        `/businesses/${businessId}/customers/${customerId}/pre-visit-intakes`,
        {},
      );
      return unwrapPreVisitIntakeRecord<PreVisitIntakeSummary>(data);
    },
    onSuccess: (created) => {
      void queryClient.invalidateQueries({
        queryKey: ['pre-visit-intakes', businessId, customerId],
      });
      setActiveIntakeId(created.id);
    },
  });

  const selectedIntake = intakes.find((entry) => entry.id === activeIntakeId) ?? null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">{t('clinic.intakeForm.chartTitle')}</h2>
          <p className="text-sm text-gray-400">{t('clinic.intakeForm.chartSubtitle')}</p>
        </div>
        <button
          type="button"
          className="btn-primary inline-flex items-center gap-2"
          disabled={assignMutation.isPending}
          onClick={() => assignMutation.mutate()}
        >
          <Plus className="h-4 w-4" />
          {t('clinic.intakeForm.assignChartIntake')}
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-blue-400" />
        </div>
      ) : !intakes.length ? (
        <div className="card text-sm text-gray-400">{t('clinic.intakeForm.chartEmpty')}</div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
          <div className="space-y-3">
            {intakes.map((intake) => (
              <button
                key={intake.id}
                type="button"
                className={`card w-full text-left transition ${
                  activeIntakeId === intake.id ? 'ring-1 ring-blue-400' : ''
                }`}
                onClick={() => setActiveIntakeId(intake.id)}
              >
                <div className="flex items-center gap-2">
                  <ClipboardList className="h-4 w-4 text-blue-300" />
                  <h3 className="font-medium text-white">{intake.questionnaire.title}</h3>
                  <span className="rounded bg-gray-700 px-2 py-0.5 text-xs text-gray-300">
                    {t(preVisitIntakeStatusLabelKey(intake.status))}
                  </span>
                </div>
                <p className="mt-1 text-sm text-gray-400">
                  {intake.bookingId
                    ? t('clinic.intakeForm.linkedToBooking')
                    : t('clinic.intakeForm.chartLevelIntake')}
                </p>
              </button>
            ))}
          </div>

          <div>
            {selectedIntake ? (
              <IntakeFormFlow
                businessId={businessId}
                intakeId={selectedIntake.id}
                onCompleted={() => {
                  void queryClient.invalidateQueries({
                    queryKey: ['pre-visit-intakes', businessId, customerId],
                  });
                }}
              />
            ) : (
              <div className="card text-sm text-gray-400">
                {t('clinic.intakeForm.selectIntakePrompt')}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
