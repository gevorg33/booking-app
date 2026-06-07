'use client';

import { useI18n } from '@/i18n';
import { ClinicLabStatusBadge } from '@/components/clinic/clinic-lab-status-badge';
import {
  formatReleasedClinicMeasurementValue,
  hasReleasedClinicResultMeasurements,
  type PublicCustomerReleasedClinicResult,
} from '@/lib/public-clinic-results';

export interface ReleasedClinicResultMeasurementsProps {
  result: Pick<PublicCustomerReleasedClinicResult, 'measurements'>;
}

export function ReleasedClinicResultMeasurements({
  result,
}: ReleasedClinicResultMeasurementsProps) {
  const { t } = useI18n();

  if (!hasReleasedClinicResultMeasurements(result)) {
    return null;
  }

  return (
    <div className="mt-4 overflow-x-auto">
      <table className="w-full min-w-[28rem] text-sm">
        <thead>
          <tr className="border-b border-gray-100 text-left text-gray-500">
            <th className="py-2 pr-3 font-medium">{t('public.myResults.measurement')}</th>
            <th className="py-2 pr-3 font-medium">{t('public.myResults.value')}</th>
            <th className="py-2 pr-3 font-medium">
              {t('public.myResults.referenceRange')}
            </th>
            <th className="py-2 font-medium">{t('public.myResults.flag')}</th>
          </tr>
        </thead>
        <tbody>
          {result.measurements.map((measurement) => {
            const formattedValue = formatReleasedClinicMeasurementValue(measurement);
            return (
              <tr key={measurement.id} className="border-b border-gray-50 align-top">
                <td className="py-2 pr-3 text-gray-900">{measurement.name}</td>
                <td className="py-2 pr-3 text-gray-900">
                  {formattedValue ?? '—'}
                </td>
                <td className="py-2 pr-3 text-gray-600">
                  {measurement.referenceRange ?? '—'}
                </td>
                <td className="py-2">
                  {measurement.measurementFlag ? (
                    <ClinicLabStatusBadge
                      kind="measurement"
                      status={measurement.measurementFlag}
                      theme="light"
                    />
                  ) : (
                    <span className="text-gray-400">—</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
