'use client';

import { Loader2, Plus } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { useI18n } from '@/i18n';
import {
  unwrapPreVisitIntakeRecord,
  type PreVisitIntakeSummary,
} from '@/lib/clinic-pre-visit-intake';
import { IntakeFormFlow } from '@/components/intake-form/intake-form-flow';

export interface BookingIntakeSectionProps {
  businessId: string;
  bookingId: string;
}

export function BookingIntakeSection({ businessId, bookingId }: BookingIntakeSectionProps) {
  const { t } = useI18n();
  const queryClient = useQueryClient();

  const { data: intake, isLoading } = useQuery({
    queryKey: ['booking-pre-visit-intake', businessId, bookingId],
    queryFn: async () => {
      const { data } = await api.get(
        `/businesses/${businessId}/bookings/${bookingId}/pre-visit-intake`,
      );
      const record = unwrapPreVisitIntakeRecord<PreVisitIntakeSummary | null>(data);
      return record;
    },
    enabled: !!businessId && !!bookingId,
  });

  const assignMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.post(
        `/businesses/${businessId}/bookings/${bookingId}/pre-visit-intake`,
        {},
      );
      return unwrapPreVisitIntakeRecord<PreVisitIntakeSummary>(data);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ['booking-pre-visit-intake', businessId, bookingId],
      });
    },
  });

  return (
    <div className="mb-5 space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-white">{t('clinic.intakeForm.bookingTitle')}</h3>
          <p className="text-xs text-gray-400">{t('clinic.intakeForm.bookingSubtitle')}</p>
        </div>
        {!intake ? (
          <button
            type="button"
            className="btn-secondary inline-flex items-center gap-2"
            disabled={assignMutation.isPending || isLoading}
            onClick={() => assignMutation.mutate()}
          >
            <Plus className="h-4 w-4" />
            {t('clinic.intakeForm.assignBookingIntake')}
          </button>
        ) : null}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-6">
          <Loader2 className="h-5 w-5 animate-spin text-blue-400" />
        </div>
      ) : intake ? (
        <IntakeFormFlow
          businessId={businessId}
          intakeId={intake.id}
          onCompleted={() => {
            void queryClient.invalidateQueries({
              queryKey: ['booking-pre-visit-intake', businessId, bookingId],
            });
          }}
        />
      ) : (
        <div className="card text-sm text-gray-400">{t('clinic.intakeForm.bookingEmpty')}</div>
      )}
    </div>
  );
}
