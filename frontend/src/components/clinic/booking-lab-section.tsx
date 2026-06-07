'use client';

import { useState } from 'react';
import { useI18n } from '@/i18n';
import { BookingLabOrdersSection } from './booking-lab-orders-section';
import { BookingLabResultsSection } from './booking-lab-results-section';

export interface BookingLabSectionProps {
  businessId: string;
  bookingId: string;
}

type LabDetailTab = 'orders' | 'results';

export function BookingLabSection({ businessId, bookingId }: BookingLabSectionProps) {
  const { t } = useI18n();
  const [tab, setTab] = useState<LabDetailTab>('orders');

  return (
    <div className="mb-5">
      <div className="mb-3 inline-flex rounded-lg border border-gray-700/80 bg-gray-900/40 p-1">
        {(['orders', 'results'] as const).map((value) => (
          <button
            key={value}
            type="button"
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              tab === value
                ? 'bg-blue-600 text-white'
                : 'text-gray-400 hover:text-gray-200'
            }`}
            onClick={() => setTab(value)}
          >
            {value === 'orders'
              ? t('clinic.labState.ordersTab.tabLabel')
              : t('clinic.labState.resultsTab.tabLabel')}
          </button>
        ))}
      </div>
      {tab === 'orders' ? (
        <BookingLabOrdersSection businessId={businessId} bookingId={bookingId} />
      ) : (
        <BookingLabResultsSection businessId={businessId} bookingId={bookingId} />
      )}
    </div>
  );
}
