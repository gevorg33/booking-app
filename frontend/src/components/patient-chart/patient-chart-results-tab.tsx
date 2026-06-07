'use client';

import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { useI18n } from '@/i18n';
import { formatDateDisplay } from '@/lib/date-format';
import {
  type PatientChartResultRow,
  unwrapPatientChartList,
} from '@/lib/patient-chart';
import { ClinicLabStatusBadge } from '@/components/clinic/clinic-lab-status-badge';

export interface PatientChartResultsTabProps {
  businessId: string;
  customerId: string;
}

export function PatientChartResultsTab({
  businessId,
  customerId,
}: PatientChartResultsTabProps) {
  const { t, locale } = useI18n();

  const { data: results = [], isLoading } = useQuery({
    queryKey: ['patient-chart-results', businessId, customerId],
    queryFn: async () => {
      const { data } = await api.get(
        `/businesses/${businessId}/customers/${customerId}/patient-chart/results`,
      );
      return unwrapPatientChartList<PatientChartResultRow>(data);
    },
    enabled: !!businessId && !!customerId,
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-blue-400" />
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="card text-sm text-gray-500">{t('clinic.patientChart.resultsEmpty')}</div>
    );
  }

  return (
    <div className="card overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200 text-left dark:border-gray-800">
            <th className="py-2 pr-4">{t('clinic.labQueue.columns.test')}</th>
            <th className="py-2 pr-4">{t('clinic.labQueue.columns.status')}</th>
            <th className="py-2 pr-4">{t('clinic.patientChart.columns.released')}</th>
            <th className="py-2 pr-4">{t('clinic.patientChart.columns.appointment')}</th>
          </tr>
        </thead>
        <tbody>
          {results.map((result) => (
            <tr key={result.id} className="border-b border-gray-100 dark:border-gray-800/80">
              <td className="py-3 pr-4 font-medium">
                {result.testName ?? t('clinic.labState.resultsTab.unnamedResult')}
              </td>
              <td className="py-3 pr-4">
                <div className="flex flex-wrap items-center gap-2">
                  <ClinicLabStatusBadge kind="result" status={result.status} />
                  {result.measurementFlag ? (
                    <ClinicLabStatusBadge
                      kind="measurement"
                      status={result.measurementFlag}
                    />
                  ) : null}
                </div>
              </td>
              <td className="py-3 pr-4 text-gray-500">
                {result.releasedAt
                  ? formatDateDisplay(new Date(result.releasedAt), locale)
                  : result.completedAt
                    ? formatDateDisplay(new Date(result.completedAt), locale)
                    : '—'}
              </td>
              <td className="py-3 pr-4">
                {result.bookingId ? (
                  <Link
                    href={`/dashboard/appointments?bookingId=${result.bookingId}`}
                    className="text-blue-400 hover:underline"
                  >
                    {t('clinic.labQueue.openBooking')}
                  </Link>
                ) : (
                  '—'
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
