'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { FlaskConical, Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { useI18n } from '@/i18n';
import {
  buildLabQueueQueryParams,
  CLINIC_LAB_ORDER_STATUSES,
  CLINIC_PLAYBOOK_DEPARTMENTS,
  LAB_QUEUE_AWAITING_PATIENT_BOOKING_FILTER,
  type ClinicLabQueueItem,
} from '@/lib/clinic-lab-queue';
import { isClinicVerticalBusinessType } from '@/lib/clinic-service';
import { formatDateDisplay } from '@/lib/date-format';
import { ClinicLabStatusBadge } from '@/components/clinic/clinic-lab-status-badge';

function unwrapList<T>(data: unknown): T[] {
  const payload = (data as { data?: unknown })?.data ?? data;
  if (Array.isArray(payload)) return payload as T[];
  const nested = (payload as { data?: unknown })?.data;
  return Array.isArray(nested) ? (nested as T[]) : [];
}

function formatQueueDateTime(value: string | null | undefined): string | null {
  if (!value) return null;
  return formatDateDisplay(new Date(value));
}

function LabQueueAwaitingPatientBadge() {
  const { t } = useI18n();
  return (
    <span className="inline-flex items-center rounded-full border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-300">
      {t('clinic.labQueue.badges.awaitingPatientBooking')}
    </span>
  );
}

export default function LabQueuePage() {
  const { t } = useI18n();
  const { business } = useAuthStore();
  const businessId = business?.id ?? '';
  const businessType =
    (business?.settings?.businessType as string | undefined) ?? undefined;
  const showPage = isClinicVerticalBusinessType(businessType);

  const [status, setStatus] = useState('');
  const [department, setDepartment] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const filters = useMemo(
    () => buildLabQueueQueryParams({ status, department, from, to }),
    [status, department, from, to],
  );

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ['clinic-lab-queue', businessId, filters],
    queryFn: async () => {
      const { data } = await api.get(
        `/businesses/${businessId}/clinic-test-results/orders`,
        { params: filters },
      );
      return unwrapList<ClinicLabQueueItem>(data);
    },
    enabled: !!businessId && showPage,
  });

  if (!showPage) {
    return (
      <div className="max-w-5xl mx-auto p-6">
        <div className="card text-sm text-gray-500">{t('clinic.labState.gate.disabledReason')}</div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold inline-flex items-center gap-2">
          <FlaskConical className="w-6 h-6" />
          {t('clinic.labQueue.title')}
        </h1>
        <p className="text-sm text-gray-500 mt-1">{t('clinic.labQueue.subtitle')}</p>
      </div>

      <div className="card grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <label className="label">{t('clinic.labQueue.filters.status')}</label>
          <select className="input" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">{t('clinic.labQueue.filters.allStatuses')}</option>
            <option value={LAB_QUEUE_AWAITING_PATIENT_BOOKING_FILTER}>
              {t('clinic.labQueue.filters.awaitingPatientBooking')}
            </option>
            {CLINIC_LAB_ORDER_STATUSES.map((value) => (
              <option key={value} value={value}>
                {t(`clinic.labState.order.${value}`)}
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
        <div className="card text-sm text-gray-500">{t('clinic.labQueue.empty')}</div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b border-gray-700/70">
                <th className="py-2 pr-4">{t('clinic.labQueue.columns.test')}</th>
                <th className="py-2 pr-4">{t('clinic.labQueue.columns.status')}</th>
                <th className="py-2 pr-4">{t('clinic.labQueue.columns.customer')}</th>
                <th className="py-2 pr-4">{t('clinic.labQueue.columns.appointment')}</th>
                <th className="py-2 pr-4">{t('clinic.labQueue.columns.pushSent')}</th>
                <th className="py-2 pr-4">{t('clinic.labQueue.columns.collection')}</th>
                <th className="py-2 pr-4">{t('clinic.labQueue.columns.department')}</th>
                <th className="py-2 pr-4">{t('clinic.labQueue.columns.provider')}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-b border-gray-800/80">
                  <td className="py-3 pr-4 font-medium text-gray-100">
                    {row.displayNames ?? '—'}
                  </td>
                  <td className="py-3 pr-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <ClinicLabStatusBadge kind="order" status={row.status} />
                      {row.awaitingPatientBooking ? <LabQueueAwaitingPatientBadge /> : null}
                    </div>
                  </td>
                  <td className="py-3 pr-4 text-gray-300">{row.customerName ?? '—'}</td>
                  <td className="py-3 pr-4 text-gray-300">
                    {row.visitBookingId ? (
                      <Link
                        href={`/dashboard/appointments?bookingId=${row.visitBookingId}`}
                        className="text-blue-400 hover:underline"
                      >
                        {formatQueueDateTime(row.visitBookingStartTime) ??
                          t('clinic.labQueue.openBooking')}
                      </Link>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="py-3 pr-4 text-gray-300">
                    {formatQueueDateTime(row.bookingRequestPushedAt) ?? '—'}
                  </td>
                  <td className="py-3 pr-4 text-gray-300">
                    {row.collectionBookingId ? (
                      <Link
                        href={`/dashboard/appointments?bookingId=${row.collectionBookingId}`}
                        className="text-blue-400 hover:underline"
                      >
                        {formatQueueDateTime(row.collectionBookingStartTime) ??
                          t('clinic.labQueue.openBooking')}
                      </Link>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="py-3 pr-4 text-gray-300">{row.department ?? '—'}</td>
                  <td className="py-3 pr-4 text-gray-300">{row.employeeName ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
