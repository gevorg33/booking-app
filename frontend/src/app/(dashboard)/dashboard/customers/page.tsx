'use client';

import { useEffect, useMemo, useState } from 'react';
import { Loader2, Mail, Phone, Search, UserCircle, Users } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/lib/store';
import api from '@/lib/api';
import { useI18n } from '@/i18n';
import { formatDateDisplay } from '@/lib/date-format';
import {
  buildCustomerSearchQuery,
  CUSTOMER_TAGS,
  customerTagLabelKey,
  type CustomerSearchParams,
  type CustomerSegment,
  type CustomerTag,
  type CustomersSearchResult,
} from '@/lib/customer-types';
import { BOOKING_STATUS_LABELS, type BookingStatus } from '@/lib/booking-types';
import { useDebouncedValue } from '@/lib/use-debounced-value';
import { CustomerDetailPanel } from '@/components/customers/customer-detail-panel';
import { SortableColumnHeader } from '@/components/table/sortable-column-header';
import { DEFAULT_PAGE_SIZE, TablePagination } from '@/components/table/table-pagination';

const defaultParams: CustomerSearchParams = {
  sortBy: 'createdAt',
  sortOrder: 'DESC',
  page: 1,
  pageSize: DEFAULT_PAGE_SIZE,
};

export default function CustomersPage() {
  const { t } = useI18n();
  const { business } = useAuthStore();
  const [params, setParams] = useState<CustomerSearchParams>(defaultParams);
  const [searchInput, setSearchInput] = useState('');
  const debouncedSearch = useDebouncedValue(searchInput, 300);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);

  useEffect(() => {
    setParams((p) => ({ ...p, page: 1 }));
  }, [debouncedSearch]);

  const queryString = useMemo(
    () =>
      buildCustomerSearchQuery({
        ...params,
        search: debouncedSearch.trim() || undefined,
      }),
    [params, debouncedSearch],
  );

  const { data, isLoading, isError } = useQuery({
    queryKey: ['customers-dashboard', business?.id, queryString],
    queryFn: async () => {
      const { data: res } = await api.get(
        `/businesses/${business!.id}/customers/dashboard${queryString}`,
      );
      return (res.data || res) as CustomersSearchResult;
    },
    enabled: !!business?.id,
  });

  const sortBy = params.sortBy ?? 'createdAt';
  const sortOrder = params.sortOrder ?? 'DESC';
  const totalCustomers = data?.stats?.totalCustomers;
  const customers = data?.customers ?? [];
  const totalItems = data?.totalItems ?? 0;
  const page = data?.page ?? params.page ?? 1;
  const pageSize = data?.pageSize ?? params.pageSize ?? DEFAULT_PAGE_SIZE;

  const toggleSort = (column: CustomerSearchParams['sortBy']) => {
    setParams((p) => {
      const current = p.sortBy ?? 'createdAt';
      const currentOrder = p.sortOrder ?? 'DESC';
      if (current === column) {
        return { ...p, sortOrder: currentOrder === 'ASC' ? 'DESC' : 'ASC', page: 1 };
      }
      return {
        ...p,
        sortBy: column,
        sortOrder: column === 'name' ? 'ASC' : 'DESC',
        page: 1,
      };
    });
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <UserCircle className="w-6 h-6 text-blue-400" />
          {t('customers.title')}
        </h1>
        <p className="text-gray-400 text-sm mt-1">{t('customers.subtitle')}</p>
      </div>

      {totalCustomers != null && (
        <div className="card flex items-center gap-3 mb-6 w-fit">
          <div className="w-10 h-10 rounded-lg bg-blue-600/10 flex items-center justify-center">
            <Users className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <p className="text-2xl font-bold">{totalCustomers}</p>
            <p className="text-xs text-gray-500">{t('customers.statsTotal')}</p>
          </div>
        </div>
      )}

      <div className="card mb-6 space-y-4">
        <div>
          <label className="label">{t('customers.search')}</label>
          <div className="relative max-w-md">
            <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              className="input pl-9"
              placeholder={t('customers.searchPlaceholder')}
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>
        </div>
        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="label">{t('customers.customerTag')}</label>
            <select
              className="input max-w-[180px]"
              value={params.tags ?? ''}
              onChange={(e) =>
                setParams((p) => ({
                  ...p,
                  tags: (e.target.value || undefined) as CustomerTag | undefined,
                  page: 1,
                }))
              }
            >
              <option value="">{t('customers.allTags')}</option>
              {CUSTOMER_TAGS.map((tag) => (
                <option key={tag} value={tag}>
                  {t(customerTagLabelKey(tag))}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">{t('customers.segment')}</label>
            <select
              className="input max-w-[180px]"
              value={params.segment ?? ''}
              onChange={(e) =>
                setParams((p) => ({
                  ...p,
                  segment: (e.target.value || undefined) as CustomerSegment | undefined,
                  page: 1,
                }))
              }
            >
              <option value="">{t('customers.allSegments')}</option>
              <option value="vip">{t('customers.segmentVip')}</option>
              <option value="at_risk">{t('customers.segmentAtRisk')}</option>
              <option value="high_no_show">{t('customers.segmentHighNoShow')}</option>
              <option value="new">{t('customers.segmentNew')}</option>
            </select>
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-400 pb-2 cursor-pointer">
            <input
              type="checkbox"
              checked={params.isVip === true}
              onChange={(e) =>
                setParams((p) => ({
                  ...p,
                  isVip: e.target.checked ? true : undefined,
                  page: 1,
                }))
              }
              className="rounded border-gray-600"
            />
            {t('customers.vipOnly')}
          </label>
        </div>
      </div>

      <div className="card overflow-hidden p-0">
        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-6 h-6 text-blue-400 animate-spin" />
          </div>
        ) : isError ? (
          <p className="text-red-400 text-sm text-center py-12">{t('customers.loadFailed')}</p>
        ) : customers.length === 0 ? (
          <p className="text-gray-500 text-sm text-center py-12">{t('customers.noResults')}</p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-800 text-left">
                    <SortableColumnHeader
                      label={t('common.name')}
                      active={sortBy === 'name'}
                      order={sortOrder}
                      onClick={() => toggleSort('name')}
                    />
                    <th className="px-4 py-3 font-medium text-gray-400">{t('customers.tags')}</th>
                    <th className="px-4 py-3 font-medium text-gray-400">{t('common.email')}</th>
                    <th className="px-4 py-3 font-medium text-gray-400">{t('common.phone')}</th>
                    <th className="px-4 py-3 font-medium text-gray-400">{t('customers.appointments')}</th>
                    <th className="px-4 py-3 font-medium text-gray-400">No-shows</th>
                    <th className="px-4 py-3 font-medium text-gray-400">{t('customers.upcoming')}</th>
                    <th className="px-4 py-3 font-medium text-gray-400">{t('customers.lastVisit')}</th>
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
                  {customers.map((customer) => (
                    <tr
                      key={customer.id}
                      className="border-b border-gray-800/80 hover:bg-gray-800/30 cursor-pointer"
                      onClick={() => setSelectedCustomerId(customer.id)}
                    >
                      <td className="px-4 py-3 font-medium text-gray-100">
                        <div className="flex items-center gap-2 flex-wrap">
                          {customer.name}
                          {(customer.isVip || customer.segment === 'vip') && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-600/10 text-amber-400 uppercase tracking-wide">
                              {t('customers.vip')}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {customer.segment && customer.segment !== 'vip' && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-700 text-gray-300 capitalize">
                              {customer.segment.replace(/_/g, ' ')}
                            </span>
                          )}
                          {(customer.tags ?? []).map((tag) => {
                            const isKnownTag = (CUSTOMER_TAGS as readonly string[]).includes(tag);
                            return (
                              <span
                                key={tag}
                                className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-600/10 text-blue-400"
                              >
                                {isKnownTag
                                  ? t(customerTagLabelKey(tag as CustomerTag))
                                  : tag}
                              </span>
                            );
                          })}
                          {!customer.segment && !(customer.tags?.length) && !customer.isVip && '—'}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-400">
                        {customer.email ? (
                          <span className="inline-flex items-center gap-1.5">
                            <Mail className="w-3.5 h-3.5 shrink-0" />
                            {customer.email}
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-400">
                        {customer.phone ? (
                          <span className="inline-flex items-center gap-1.5">
                            <Phone className="w-3.5 h-3.5 shrink-0" />
                            {customer.phone}
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-medium">{customer.stats.total}</span>
                        {Object.keys(customer.stats.byStatus).length > 0 && (
                          <p className="text-xs text-gray-500 mt-0.5">
                            {Object.entries(customer.stats.byStatus)
                              .map(
                                ([status, count]) =>
                                  `${BOOKING_STATUS_LABELS[status as BookingStatus] ?? status}: ${count}`,
                              )
                              .join(' · ')}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-orange-400">{customer.stats.noShowCount ?? 0}</td>
                      <td className="px-4 py-3 text-gray-300">{customer.stats.upcomingCount}</td>
                      <td className="px-4 py-3 text-gray-400">
                        {customer.stats.lastBookingAt
                          ? formatDateDisplay(new Date(customer.stats.lastBookingAt))
                          : '—'}
                      </td>
                      <td className="px-4 py-3 text-gray-400">
                        {formatDateDisplay(new Date(customer.createdAt))}
                      </td>
                      <td className="px-4 py-3 text-gray-400">
                        {formatDateDisplay(new Date(customer.updatedAt))}
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

      <CustomerDetailPanel
        businessId={business?.id ?? ''}
        customerId={selectedCustomerId}
        onClose={() => setSelectedCustomerId(null)}
      />
    </div>
  );
}
