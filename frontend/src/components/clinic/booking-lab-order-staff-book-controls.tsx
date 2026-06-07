'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import api from '@/lib/api';
import { useI18n } from '@/i18n';
import { DatePicker } from '@/components/ui/date-picker';
import { formatTimeDisplay, getTodayDateKey } from '@/lib/date-format';
import {
  unwrapClinicLabBookingAction,
  unwrapClinicLabCollectionAvailability,
  type ClinicLabCollectionAvailabilitySlot,
  type ClinicLabOrderBookingAction,
} from '@/lib/clinic-lab-booking-request';

export interface ClinicLabOrderStaffBookControlsProps {
  businessId: string;
  orderId: string;
  actions: ClinicLabOrderBookingAction;
}

export function ClinicLabOrderStaffBookControls({
  businessId,
  orderId,
  actions,
}: ClinicLabOrderStaffBookControlsProps) {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const supportedServices = actions.supportedCollectionServices ?? [];
  const [collectionServiceId, setCollectionServiceId] = useState(
    actions.collectionServiceId || supportedServices[0]?.id || '',
  );
  const [selectedDate, setSelectedDate] = useState(getTodayDateKey());
  const [selectedSlot, setSelectedSlot] = useState<ClinicLabCollectionAvailabilitySlot | null>(
    null,
  );

  const { data: slots = [], isLoading: slotsLoading } = useQuery({
    queryKey: [
      'clinic-lab-collection-availability',
      businessId,
      collectionServiceId,
      selectedDate,
    ],
    queryFn: async () => {
      const { data } = await api.get(
        `/businesses/${businessId}/bookings/availability`,
        {
          params: {
            serviceId: collectionServiceId,
            date: selectedDate,
          },
        },
      );
      return unwrapClinicLabCollectionAvailability(data);
    },
    enabled: !!businessId && !!collectionServiceId && !!selectedDate,
  });

  const bookMutation = useMutation({
    mutationFn: async (slot: ClinicLabCollectionAvailabilitySlot) => {
      const { data } = await api.post(
        `/businesses/${businessId}/clinic-test-results/orders/${orderId}/book-collection`,
        {
          collectionServiceId,
          employeeId: slot.employeeId,
          startTime: slot.startTime,
        },
      );
      return unwrapClinicLabBookingAction(data);
    },
    onSuccess: async () => {
      setSelectedSlot(null);
      await queryClient.invalidateQueries({
        queryKey: ['clinic-order-booking-actions', businessId, orderId],
      });
      await queryClient.invalidateQueries({
        queryKey: ['clinic-booking-lab-orders', businessId],
      });
      await queryClient.invalidateQueries({
        queryKey: ['patient-chart-orders', businessId],
      });
    },
  });

  if (!actions.canStaffBook || supportedServices.length === 0) {
    return null;
  }

  return (
    <div className="rounded-md border border-gray-700/60 bg-gray-900/20 p-3">
      <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-400">
        {t('clinic.labBookingRequest.staffBookTitle')}
      </p>
      <div className="flex flex-wrap items-end gap-3">
        {supportedServices.length > 1 ? (
          <label className="flex flex-col gap-1 text-xs text-gray-400">
            <span>{t('clinic.labBookingRequest.collectionService')}</span>
            <select
              className="rounded border border-gray-600 bg-gray-900 px-2 py-1 text-sm text-gray-100"
              value={collectionServiceId}
              onChange={(event) => {
                setCollectionServiceId(event.target.value);
                setSelectedSlot(null);
              }}
            >
              {supportedServices.map((service) => (
                <option key={service.id} value={service.id}>
                  {service.name}
                </option>
              ))}
            </select>
          </label>
        ) : null}
        <label className="flex flex-col gap-1 text-xs text-gray-400">
          <span>{t('clinic.labBookingRequest.staffBookDateLabel')}</span>
          <DatePicker
            value={selectedDate}
            onChange={(nextDate) => {
              setSelectedDate(nextDate);
              setSelectedSlot(null);
            }}
            min={getTodayDateKey()}
            className="min-w-[10rem]"
          />
        </label>
      </div>

      <div className="mt-3">
        <p className="mb-2 text-xs text-gray-500">
          {t('clinic.labBookingRequest.staffBookSlotsLabel')}
        </p>
        {slotsLoading ? (
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            {t('common.loading')}
          </div>
        ) : slots.length === 0 ? (
          <p className="text-sm text-gray-500">
            {t('clinic.labBookingRequest.staffBookNoSlots')}
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {slots.map((slot) => {
              const selected = selectedSlot?.startTime === slot.startTime &&
                selectedSlot.employeeId === slot.employeeId;
              return (
                <button
                  key={`${slot.startTime}-${slot.employeeId}`}
                  type="button"
                  className={`rounded border px-2 py-1 text-xs ${
                    selected
                      ? 'border-blue-400 bg-blue-500/20 text-blue-100'
                      : 'border-gray-600 text-gray-200 hover:border-gray-500'
                  }`}
                  onClick={() => setSelectedSlot(slot)}
                >
                  {formatTimeDisplay(new Date(slot.startTime))}
                  {slot.employeeName ? ` · ${slot.employeeName}` : ''}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <button
        type="button"
        className="btn-primary mt-3 text-xs py-1 px-2"
        disabled={!selectedSlot || bookMutation.isPending || !collectionServiceId}
        onClick={() => {
          if (!selectedSlot) return;
          bookMutation.mutate(selectedSlot);
        }}
      >
        {bookMutation.isPending
          ? t('common.saving')
          : t('clinic.labBookingRequest.staffBookCollection')}
      </button>
    </div>
  );
}
