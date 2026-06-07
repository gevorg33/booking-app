'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Loader2, Printer } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { useI18n } from '@/i18n';
import {
  buildSpecimenQueueQueryParams,
  CLINIC_SPECIMEN_STATUSES_BY_VIEW,
  getSpecimenTransitionActions,
  type ClinicSpecimenOpsView,
  type ClinicSpecimenQueueItem,
} from '@/lib/clinic-lab-specimens';
import { CLINIC_PLAYBOOK_DEPARTMENTS } from '@/lib/clinic-lab-queue';
import { formatDateDisplay } from '@/lib/date-format';
import { ClinicLabStatusBadge } from './clinic-lab-status-badge';
import { ClinicSpecimenOpsNav } from './clinic-specimen-ops-nav';
import { ClinicSpecimenLabelPrintModal } from './clinic-specimen-label-print-modal';

function unwrapList<T>(data: unknown): T[] {
  const payload = (data as { data?: unknown })?.data ?? data;
  if (Array.isArray(payload)) return payload as T[];
  const nested = (payload as { data?: unknown })?.data;
  return Array.isArray(nested) ? (nested as T[]) : [];
}

interface ClinicSpecimenQueuePanelProps {
  view: ClinicSpecimenOpsView;
}

export function ClinicSpecimenQueuePanel({ view }: ClinicSpecimenQueuePanelProps) {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const { business } = useAuthStore();
  const businessId = business?.id ?? '';

  const [status, setStatus] = useState('');
  const [department, setDepartment] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [printSpecimenId, setPrintSpecimenId] = useState<string | null>(null);

  const filters = useMemo(
    () => buildSpecimenQueueQueryParams({ view, status, department, from, to }),
    [view, status, department, from, to],
  );

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ['clinic-specimen-queue', businessId, filters],
    queryFn: async () => {
      const { data } = await api.get(
        `/businesses/${businessId}/clinic-test-results/specimens`,
        { params: filters },
      );
      return unwrapList<ClinicSpecimenQueueItem>(data);
    },
    enabled: !!businessId,
  });

  const transitionMutation = useMutation({
    mutationFn: async (input: {
      specimenId: string;
      toStatus: string;
      v1ShortPath?: boolean;
    }) => {
      const { data } = await api.post(
        `/businesses/${businessId}/clinic-test-results/specimens/${input.specimenId}/transition`,
        {
          toStatus: input.toStatus,
          v1ShortPath: input.v1ShortPath ?? true,
        },
      );
      return data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['clinic-specimen-queue', businessId] });
    },
  });

  const statusOptions = CLINIC_SPECIMEN_STATUSES_BY_VIEW[view];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t(`clinic.labSpecimens.${view}.title`)}</h1>
          <p className="text-sm text-gray-500 mt-1">
            {t(`clinic.labSpecimens.${view}.subtitle`)}
          </p>
        </div>
        <ClinicSpecimenOpsNav />
      </div>

      <div className="card grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <label className="label">{t('clinic.labSpecimens.filters.status')}</label>
          <select className="input" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">{t('clinic.labSpecimens.filters.allStatuses')}</option>
            {statusOptions.map((value) => (
              <option key={value} value={value}>
                {t(`clinic.labState.specimen.${value}`)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">{t('clinic.labQueue.filters.department')}</label>
          <select
            className="input"
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
          >
            <option value="">{t('clinic.labQueue.filters.allDepartments')}</option>
            {CLINIC_PLAYBOOK_DEPARTMENTS.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">{t('clinic.labQueue.filters.from')}</label>
          <input
            className="input"
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
          />
        </div>
        <div>
          <label className="label">{t('clinic.labQueue.filters.to')}</label>
          <input
            className="input"
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
          />
        </div>
      </div>

      {isLoading ? (
        <div className="card text-center py-10 text-gray-500 inline-flex items-center gap-2 justify-center w-full">
          <Loader2 className="w-4 h-4 animate-spin" />
          {t('common.loading')}
        </div>
      ) : rows.length === 0 ? (
        <div className="card text-sm text-gray-500">
          {t(`clinic.labSpecimens.${view}.empty`)}
        </div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b border-gray-700/70">
                <th className="py-2 pr-4">{t('clinic.labSpecimens.columns.test')}</th>
                <th className="py-2 pr-4">{t('clinic.labSpecimens.columns.status')}</th>
                <th className="py-2 pr-4">{t('clinic.labSpecimens.columns.customer')}</th>
                <th className="py-2 pr-4">{t('clinic.labSpecimens.columns.appointment')}</th>
                <th className="py-2 pr-4">{t('clinic.labSpecimens.columns.tracking')}</th>
                <th className="py-2 pr-4">{t('clinic.labSpecimens.columns.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const actions = getSpecimenTransitionActions(view, row.status);
                return (
                  <tr key={row.id} className="border-b border-gray-800/80">
                    <td className="py-3 pr-4 font-medium text-gray-100">
                      {row.orderDisplayNames ?? t('clinic.labState.ordersTab.unnamedOrder')}
                    </td>
                    <td className="py-3 pr-4">
                      <ClinicLabStatusBadge kind="specimen" status={row.status} />
                    </td>
                    <td className="py-3 pr-4 text-gray-300">{row.customerName ?? '—'}</td>
                    <td className="py-3 pr-4 text-gray-300">
                      {row.bookingId ? (
                        <Link
                          href={`/dashboard/appointments?bookingId=${row.bookingId}`}
                          className="text-blue-400 hover:underline"
                        >
                          {row.bookingStartTime
                            ? formatDateDisplay(new Date(row.bookingStartTime))
                            : t('clinic.labQueue.openBooking')}
                        </Link>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="py-3 pr-4 text-gray-300">
                      <div className="space-y-1">
                        {row.collectedAt ? (
                          <div>
                            {t('clinic.labSpecimens.trackingDetails.collected')}:{' '}
                            {formatDateDisplay(new Date(row.collectedAt))}
                          </div>
                        ) : null}
                        {row.storageLocationName ? (
                          <div>
                            {t('clinic.labSpecimens.trackingDetails.storage')}: {row.storageLocationName}
                          </div>
                        ) : null}
                        {row.transportFolderCode ? (
                          <div>
                            {t('clinic.labSpecimens.trackingDetails.folder')}: {row.transportFolderCode}
                          </div>
                        ) : null}
                        {!row.collectedAt &&
                        !row.storageLocationName &&
                        !row.transportFolderCode
                          ? '—'
                          : null}
                      </div>
                    </td>
                    <td className="py-3 pr-4">
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          className="btn-secondary text-xs inline-flex items-center gap-1"
                          onClick={() => setPrintSpecimenId(row.id)}
                        >
                          <Printer className="w-3 h-3" />
                          {t('clinic.labSpecimens.label.printShort')}
                        </button>
                        {actions.map((action) => (
                          <button
                            key={`${row.id}-${action.toStatus}`}
                            type="button"
                            className="btn-secondary text-xs"
                            disabled={transitionMutation.isPending}
                            onClick={() =>
                              transitionMutation.mutate({
                                specimenId: row.id,
                                toStatus: action.toStatus,
                                v1ShortPath: action.v1ShortPath,
                              })
                            }
                          >
                            {t(`clinic.labSpecimens.actions.${action.labelKey}`)}
                          </button>
                        ))}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {printSpecimenId ? (
        <ClinicSpecimenLabelPrintModal
          businessId={businessId}
          businessName={business?.name ?? null}
          specimenId={printSpecimenId}
          onClose={() => setPrintSpecimenId(null)}
        />
      ) : null}
    </div>
  );
}
