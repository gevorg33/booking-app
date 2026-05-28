'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { CalendarDays, ClipboardList, Loader2, Search } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/lib/store';
import api from '@/lib/api';
import { useI18n } from '@/i18n';
import { formatDateDisplay, formatTimeRangeDisplay } from '@/lib/date-format';
import {
  BOOKING_STATUS_FILTER_OPTIONS,
  buildAppointmentSearchQuery,
  type AppointmentSearchParams,
  type AppointmentsSearchResult,
} from '@/lib/appointment-types';
import { BOOKING_STATUS_LABELS, STATUS_BADGE, type BookingStatus } from '@/lib/booking-types';
import { useDebouncedValue } from '@/lib/use-debounced-value';
import { SortableColumnHeader } from '@/components/table/sortable-column-header';
import { DEFAULT_PAGE_SIZE, TablePagination } from '@/components/table/table-pagination';
import { BookingDetailPanel } from '@/components/bookings/booking-detail-panel';
import { useOperationalEvents } from '@/lib/use-operational-events';
import { AiPagePanel } from '@/components/ai-page-panel';
import { AI_PAGE_SUGGESTIONS } from '@/lib/ai-orchestration';

const defaultParams: AppointmentSearchParams = {
  sortBy: 'startTime',
  sortOrder: 'DESC',
  page: 1,
  pageSize: DEFAULT_PAGE_SIZE,
};

export default function AppointmentsPage() {
  const { t } = useI18n();
  const { business } = useAuthStore();
  const queryClient = useQueryClient();
  const [params, setParams] = useState<AppointmentSearchParams>(defaultParams);
  const [searchInput, setSearchInput] = useState('');
  const [statusFilter, setStatusFilter] = useState<BookingStatus | ''>('');
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);
  const debouncedSearch = useDebouncedValue(searchInput, 300);

  const refreshAppointments = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['appointments-dashboard', business?.id] });
    queryClient.invalidateQueries({ queryKey: ['booking'] });
  }, [queryClient, business?.id]);

  const onOperationalEvent = useCallback(
    (type: string) => {
      if (
        type === 'booking.updated' ||
        type === 'booking.rescheduled' ||
        type === 'booking.cancelled' ||
        type === 'booking.completed' ||
        type === 'booking.created' ||
        type === 'availability.updated'
      ) {
        refreshAppointments();
      }
    },
    [refreshAppointments],
  );

  useOperationalEvents(business?.id, onOperationalEvent);

  useEffect(() => {
    setParams((p) => ({ ...p, page: 1 }));
  }, [debouncedSearch, statusFilter]);

  const queryString = useMemo(
    () =>
      buildAppointmentSearchQuery({
        ...params,
        search: debouncedSearch.trim() || undefined,
        status: statusFilter || undefined,
      }),
    [params, debouncedSearch, statusFilter],
  );

  const { data, isLoading, isError } = useQuery({
    queryKey: ['appointments-dashboard', business?.id, queryString],
    queryFn: async () => {
      const { data: res } = await api.get(
        `/businesses/${business!.id}/bookings/dashboard${queryString}`,
      );
      return (res.data || res) as AppointmentsSearchResult;
    },
    enabled: !!business?.id,
  });

  const sortBy = params.sortBy ?? 'startTime';
  const sortOrder = params.sortOrder ?? 'DESC';
  const appointments = data?.appointments ?? [];
  const totalItems = data?.totalItems ?? 0;
  const page = data?.page ?? params.page ?? 1;
  const pageSize = data?.pageSize ?? params.pageSize ?? DEFAULT_PAGE_SIZE;

  const toggleSort = (column: AppointmentSearchParams['sortBy']) => {
    setParams((p) => {
      const current = p.sortBy ?? 'startTime';
      const currentOrder = p.sortOrder ?? 'DESC';
      if (current === column) {
        return { ...p, sortOrder: currentOrder === 'ASC' ? 'DESC' : 'ASC', page: 1 };
      }
      const defaultOrder = 'DESC';
      return { ...p, sortBy: column, sortOrder: defaultOrder, page: 1 };
    });
  };

  return (
    <div>
      <AiPagePanel
        suggestions={AI_PAGE_SUGGESTIONS['/dashboard/appointments']}
        context={{
          route: '/dashboard/appointments',
          statusFilter: statusFilter || null,
          search: debouncedSearch.trim() || null,
        }}
      />

      <div className="mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <ClipboardList className="w-6 h-6 text-blue-400" />
          {t('appointments.title')}
        </h1>
        <p className="text-gray-400 text-sm mt-1">{t('appointments.subtitle')}</p>
      </div>

      {data != null && (
        <div className="card flex items-center gap-3 mb-6 w-fit">
          <div className="w-10 h-10 rounded-lg bg-blue-600/10 flex items-center justify-center">
            <CalendarDays className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <p className="text-2xl font-bold">{totalItems}</p>
            <p className="text-xs text-gray-500">{t('appointments.total')}</p>
          </div>
        </div>
      )}

      <div className="card mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="label">{t('customers.search')}</label>
            <div className="relative">
              <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                className="input pl-9"
                placeholder={t('appointments.searchPlaceholder')}
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
              />
            </div>
          </div>
          <div>
            <label className="label">{t('appointments.filterByStatus')}</label>
            <select
              className="input"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as BookingStatus | '')}
            >
              <option value="">{t('appointments.allStatuses')}</option>
              {BOOKING_STATUS_FILTER_OPTIONS.map((status) => (
                <option key={status} value={status}>
                  {BOOKING_STATUS_LABELS[status]}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="card overflow-hidden p-0">
        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-6 h-6 text-blue-400 animate-spin" />
          </div>
        ) : isError ? (
          <p className="text-red-400 text-sm text-center py-12">{t('appointments.loadFailed')}</p>
        ) : appointments.length === 0 ? (
          <p className="text-gray-500 text-sm text-center py-12">{t('appointments.noResults')}</p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-800 text-left">
                    <SortableColumnHeader
                      label={t('appointments.dateTime')}
                      active={sortBy === 'startTime'}
                      order={sortOrder}
                      onClick={() => toggleSort('startTime')}
                    />
                    <th className="px-4 py-3 font-medium text-gray-400">{t('appointments.customer')}</th>
                    <th className="px-4 py-3 font-medium text-gray-400">{t('appointments.service')}</th>
                    <th className="px-4 py-3 font-medium text-gray-400">{t('appointments.specialist')}</th>
                    <SortableColumnHeader
                      label={t('appointments.status')}
                      active={sortBy === 'status'}
                      order={sortOrder}
                      onClick={() => toggleSort('status')}
                    />
                    <SortableColumnHeader
                      label={t('customers.created')}
                      active={sortBy === 'createdAt'}
                      order={sortOrder}
                      onClick={() => toggleSort('createdAt')}
                    />
                    <SortableColumnHeader
                      label={t('customers.updated')}
                      active={sortBy === 'updatedAt'}
                      order={sortOrder}
                      onClick={() => toggleSort('updatedAt')}
                    />
                  </tr>
                </thead>
                <tbody>
                  {appointments.map((appointment) => (
                    <tr
                      key={appointment.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => setSelectedBookingId(appointment.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          setSelectedBookingId(appointment.id);
                        }
                      }}
                      className="border-b border-gray-800/80 hover:bg-gray-800/30 cursor-pointer"
                    >
                      <td className="px-4 py-3 text-gray-200">
                        <p className="font-medium">{formatDateDisplay(new Date(appointment.startTime))}</p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {formatTimeRangeDisplay(
                            new Date(appointment.startTime),
                            new Date(appointment.endTime),
                          )}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-gray-300">
                        {appointment.customer?.name ?? '—'}
                      </td>
                      <td className="px-4 py-3 text-gray-400">
                        {appointment.service?.name ?? '—'}
                      </td>
                      <td className="px-4 py-3 text-gray-400">
                        {appointment.employee?.name ?? '—'}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${
                            STATUS_BADGE[appointment.status] ?? 'bg-gray-700 text-gray-300'
                          }`}
                        >
                          {BOOKING_STATUS_LABELS[appointment.status]}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-400">
                        {formatDateDisplay(new Date(appointment.createdAt))}
                      </td>
                      <td className="px-4 py-3 text-gray-400">
                        {formatDateDisplay(new Date(appointment.updatedAt))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <TablePagination
              page={page}
              pageSize={pageSize}
              totalItems={totalItems}
              onPageChange={(nextPage) => setParams((p) => ({ ...p, page: nextPage }))}
            />
          </>
        )}
      </div>

      {business?.id && (
        <BookingDetailPanel
          businessId={business.id}
          bookingId={selectedBookingId}
          onClose={() => setSelectedBookingId(null)}
        />
      )}
    </div>
  );
}
