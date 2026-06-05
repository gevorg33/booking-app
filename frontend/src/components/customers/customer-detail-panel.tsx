'use client';

import { useEffect, useState } from 'react';
import { Loader2, Save, X } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { formatDateDisplay, formatTimeRangeDisplay } from '@/lib/date-format';
import { type BookingStatus } from '@/lib/booking-types';
import { BOOKING_STATUS_I18N_KEYS } from '@/lib/booking-detail-panel.util';
import {
  CUSTOMER_TAGS,
  customerTagLabelKey,
  isAutoVipFromSegment,
  resolveCustomerTagForEdit,
  type CustomerTag,
} from '@/lib/customer-types';
import { useI18n } from '@/i18n';

function unwrap<T>(res: unknown): T {
  return ((res as { data?: T })?.data ?? res) as T;
}

function CustomerSubscriptionsSection({
  businessId,
  customerId,
}: {
  businessId: string;
  customerId: string;
}) {
  const { t, locale } = useI18n();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { data: subscriptions = [], isLoading } = useQuery({
    queryKey: ['customer-subscriptions', businessId, customerId],
    queryFn: async () => {
      const { data } = await api.get(
        `/businesses/${businessId}/subscriptions/customer/${customerId}`,
      );
      return unwrap<
        Array<{
          id: string;
          status: string;
          appointmentsRemaining: number;
          appointmentsIncluded: number;
          expiresAt: string;
          plan: { name: string; service?: { name: string } };
        }>
      >(data);
    },
  });

  const { data: usageData, isLoading: usageLoading } = useQuery({
    queryKey: ['customer-subscription-usage', businessId, expandedId],
    queryFn: async () => {
      const { data } = await api.get(
        `/businesses/${businessId}/subscriptions/${expandedId}/usage`,
      );
      return unwrap<{ usage: Array<{ id: string; action: string; createdAt: string; appointmentsRemainingAfter: number }> }>(data);
    },
    enabled: !!expandedId,
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-4">
        <Loader2 className="w-5 h-5 animate-spin text-blue-400" />
      </div>
    );
  }

  if (subscriptions.length === 0) {
    return <p className="text-sm text-gray-500">{t('customers.noSubscriptions')}</p>;
  }

  return (
    <ul className="space-y-3">
      {subscriptions.map((sub) => (
        <li
          key={sub.id}
          className="rounded-lg border border-gray-200 dark:border-gray-800 p-3 text-sm"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="font-medium">{sub.plan?.name ?? t('customers.subscriptionFallback')}</span>
            <span className="text-xs px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-800 capitalize">
              {sub.status}
            </span>
          </div>
          {sub.plan?.service?.name && (
            <p className="text-gray-500 mt-1">{sub.plan.service.name}</p>
          )}
          <p className="text-gray-500 mt-1">
            {t('customers.subscriptionAppointmentsLeft', {
              remaining: sub.appointmentsRemaining,
              included: sub.appointmentsIncluded,
              date: formatDateDisplay(new Date(sub.expiresAt), locale),
            })}
          </p>
          <button
            type="button"
            className="text-xs text-blue-400 mt-2"
            onClick={() => setExpandedId(expandedId === sub.id ? null : sub.id)}
          >
            {expandedId === sub.id ? t('customers.hideUsage') : t('customers.viewUsageHistory')}
          </button>
          {expandedId === sub.id && (
            <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-800">
              {usageLoading ? (
                <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
              ) : usageData?.usage?.length ? (
                <ul className="space-y-1 text-xs text-gray-500">
                  {usageData.usage.map((row) => (
                    <li key={row.id} className="flex justify-between gap-2">
                      <span className="capitalize">{row.action}</span>
                      <span>
                        {t('customers.usageRow', {
                          date: formatDateDisplay(new Date(row.createdAt), locale),
                          count: row.appointmentsRemainingAfter,
                        })}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-gray-500">{t('customers.noUsageYet')}</p>
              )}
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}

export interface CustomerDetail {
  customer: {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    tags: string[];
    isVip: boolean;
    segment: string;
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
    amountPaid: number | null;
    taxAmount: number | null;
  }>;
}

interface CustomerDetailPanelProps {
  businessId: string;
  customerId: string | null;
  onClose: () => void;
}

export function CustomerDetailPanel({ businessId, customerId, onClose }: CustomerDetailPanelProps) {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const [selectedTag, setSelectedTag] = useState<CustomerTag | ''>('');

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

  useEffect(() => {
    if (data) {
      queueMicrotask(() => setSelectedTag(resolveCustomerTagForEdit(data.customer)));
    }
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const tags = selectedTag ? [selectedTag] : [];
      const { data: res } = await api.put(`/businesses/${businessId}/customers/${customerId}`, {
        tags,
      });
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-detail', businessId, customerId] });
      queryClient.invalidateQueries({ queryKey: ['customers-dashboard', businessId] });
    },
  });

  if (!customerId) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button
        type="button"
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
        aria-label={t('common.close')}
      />
      <aside className="relative w-full max-w-lg bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-800 h-full overflow-y-auto shadow-xl">
        <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-5 py-4 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900 dark:text-gray-100">{t('customers.detailTitle')}</h2>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
          </div>
        ) : isError || !data ? (
          <p className="text-red-400 text-sm p-5">{t('customers.detailLoadFailed')}</p>
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
              {data.customer.segment && (
                <span className="inline-block mt-2 text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 capitalize">
                  {data.customer.segment.replace(/_/g, ' ')}
                </span>
              )}
            </div>

            <div className="rounded-lg border border-gray-200 dark:border-gray-800 p-4 space-y-3">
              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">{t('customers.editTags')}</h4>
              <div>
                <label className="label">{t('customers.customerTag')}</label>
                <select
                  className="input"
                  value={selectedTag}
                  onChange={(e) => setSelectedTag((e.target.value || '') as CustomerTag | '')}
                >
                  <option value="">{t('customers.tagNone')}</option>
                  {CUSTOMER_TAGS.map((tag) => (
                    <option key={tag} value={tag}>
                      {t(customerTagLabelKey(tag))}
                    </option>
                  ))}
                </select>
                {data && isAutoVipFromSegment(data.customer) && (
                  <p className="text-xs text-gray-500 mt-2">{t('customers.tagAutoVipHint')}</p>
                )}
              </div>
              <button
                type="button"
                onClick={() => saveMutation.mutate()}
                disabled={saveMutation.isPending}
                className="btn-primary text-sm inline-flex items-center gap-2"
              >
                {saveMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                {t('common.save')}
              </button>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-lg bg-gray-100 dark:bg-gray-800 p-3 text-center">
                <p className="text-lg font-bold">{data.stats.total}</p>
                <p className="text-xs text-gray-500">{t('customers.statVisits')}</p>
              </div>
              <div className="rounded-lg bg-gray-100 dark:bg-gray-800 p-3 text-center">
                <p className="text-lg font-bold">{data.stats.upcomingCount}</p>
                <p className="text-xs text-gray-500">{t('customers.upcoming')}</p>
              </div>
              <div className="rounded-lg bg-gray-100 dark:bg-gray-800 p-3 text-center">
                <p className="text-lg font-bold text-orange-500">{data.stats.noShowCount}</p>
                <p className="text-xs text-gray-500">{t('customers.columnNoShows')}</p>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                {t('customers.subscriptionsSection')}
              </h4>
              <CustomerSubscriptionsSection businessId={businessId} customerId={customerId} />
            </div>

            <div>
              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                {t('customers.appointmentHistorySection')}
              </h4>
              {data.appointments.length === 0 ? (
                <p className="text-sm text-gray-500">{t('customers.noAppointmentsYet')}</p>
              ) : (
                <ul className="space-y-3">
                  {data.appointments.map((appt) => (
                    <li
                      key={appt.id}
                      className="rounded-lg border border-gray-200 dark:border-gray-800 p-3 text-sm"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium text-gray-900 dark:text-gray-100">
                          {appt.service?.name ?? t('customers.appointmentFallback')}
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                          {BOOKING_STATUS_I18N_KEYS[appt.status as BookingStatus]
                            ? t(BOOKING_STATUS_I18N_KEYS[appt.status as BookingStatus])
                            : appt.status}
                        </span>
                      </div>
                      <p className="text-gray-500 mt-1">
                        {formatDateDisplay(new Date(appt.startTime))} ·{' '}
                        {formatTimeRangeDisplay(new Date(appt.startTime), new Date(appt.endTime))}
                      </p>
                      {appt.employee && (
                        <p className="text-gray-500 text-xs mt-0.5">
                          {t('customers.withProvider', { name: appt.employee.name })}
                        </p>
                      )}
                      {appt.amountPaid != null && (
                        <p className="text-gray-500 text-xs mt-0.5">
                          {t('customers.appointmentAmount', { amount: appt.amountPaid })}
                          {appt.taxAmount != null && appt.taxAmount > 0
                            ? ` · ${t('customers.appointmentTax', { amount: appt.taxAmount })}`
                            : ''}
                        </p>
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
