'use client';

import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { useI18n } from '@/i18n';
import { formatDateDisplay } from '@/lib/date-format';
import {
  type PatientChartOrderRow,
  unwrapPatientChartList,
} from '@/lib/patient-chart';
import { ClinicLabStatusBadge } from '@/components/clinic/clinic-lab-status-badge';
import { BookingLabOrderPushPanel } from '@/components/clinic/booking-lab-order-push-panel';
import { PatientChartCatalogOrderPanel } from './patient-chart-catalog-order-panel';

export interface PatientChartOrdersTabProps {
  businessId: string;
  customerId: string;
}

export function PatientChartOrdersTab({
  businessId,
  customerId,
}: PatientChartOrdersTabProps) {
  const { t, locale } = useI18n();

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['patient-chart-orders', businessId, customerId],
    queryFn: async () => {
      const { data } = await api.get(
        `/businesses/${businessId}/customers/${customerId}/patient-chart/orders`,
      );
      return unwrapPatientChartList<PatientChartOrderRow>(data);
    },
    enabled: !!businessId && !!customerId,
  });

  return (
    <div className="space-y-4">
      <PatientChartCatalogOrderPanel businessId={businessId} customerId={customerId} />

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-blue-400" />
        </div>
      ) : orders.length === 0 ? (
        <div className="card text-sm text-gray-500">{t('clinic.patientChart.ordersEmpty')}</div>
      ) : (
        <div className="card">
          <h2 className="mb-3 text-sm font-semibold">
            {t('clinic.patientChart.catalogOrder.ordersListTitle')}
          </h2>
          <ul className="space-y-3">
            {orders.map((order) => (
              <li
                key={order.id}
                className="rounded-md border border-gray-200 p-3 dark:border-gray-800"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-medium">
                    {order.displayNames ?? t('clinic.labState.ordersTab.unnamedOrder')}
                  </p>
                  <ClinicLabStatusBadge kind="order" status={order.status} />
                </div>
                <div className="mt-2 flex flex-wrap gap-4 text-xs text-gray-500">
                  <span>
                    {t('clinic.patientChart.columns.created')}:{' '}
                    {formatDateDisplay(new Date(order.createdAt), locale)}
                  </span>
                  {order.bookingId ? (
                    <Link
                      href={`/dashboard/appointments?bookingId=${order.bookingId}`}
                      className="text-blue-400 hover:underline"
                    >
                      {t('clinic.labQueue.openBooking')}
                    </Link>
                  ) : null}
                </div>
                <BookingLabOrderPushPanel businessId={businessId} orderId={order.id} />
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
