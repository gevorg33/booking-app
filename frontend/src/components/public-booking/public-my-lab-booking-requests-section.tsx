'use client';

import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import { useI18n } from '@/i18n';
import { formatDateDisplay } from '@/lib/date-format';
import type { PublicClinicLabBookingRequest } from '@/lib/clinic-lab-booking-request';

export interface PublicMyLabBookingRequestsSectionProps {
  requests: PublicClinicLabBookingRequest[];
  loading: boolean;
  error: string | null;
  locale: string;
}

export function PublicMyLabBookingRequestsSection({
  requests,
  loading,
  error,
  locale,
}: PublicMyLabBookingRequestsSectionProps) {
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

  if (requests.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 px-5 py-8 text-center">
        <p className="text-gray-500">{t('public.myLabRequests.empty')}</p>
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {requests.map((request) => (
        <li
          key={request.orderId}
          className="bg-white rounded-2xl border border-gray-100 px-5 py-4"
        >
          <p className="text-sm font-medium text-gray-900">
            {request.displayNames ?? t('clinic.labState.ordersTab.unnamedOrder')}
          </p>
          <p className="mt-1 text-sm text-gray-600">
            {t('public.myLabRequests.collectionService').replace(
              '{service}',
              request.collectionServiceName,
            )}
          </p>
          <p className="mt-1 text-xs text-gray-500">
            {t('public.myLabRequests.requestedOn').replace(
              '{date}',
              formatDateDisplay(request.pushedAt, locale),
            )}
          </p>
          <Link
            href={request.bookUrl}
            className="mt-3 inline-flex rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700"
          >
            {t('public.myLabRequests.bookCollection')}
          </Link>
        </li>
      ))}
    </ul>
  );
}
