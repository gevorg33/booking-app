'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { type ClinicTestOrderRecord } from '@/lib/clinic-lab-queue';
import { useI18n } from '@/i18n';
import {
  buildCatalogOrderItemsPayload,
  canSubmitCatalogOrder,
  type CatalogOrderPickerSelection,
} from '@/lib/patient-chart-catalog-order';
import { ClinicLabStatusBadge } from './clinic-lab-status-badge';
import { BookingLabOrderPushPanel } from './booking-lab-order-push-panel';
import { ClinicCatalogOrderPicker } from './clinic-catalog-order-picker';

export interface BookingLabOrdersSectionProps {
  businessId: string;
  bookingId: string;
}

function unwrapList<T>(data: unknown): T[] {
  const payload = (data as { data?: unknown })?.data ?? data;
  if (Array.isArray(payload)) return payload as T[];
  const nested = (payload as { data?: unknown })?.data;
  return Array.isArray(nested) ? (nested as T[]) : [];
}

export function BookingLabOrdersSection({
  businessId,
  bookingId,
}: BookingLabOrdersSectionProps) {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const [selections, setSelections] = useState<CatalogOrderPickerSelection[]>([]);

  const { data: orders = [], isLoading, refetch } = useQuery({
    queryKey: ['clinic-booking-lab-orders', businessId, bookingId],
    queryFn: async () => {
      const { data } = await api.get(
        `/businesses/${businessId}/clinic-test-results/bookings/${bookingId}/orders`,
      );
      return unwrapList<ClinicTestOrderRecord>(data);
    },
    enabled: !!businessId && !!bookingId,
  });

  const invalidateOrders = async () => {
    await queryClient.invalidateQueries({
      queryKey: ['clinic-booking-lab-orders', businessId, bookingId],
    });
    await queryClient.invalidateQueries({
      queryKey: ['clinic-booking-lab-summaries', businessId, bookingId],
    });
    await refetch();
  };

  const createCatalogOrderMutation = useMutation({
    mutationFn: async () => {
      await api.post(
        `/businesses/${businessId}/clinic-test-results/bookings/${bookingId}/orders`,
        { items: buildCatalogOrderItemsPayload(selections) },
      );
    },
    onSuccess: async () => {
      setSelections([]);
      await invalidateOrders();
    },
  });

  const createServiceOrderMutation = useMutation({
    mutationFn: async () => {
      await api.post(
        `/businesses/${businessId}/clinic-test-results/bookings/${bookingId}/orders`,
      );
    },
    onSuccess: invalidateOrders,
  });

  const canPlaceCatalogOrder = canSubmitCatalogOrder(bookingId, selections);

  return (
    <section className="mb-5 rounded-lg border border-gray-700/80 bg-gray-800/40 p-3">
      <h4 className="text-sm font-medium text-gray-200">
        {t('clinic.labState.ordersTab.title')}
      </h4>

      <div className="mt-3 space-y-3 rounded-md border border-gray-700/60 bg-gray-900/30 p-3">
        <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
          {t('clinic.labState.ordersTab.catalogPickerTitle')}
        </p>
        <ClinicCatalogOrderPicker
          businessId={businessId}
          selections={selections}
          onSelectionsChange={setSelections}
        />
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            className="btn-primary text-xs py-1 px-2"
            disabled={!canPlaceCatalogOrder || createCatalogOrderMutation.isPending}
            onClick={() => createCatalogOrderMutation.mutate()}
          >
            {createCatalogOrderMutation.isPending
              ? t('common.saving')
              : t('clinic.labState.ordersTab.placeCatalogOrder')}
          </button>
          {selections.length === 0 ? (
            <p className="text-xs text-gray-500">
              {t('clinic.labState.ordersTab.selectCatalogItems')}
            </p>
          ) : (
            <p className="text-xs text-gray-500">
              {t('clinic.labState.ordersTab.selectedCount', {
                count: selections.length,
              })}
            </p>
          )}
          <button
            type="button"
            className="btn-secondary text-xs py-1 px-2"
            disabled={createServiceOrderMutation.isPending}
            onClick={() => createServiceOrderMutation.mutate()}
          >
            {createServiceOrderMutation.isPending
              ? t('common.saving')
              : t('clinic.labState.ordersTab.createFromService')}
          </button>
        </div>
      </div>

      {isLoading ? (
        <p className="mt-2 text-sm text-gray-500">{t('common.loading')}</p>
      ) : orders.length === 0 ? (
        <p className="mt-2 text-sm text-gray-500">
          {t('clinic.labState.ordersTab.empty')}
        </p>
      ) : (
        <ul className="mt-3 space-y-3">
          {orders.map((order) => (
            <li
              key={order.id}
              className="rounded-md border border-gray-700/60 bg-gray-900/40 p-3"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-medium text-gray-100">
                  {order.displayNames ?? t('clinic.labState.ordersTab.unnamedOrder')}
                </p>
                <ClinicLabStatusBadge kind="order" status={order.status} />
              </div>
              <BookingLabOrderPushPanel businessId={businessId} orderId={order.id} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
