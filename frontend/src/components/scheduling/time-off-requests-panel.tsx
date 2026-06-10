'use client';

import { Loader2 } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { useI18n } from '@/i18n';
import { formatDateDisplay } from '@/lib/date-format';
import { unwrapBusinessApiPayload } from '@/lib/business-query';
import type { ProviderTimeOffRequestRow } from '@/lib/provider-time-off.util';

export function TimeOffRequestsPanel({ businessId }: { businessId: string }) {
  const { t } = useI18n();
  const queryClient = useQueryClient();

  const { data: businessData } = useQuery({
    queryKey: ['business', businessId],
    queryFn: async () => {
      const { data } = await api.get(`/businesses/${businessId}`);
      return unwrapBusinessApiPayload<{ settings?: Record<string, unknown> }>(data);
    },
  });

  const enabled =
    (businessData?.settings?.providerTimeOff as { enabled?: boolean } | undefined)
      ?.enabled === true;

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ['time-off-requests', businessId],
    queryFn: async () => {
      const { data } = await api.get(
        `/businesses/${businessId}/time-off-requests?status=pending`,
      );
      const payload = data?.data ?? data;
      return (payload?.requests ?? []) as ProviderTimeOffRequestRow[];
    },
    enabled: enabled && !!businessId,
  });

  const reviewMutation = useMutation({
    mutationFn: async ({
      requestId,
      resolution,
    }: {
      requestId: string;
      resolution: 'approve' | 'deny';
    }) => {
      const { data } = await api.post(
        `/businesses/${businessId}/time-off-requests/${requestId}/${resolution}`,
        {},
      );
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['time-off-requests', businessId] });
    },
  });

  if (!enabled) return null;

  return (
    <section className="rounded-lg border border-gray-200 dark:border-gray-800 p-4 mt-6 space-y-3">
      <div>
        <h3 className="font-medium text-gray-900 dark:text-gray-100">
          {t('schedule.timeOffRequestsTitle')}
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {t('schedule.timeOffRequestsDescription')}
        </p>
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 text-sm text-gray-500 py-4">
          <Loader2 className="w-4 h-4 animate-spin" />
          {t('common.loading')}
        </div>
      ) : requests.length === 0 ? (
        <p className="text-sm text-gray-500 py-4">{t('schedule.timeOffNoPending')}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b border-gray-200 dark:border-gray-800">
                <th className="py-2 pr-4">{t('common.provider')}</th>
                <th className="py-2 pr-4">{t('common.date')}</th>
                <th className="py-2 pr-4">{t('schedule.timeOffReason')}</th>
                <th className="py-2 pr-4">{t('common.status')}</th>
                <th className="py-2">{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((request) => (
                <tr key={request.id} className="border-b border-gray-100 dark:border-gray-900">
                  <td className="py-3 pr-4">{request.employeeName ?? '—'}</td>
                  <td className="py-3 pr-4">
                    {request.startDate === request.endDate
                      ? formatDateDisplay(request.startDate)
                      : `${formatDateDisplay(request.startDate)} – ${formatDateDisplay(request.endDate)}`}
                    <span className="block text-xs text-gray-500">
                      {request.dailyStartTime}–{request.dailyEndTime}
                    </span>
                  </td>
                  <td className="py-3 pr-4">{request.reason ?? '—'}</td>
                  <td className="py-3 pr-4 capitalize">{request.status}</td>
                  <td className="py-3">
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        className="btn-primary text-xs"
                        disabled={reviewMutation.isPending}
                        onClick={() =>
                          reviewMutation.mutate({
                            requestId: request.id,
                            resolution: 'approve',
                          })
                        }
                      >
                        {t('schedule.timeOffApprove')}
                      </button>
                      <button
                        type="button"
                        className="btn-secondary text-xs"
                        disabled={reviewMutation.isPending}
                        onClick={() =>
                          reviewMutation.mutate({
                            requestId: request.id,
                            resolution: 'deny',
                          })
                        }
                      >
                        {t('schedule.timeOffDeny')}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
