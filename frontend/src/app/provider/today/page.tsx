'use client';

import { useQuery } from '@tanstack/react-query';
import { Loader2, Phone, Mail, User } from 'lucide-react';
import api from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { formatDateDisplay } from '@/lib/date-format';
import { formatBookingBlockHeadline } from '@/lib/booking-types';
import { useI18n } from '@/i18n';

interface BookingItem {
  id: string;
  startTime: string;
  endTime: string;
  status: string;
  notes: string | null;
  service: { id: string; name: string; price?: number; currency?: string } | null;
  customer: { id: string; name: string; phone: string | null; email: string | null } | null;
}

export default function ProviderTodayPage() {
  const { t } = useI18n();
  const { business, user } = useAuthStore();

  const { data, isLoading } = useQuery({
    queryKey: ['provider-today', business?.id],
    queryFn: async () => {
      const { data: res } = await api.get(`/businesses/${business!.id}/provider/bookings/today`);
      return ((res as { data?: unknown })?.data ?? res) as {
        date: string;
        employee: { name: string };
        bookings: BookingItem[];
      };
    },
    enabled: !!business?.id,
    refetchInterval: 60_000,
  });

  return (
    <div className="py-6 space-y-6">
      <header>
        <p className="text-sm text-gray-500">{t('provider.today')}</p>
        <h1 className="text-2xl font-bold">
          {user?.firstName ? `${t('provider.hello')}, ${user.firstName}` : t('provider.appTitle')}
        </h1>
        {data?.employee && (
          <p className="text-sm text-gray-400 mt-1">{data.employee.name}</p>
        )}
      </header>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
        </div>
      ) : !data?.bookings.length ? (
        <div className="card text-center py-12">
          <p className="text-gray-400">{t('provider.noAppointmentsToday')}</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {data.bookings.map((b) => (
            <li key={b.id} className="card">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold text-lg">
                    {formatBookingBlockHeadline(b)}
                  </p>
                  <p className="text-sm text-gray-400">{formatDateDisplay(b.startTime)}</p>
                </div>
              </div>
              {b.service && (
                <p className="mt-2 font-medium">{b.service.name}</p>
              )}
              {b.customer && (
                <div className="mt-3 pt-3 border-t border-gray-800 space-y-1 text-sm text-gray-400">
                  <p className="flex items-center gap-2">
                    <User className="w-4 h-4 shrink-0" />
                    {b.customer.name}
                  </p>
                  {b.customer.phone && (
                    <a href={`tel:${b.customer.phone}`} className="flex items-center gap-2 text-blue-400">
                      <Phone className="w-4 h-4 shrink-0" />
                      {b.customer.phone}
                    </a>
                  )}
                  {b.customer.email && (
                    <a href={`mailto:${b.customer.email}`} className="flex items-center gap-2 text-blue-400">
                      <Mail className="w-4 h-4 shrink-0" />
                      {b.customer.email}
                    </a>
                  )}
                </div>
              )}
              {b.notes && <p className="mt-2 text-sm text-gray-500">{b.notes}</p>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
