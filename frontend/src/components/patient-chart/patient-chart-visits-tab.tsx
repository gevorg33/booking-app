'use client';

import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { useI18n } from '@/i18n';
import { formatDateDisplay, formatTimeRangeDisplay } from '@/lib/date-format';
import type { CustomerDetail } from '@/components/customers/customer-detail-panel';
import { BOOKING_STATUS_I18N_KEYS } from '@/lib/booking-detail-panel.util';
import { type BookingStatus } from '@/lib/booking-types';
import {
  mapCustomerAppointmentsToVisits,
  unwrapPatientChartData,
} from '@/lib/patient-chart';

export interface PatientChartVisitsTabProps {
  businessId: string;
  customerId: string;
}

export function PatientChartVisitsTab({
  businessId,
  customerId,
}: PatientChartVisitsTabProps) {
  const { t, locale } = useI18n();

  const { data, isLoading } = useQuery({
    queryKey: ['customer-detail', businessId, customerId],
    queryFn: async () => {
      const { data: res } = await api.get(
        `/businesses/${businessId}/customers/${customerId}/detail`,
      );
      return unwrapPatientChartData<CustomerDetail>(res);
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

  const visits = mapCustomerAppointmentsToVisits(data?.appointments ?? []);

  if (visits.length === 0) {
    return (
      <div className="card text-sm text-gray-500">{t('clinic.patientChart.visitsEmpty')}</div>
    );
  }

  return (
    <div className="card overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200 text-left dark:border-gray-800">
            <th className="py-2 pr-4">{t('clinic.patientChart.columns.service')}</th>
            <th className="py-2 pr-4">{t('clinic.patientChart.columns.when')}</th>
            <th className="py-2 pr-4">{t('clinic.patientChart.columns.provider')}</th>
            <th className="py-2 pr-4">{t('clinic.patientChart.columns.status')}</th>
            <th className="py-2 pr-4">{t('clinic.patientChart.columns.appointment')}</th>
          </tr>
        </thead>
        <tbody>
          {visits.map((visit) => (
            <tr key={visit.id} className="border-b border-gray-100 dark:border-gray-800/80">
              <td className="py-3 pr-4 font-medium">
                {visit.serviceName ?? t('customers.appointmentFallback')}
              </td>
              <td className="py-3 pr-4 text-gray-500">
                {formatDateDisplay(new Date(visit.startTime), locale)} ·{' '}
                {formatTimeRangeDisplay(new Date(visit.startTime), new Date(visit.endTime))}
              </td>
              <td className="py-3 pr-4 text-gray-500">{visit.providerName ?? '—'}</td>
              <td className="py-3 pr-4">
                <span className="rounded bg-gray-100 px-2 py-0.5 text-xs dark:bg-gray-800">
                  {BOOKING_STATUS_I18N_KEYS[visit.status as BookingStatus]
                    ? t(BOOKING_STATUS_I18N_KEYS[visit.status as BookingStatus])
                    : visit.status}
                </span>
              </td>
              <td className="py-3 pr-4">
                <Link
                  href={`/dashboard/appointments?bookingId=${visit.id}`}
                  className="text-blue-400 hover:underline"
                >
                  {t('clinic.labQueue.openBooking')}
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
