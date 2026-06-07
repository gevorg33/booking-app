'use client';

import { useQuery } from '@tanstack/react-query';
import { Loader2, X } from 'lucide-react';
import api from '@/lib/api';
import { useI18n } from '@/i18n';
import { formatDateDisplay } from '@/lib/date-format';
import {
  formatClinicLabChangeHistoryActionLabel,
  formatClinicLabChangeHistoryPropertyLabel,
  formatClinicLabChangeHistoryStatusValue,
  resolveClinicLabChangeHistoryEditedByLabel,
  unwrapClinicLabList,
  type ClinicLabChangeHistoryItem,
} from '@/lib/clinic-lab-results';

export type ResultsActionHistoryScope = 'result' | 'booking';

export interface ResultsActionHistoryModalProps {
  open: boolean;
  businessId: string;
  scope: ResultsActionHistoryScope;
  resultId?: string | null;
  bookingId?: string | null;
  onClose: () => void;
}

function resolveHistoryPath(
  businessId: string,
  scope: ResultsActionHistoryScope,
  resultId?: string | null,
  bookingId?: string | null,
): string | null {
  if (scope === 'result' && resultId) {
    return `/businesses/${businessId}/clinic-test-results/results/${resultId}/change-history`;
  }
  if (scope === 'booking' && bookingId) {
    return `/businesses/${businessId}/clinic-test-results/bookings/${bookingId}/change-history`;
  }
  return null;
}

export function ResultsActionHistoryModal({
  open,
  businessId,
  scope,
  resultId,
  bookingId,
  onClose,
}: ResultsActionHistoryModalProps) {
  const { t } = useI18n();
  const path = resolveHistoryPath(businessId, scope, resultId, bookingId);

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ['clinic-lab-change-history', businessId, scope, resultId, bookingId],
    queryFn: async () => {
      if (!path) return [] as ClinicLabChangeHistoryItem[];
      const { data } = await api.get(path);
      return unwrapClinicLabList<ClinicLabChangeHistoryItem>(data);
    },
    enabled: open && !!path,
  });

  if (!open) return null;

  const title =
    scope === 'booking'
      ? t('clinic.labResults.changeHistory.bookingTitle')
      : t('clinic.labResults.changeHistory.resultTitle');

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end md:items-center justify-center p-4 bg-black/60"
      role="presentation"
      onClick={onClose}
    >
      <div
        className="w-full max-w-4xl max-h-[85vh] overflow-hidden rounded-xl border border-gray-700 bg-gray-900 shadow-xl flex flex-col"
        role="dialog"
        aria-modal="true"
        aria-labelledby="results-action-history-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3 border-b border-gray-700 px-4 py-3">
          <h2 id="results-action-history-title" className="text-lg font-semibold text-gray-100">
            {title}
          </h2>
          <button
            type="button"
            className="rounded-md p-1 text-gray-400 hover:text-gray-200"
            aria-label={t('common.close')}
            onClick={onClose}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="overflow-auto flex-1 px-4 py-3">
          {isLoading ? (
            <div className="flex items-center justify-center gap-2 py-10 text-gray-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              {t('common.loading')}
            </div>
          ) : rows.length === 0 ? (
            <p className="py-10 text-center text-sm text-gray-500">
              {t('clinic.labResults.changeHistory.empty')}
            </p>
          ) : (
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-gray-700 text-left text-gray-500">
                  <th className="py-2 pr-4 font-medium">
                    {t('clinic.labResults.changeHistory.columns.editedBy')}
                  </th>
                  <th className="py-2 pr-4 font-medium">
                    {t('clinic.labResults.changeHistory.columns.changed')}
                  </th>
                  <th className="py-2 pr-4 font-medium">
                    {t('clinic.labResults.changeHistory.columns.from')}
                  </th>
                  <th className="py-2 pr-4 font-medium">
                    {t('clinic.labResults.changeHistory.columns.to')}
                  </th>
                  <th className="py-2 pr-4 font-medium">
                    {t('clinic.labResults.changeHistory.columns.date')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} className="border-b border-gray-800/80 align-top">
                    <td className="py-3 pr-4 text-gray-200">
                      {resolveClinicLabChangeHistoryEditedByLabel(row.editedBy, t)}
                    </td>
                    <td className="py-3 pr-4 text-gray-200">
                      <div>{formatClinicLabChangeHistoryActionLabel(row.action, t)}</div>
                      {row.changes.map((change) => (
                        <div key={`${row.id}-${change.propertyName}`} className="text-gray-400">
                          {formatClinicLabChangeHistoryPropertyLabel(change.propertyName, t)}
                        </div>
                      ))}
                    </td>
                    <td className="py-3 pr-4 text-gray-300">
                      {row.changes.map((change) => (
                        <div key={`${row.id}-${change.propertyName}-from`}>
                          {formatClinicLabChangeHistoryStatusValue(change.from, t)}
                        </div>
                      ))}
                    </td>
                    <td className="py-3 pr-4 text-gray-300">
                      {row.changes.map((change) => (
                        <div key={`${row.id}-${change.propertyName}-to`}>
                          {formatClinicLabChangeHistoryStatusValue(change.to, t)}
                        </div>
                      ))}
                    </td>
                    <td className="py-3 pr-4 text-gray-300 whitespace-nowrap">
                      {formatDateDisplay(new Date(row.date))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="border-t border-gray-700 px-4 py-3 flex justify-end">
          <button type="button" className="btn-secondary" onClick={onClose}>
            {t('common.close')}
          </button>
        </div>
      </div>
    </div>
  );
}
