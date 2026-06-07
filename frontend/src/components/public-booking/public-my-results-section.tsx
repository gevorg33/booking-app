'use client';

import { Loader2 } from 'lucide-react';
import { useI18n } from '@/i18n';
import { formatDateDisplay } from '@/lib/date-format';
import {
  isReleasedClinicResultStatus,
  type PublicCustomerReleasedClinicResult,
} from '@/lib/public-clinic-results';
import { ClinicLabStatusBadge } from '@/components/clinic/clinic-lab-status-badge';
import { ReleasedClinicResultMeasurements } from '@/components/public-booking/released-clinic-result-measurements';

export interface PublicMyResultsSectionProps {
  results: PublicCustomerReleasedClinicResult[];
  loading: boolean;
  error: string | null;
  locale: string;
}

export function PublicMyResultsSection({
  results,
  loading,
  error,
  locale,
}: PublicMyResultsSectionProps) {
  const { t } = useI18n();

  if (loading) {
    return (
      <div className="flex justify-center py-10">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  if (error) {
    return <p className="text-sm text-red-600">{error}</p>;
  }

  if (results.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 px-5 py-8 text-center">
        <p className="text-gray-500">{t('public.myResults.empty')}</p>
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {results.map((result) => (
        <li
          key={result.id}
          className="bg-white rounded-2xl border border-gray-100 px-4 py-4"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="font-medium text-gray-900">
                {result.testName ?? t('public.myResults.unnamedResult')}
              </p>
              {result.releasedAt ? (
                <p className="text-sm text-gray-600 mt-2">
                  {t('public.myResults.releasedOn')}{' '}
                  {formatDateDisplay(new Date(result.releasedAt), locale)}
                </p>
              ) : null}
            </div>
            <div className="flex flex-col items-end gap-2 shrink-0">
              {isReleasedClinicResultStatus(result.status) ? (
                <ClinicLabStatusBadge kind="result" status="Released" theme="light" />
              ) : null}
              {result.measurementFlag ? (
                <ClinicLabStatusBadge
                  kind="measurement"
                  status={result.measurementFlag}
                  theme="light"
                />
              ) : null}
            </div>
          </div>
          <ReleasedClinicResultMeasurements result={result} />
        </li>
      ))}
    </ul>
  );
}
