'use client';

import { useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import api from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { formatDateDisplay, formatTimeRangeDisplay } from '@/lib/date-format';
import { useI18n } from '@/i18n';

export default function ProviderSchedulePage() {
  const { t } = useI18n();
  const { business } = useAuthStore();

  const { data: summary, isLoading: loadingSummary } = useQuery({
    queryKey: ['provider-schedule-summary', business?.id],
    queryFn: async () => {
      const { data: res } = await api.get(`/businesses/${business!.id}/provider/schedule/summary?days=14`);
      return ((res as { data?: unknown })?.data ?? res) as {
        days: Array<{ date: string; available: number; booked: number }>;
      };
    },
    enabled: !!business?.id,
  });

  const { data: upcoming, isLoading: loadingUpcoming } = useQuery({
    queryKey: ['provider-upcoming', business?.id],
    queryFn: async () => {
      const { data: res } = await api.get(`/businesses/${business!.id}/provider/bookings/upcoming?days=14`);
      return ((res as { data?: unknown })?.data ?? res) as {
        bookings: Array<{
          id: string;
          startTime: string;
          endTime: string;
          service: { name: string } | null;
          customer: { name: string } | null;
        }>;
      };
    },
    enabled: !!business?.id,
  });

  const isLoading = loadingSummary || loadingUpcoming;

  return (
    <div className="py-6 space-y-6">
      <header>
        <h1 className="text-2xl font-bold">{t('provider.scheduleTitle')}</h1>
        <p className="text-sm text-gray-400 mt-1">{t('provider.scheduleSubtitle')}</p>
      </header>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
        </div>
      ) : (
        <>
          {summary?.days?.length ? (
            <section className="card">
              <h2 className="font-semibold mb-3">{t('provider.availability')}</h2>
              <ul className="space-y-2 text-sm">
                {summary.days.map((d) => (
                  <li key={d.date} className="flex justify-between border-b border-gray-800 pb-2 last:border-0">
                    <span>{formatDateDisplay(d.date)}</span>
                    <span className="text-gray-400">
                      {d.booked} {t('provider.booked')} · {d.available} {t('provider.open')}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <section>
            <h2 className="font-semibold mb-3">{t('provider.upcomingAppointments')}</h2>
            {!upcoming?.bookings?.length ? (
              <p className="text-gray-500 text-sm">{t('provider.noUpcoming')}</p>
            ) : (
              <ul className="space-y-2">
                {upcoming.bookings.map((b) => (
                  <li key={b.id} className="card text-sm">
                    <p className="font-medium">{formatDateDisplay(b.startTime)}</p>
                    <p className="text-gray-400">{formatTimeRangeDisplay(b.startTime, b.endTime)}</p>
                    <p className="mt-1">{b.service?.name} — {b.customer?.name}</p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </div>
  );
}
