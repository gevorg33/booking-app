'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { useI18n } from '@/i18n';
import {
  unwrapClinicLabBookingAction,
  type ClinicLabOrderBookingAction,
} from '@/lib/clinic-lab-booking-request';
import { useState } from 'react';
import { ClinicLabOrderStaffBookControls } from './booking-lab-order-staff-book-controls';

export interface BookingLabOrderPushPanelProps {
  businessId: string;
  orderId: string;
}

export function BookingLabOrderPushPanel({
  businessId,
  orderId,
}: BookingLabOrderPushPanelProps) {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const [collectionServiceId, setCollectionServiceId] = useState('');

  const { data: actions, isLoading } = useQuery({
    queryKey: ['clinic-order-booking-actions', businessId, orderId],
    queryFn: async () => {
      const { data } = await api.get(
        `/businesses/${businessId}/clinic-test-results/orders/${orderId}/booking-actions`,
      );
      return unwrapClinicLabBookingAction(data);
    },
    enabled: !!businessId && !!orderId,
  });

  const pushMutation = useMutation({
    mutationFn: async (serviceId: string) => {
      const { data } = await api.post(
        `/businesses/${businessId}/clinic-test-results/orders/${orderId}/push-to-patient`,
        { collectionServiceId: serviceId },
      );
      return unwrapClinicLabBookingAction(data);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ['clinic-order-booking-actions', businessId, orderId],
      });
    },
  });

  if (isLoading || !actions) {
    return null;
  }

  if (actions.collectionBookingId) {
    return (
      <p className="mt-2 text-xs text-emerald-400">
        {t('clinic.labBookingRequest.collectionBooked')}
      </p>
    );
  }

  const supportedServices = actions.supportedCollectionServices ?? [];

  return (
    <div className="mt-3 space-y-3">
      {actions.bookingRequestPushedAt ? (
        <p className="text-xs text-amber-300">
          {t('clinic.labBookingRequest.pushed')}{' '}
          {new Date(actions.bookingRequestPushedAt).toLocaleString()}
        </p>
      ) : null}

      {actions.canStaffBook ? (
        <ClinicLabOrderStaffBookControls
          businessId={businessId}
          orderId={orderId}
          actions={actions}
        />
      ) : null}

      {actions.canPush && !actions.bookingRequestPushedAt ? (
        <ClinicLabOrderPushControls
          actions={{ ...actions, supportedCollectionServices: supportedServices }}
          collectionServiceId={
            collectionServiceId ||
            actions.collectionServiceId ||
            supportedServices[0]?.id ||
            ''
          }
          onCollectionServiceIdChange={setCollectionServiceId}
          onPush={() => {
            const serviceId =
              collectionServiceId ||
              actions.collectionServiceId ||
              supportedServices[0]?.id;
            if (!serviceId) return;
            pushMutation.mutate(serviceId);
          }}
          pushing={pushMutation.isPending}
          pushLabel={t('clinic.labBookingRequest.pushToPatient')}
          selectLabel={t('clinic.labBookingRequest.collectionService')}
          t={t}
        />
      ) : null}
    </div>
  );
}

export function ClinicLabOrderPushControls({
  actions,
  collectionServiceId,
  onCollectionServiceIdChange,
  onPush,
  pushing,
  pushLabel,
  selectLabel,
  t,
}: {
  actions: ClinicLabOrderBookingAction;
  collectionServiceId: string;
  onCollectionServiceIdChange: (value: string) => void;
  onPush: () => void;
  pushing: boolean;
  pushLabel: string;
  selectLabel: string;
  t: (key: string) => string;
}) {
  if (!actions.canPush || actions.supportedCollectionServices.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-end gap-2">
      {actions.supportedCollectionServices.length > 1 ? (
        <label className="flex flex-col gap-1 text-xs text-gray-400">
          <span>{selectLabel}</span>
          <select
            className="rounded border border-gray-600 bg-gray-900 px-2 py-1 text-sm text-gray-100"
            value={collectionServiceId}
            onChange={(event) => onCollectionServiceIdChange(event.target.value)}
          >
            {actions.supportedCollectionServices.map((service) => (
              <option key={service.id} value={service.id}>
                {service.name}
              </option>
            ))}
          </select>
        </label>
      ) : null}
      <button
        type="button"
        className="btn-secondary text-xs py-1 px-2"
        disabled={pushing || !collectionServiceId}
        onClick={onPush}
      >
        {pushing ? t('common.saving') : pushLabel}
      </button>
    </div>
  );
}
