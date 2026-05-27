'use client';

import { Loader2, X } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { formatDateDisplay, formatTimeRangeDisplay } from '@/lib/date-format';
import { BOOKING_STATUS_LABELS, type BookingStatus } from '@/lib/booking-types';

export interface CustomerDetail {
  customer: {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    createdAt: string;
    updatedAt: string;
  };
  stats: {
    total: number;
    byStatus: Record<string, number>;
    lastBookingAt: string | null;
    upcomingCount: number;
    noShowCount: number;
  };
  appointments: Array<{
    id: string;
    startTime: string;
    endTime: string;
    status: string;
    paymentStatus: string;
    notes: string | null;
    service: { id: string; name: string } | null;
    employee: { id: string; name: string } | null;
  }>;
}

interface CustomerDetailPanelProps {
  businessId: string;
  customerId: string | null;
  onClose: () => void;
}

export function CustomerDetailPanel({ businessId, customerId, onClose }: CustomerDetailPanelProps) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['customer-detail', businessId, customerId],
    queryFn: async () => {
      const { data: res } = await api.get(
        `/businesses/${businessId}/customers/${customerId}/detail`,
      );
      return (res.data || res) as CustomerDetail;
    },
    enabled: !!businessId && !!customerId,
  });

  if (!customerId) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button type="button" className="absolute inset-0 bg-black/50" onClick={onClose} aria-label="Close" />
      <aside className="relative w-full max-w-lg bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-800 h-full overflow-y-auto shadow-xl">
        <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-5 py-4 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900 dark:text-gray-100">Customer</h2>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
          </div>
        ) : isError || !data ? (
          <p className="text-red-400 text-sm p-5">Failed to load customer</p>
        ) : (
          <div className="p-5 space-y-6">
            <div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">{data.customer.name}</h3>
              {data.customer.email && (
                <p className="text-sm text-gray-500 mt-1">{data.customer.email}</p>
              )}
              {data.customer.phone && (
                <p className="text-sm text-gray-500">{data.customer.phone}</p>
              )}
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-lg bg-gray-100 dark:bg-gray-800 p-3 text-center">
                <p className="text-lg font-bold">{data.stats.total}</p>
                <p className="text-xs text-gray-500">Visits</p>
              </div>
              <div className="rounded-lg bg-gray-100 dark:bg-gray-800 p-3 text-center">
                <p className="text-lg font-bold">{data.stats.upcomingCount}</p>
                <p className="text-xs text-gray-500">Upcoming</p>
              </div>
              <div className="rounded-lg bg-gray-100 dark:bg-gray-800 p-3 text-center">
                <p className="text-lg font-bold text-orange-500">{data.stats.noShowCount}</p>
                <p className="text-xs text-gray-500">No-shows</p>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                Appointment history
              </h4>
              {data.appointments.length === 0 ? (
                <p className="text-sm text-gray-500">No appointments yet</p>
              ) : (
                <ul className="space-y-3">
                  {data.appointments.map((appt) => (
                    <li
                      key={appt.id}
                      className="rounded-lg border border-gray-200 dark:border-gray-800 p-3 text-sm"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium text-gray-900 dark:text-gray-100">
                          {appt.service?.name ?? 'Appointment'}
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                          {BOOKING_STATUS_LABELS[appt.status as BookingStatus] ?? appt.status}
                        </span>
                      </div>
                      <p className="text-gray-500 mt-1">
                        {formatDateDisplay(new Date(appt.startTime))} ·{' '}
                        {formatTimeRangeDisplay(new Date(appt.startTime), new Date(appt.endTime))}
                      </p>
                      {appt.employee && (
                        <p className="text-gray-500 text-xs mt-0.5">with {appt.employee.name}</p>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </aside>
    </div>
  );
}
