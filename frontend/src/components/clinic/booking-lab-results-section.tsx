'use client';

import { useMemo, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useI18n } from '@/i18n';
import api from '@/lib/api';
import { formatDateDisplay } from '@/lib/date-format';
import {
  getBookingResultTransitionActions,
  mergeBookingLabResultRows,
  unwrapClinicLabList,
  type BookingLabResultRow,
  type ClinicBookingResultRecord,
} from '@/lib/clinic-lab-results';
import {
  type BookingLabResultSummary,
  type ClinicLabStatusBadgeKind,
} from '@/lib/clinic-lab-state';
import { ClinicLabStatusBadge } from './clinic-lab-status-badge';
import {
  ResultsActionHistoryModal,
  type ResultsActionHistoryScope,
} from './results-action-history-modal';

export interface BookingLabResultsSectionProps {
  businessId: string;
  bookingId: string;
  results?: BookingLabResultSummary[];
}

function ResultStatusBadges({ result }: { result: BookingLabResultRow }) {
  const { t } = useI18n();
  const badges: Array<{ kind: ClinicLabStatusBadgeKind; status: string; label: string }> =
    [
      { kind: 'order', status: result.orderStatus, label: t('clinic.labState.resultsTab.order') },
    ];

  if (result.specimenStatus) {
    badges.push({
      kind: 'specimen',
      status: result.specimenStatus,
      label: t('clinic.labState.resultsTab.specimen'),
    });
  }
  if (result.resultStatus) {
    badges.push({
      kind: 'result',
      status: result.resultStatus,
      label: t('clinic.labState.resultsTab.result'),
    });
  }
  if (result.measurementFlag) {
    badges.push({
      kind: 'measurement',
      status: result.measurementFlag,
      label: t('clinic.labState.resultsTab.measurement'),
    });
  }

  return (
    <div className="flex flex-wrap gap-2 mt-2">
      {badges.map(({ kind, status, label }) => (
        <div key={`${kind}-${status}`} className="flex items-center gap-1.5">
          <span className="text-[10px] uppercase tracking-wide text-gray-500">
            {label}
          </span>
          <ClinicLabStatusBadge kind={kind} status={status} />
        </div>
      ))}
    </div>
  );
}

function ResultTimestamps({ result }: { result: BookingLabResultRow }) {
  const { t } = useI18n();
  const entries = [
    { key: 'completedAt', value: result.completedAt },
    { key: 'reviewedAt', value: result.reviewedAt },
    { key: 'releasedAt', value: result.releasedAt },
  ].filter((entry) => entry.value);

  if (entries.length === 0) return null;

  return (
    <div className="mt-2 space-y-1 text-xs text-gray-400">
      {entries.map((entry) => (
        <div key={entry.key}>
          {t(`clinic.labResults.timestamps.${entry.key}`)}:{' '}
          {formatDateDisplay(new Date(entry.value!))}
        </div>
      ))}
    </div>
  );
}

export function BookingLabResultsSection({
  businessId,
  bookingId,
  results,
}: BookingLabResultsSectionProps) {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const [historyModal, setHistoryModal] = useState<{
    scope: ResultsActionHistoryScope;
    resultId?: string | null;
  } | null>(null);

  const summariesQuery = useQuery({
    queryKey: ['clinic-booking-lab-summaries', businessId, bookingId],
    queryFn: async () => {
      const { data } = await api.get(
        `/businesses/${businessId}/clinic-test-results/bookings/${bookingId}/summaries`,
      );
      return unwrapClinicLabList<BookingLabResultSummary>(data);
    },
    enabled: !!businessId && !!bookingId && results === undefined,
  });

  const resultsQuery = useQuery({
    queryKey: ['clinic-booking-lab-results', businessId, bookingId],
    queryFn: async () => {
      const { data } = await api.get(
        `/businesses/${businessId}/clinic-test-results/bookings/${bookingId}/results`,
      );
      return unwrapClinicLabList<ClinicBookingResultRecord>(data);
    },
    enabled: !!businessId && !!bookingId && results === undefined,
  });

  const rows = useMemo(() => {
    if (results !== undefined) {
      return mergeBookingLabResultRows(results, []);
    }
    return mergeBookingLabResultRows(
      summariesQuery.data ?? [],
      resultsQuery.data ?? [],
    );
  }, [results, summariesQuery.data, resultsQuery.data]);

  const isLoading =
    results === undefined && (summariesQuery.isLoading || resultsQuery.isLoading);

  const transitionMutation = useMutation({
    mutationFn: async (input: { resultId: string; toStatus: string }) => {
      const { data } = await api.post(
        `/businesses/${businessId}/clinic-test-results/results/${input.resultId}/transition`,
        { toStatus: input.toStatus },
      );
      return data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ['clinic-booking-lab-summaries', businessId, bookingId],
      });
      await queryClient.invalidateQueries({
        queryKey: ['clinic-booking-lab-results', businessId, bookingId],
      });
      await queryClient.invalidateQueries({
        queryKey: ['clinic-lab-change-history', businessId],
      });
    },
  });

  return (
    <>
      <section className="mb-5 rounded-lg border border-gray-700/80 bg-gray-800/40 p-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h4 className="text-sm font-medium text-gray-200">
            {t('clinic.labState.resultsTab.title')}
          </h4>
          <button
            type="button"
            className="btn-secondary text-xs py-1 px-2"
            onClick={() => setHistoryModal({ scope: 'booking' })}
          >
            {t('clinic.labResults.actions.viewBookingHistory')}
          </button>
        </div>
        {isLoading ? (
          <p className="mt-2 text-sm text-gray-500 inline-flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            {t('common.loading')}
          </p>
        ) : rows.length === 0 ? (
          <p className="mt-2 text-sm text-gray-500">
            {t('clinic.labState.resultsTab.empty')}
          </p>
        ) : (
          <ul className="mt-3 space-y-3">
            {rows.map((result) => {
              const actions = result.resultStatus
                ? getBookingResultTransitionActions(result.resultStatus)
                : [];

              return (
                <li
                  key={result.orderId}
                  className="rounded-md border border-gray-700/60 bg-gray-900/40 p-3"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-100">{result.testName}</p>
                      <ResultStatusBadges result={result} />
                      <ResultTimestamps result={result} />
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {result.resultId ? (
                        <button
                          type="button"
                          className="btn-secondary text-xs py-1 px-2"
                          onClick={() =>
                            setHistoryModal({
                              scope: 'result',
                              resultId: result.resultId,
                            })
                          }
                        >
                          {t('clinic.labResults.actions.viewResultHistory')}
                        </button>
                      ) : null}
                      {actions.map((action) => (
                        <button
                          key={`${result.orderId}-${action.toStatus}`}
                          type="button"
                          className="btn-primary text-xs py-1 px-2"
                          disabled={
                            !result.resultId ||
                            transitionMutation.isPending ||
                            (transitionMutation.variables?.resultId === result.resultId &&
                              transitionMutation.variables?.toStatus === action.toStatus)
                          }
                          onClick={() => {
                            if (!result.resultId) return;
                            transitionMutation.mutate({
                              resultId: result.resultId,
                              toStatus: action.toStatus,
                            });
                          }}
                        >
                          {t(`clinic.labResults.actions.${action.labelKey}`)}
                        </button>
                      ))}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <ResultsActionHistoryModal
        open={historyModal !== null}
        businessId={businessId}
        scope={historyModal?.scope ?? 'booking'}
        resultId={historyModal?.resultId}
        bookingId={bookingId}
        onClose={() => setHistoryModal(null)}
      />
    </>
  );
}
