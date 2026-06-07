'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Loader2, Plus, Save, ShieldAlert } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { useI18n } from '@/i18n';
import { formatDateDisplay, formatTimeRangeDisplay } from '@/lib/date-format';
import {
  type PatientEncounterDetailView,
  type PatientEncounterListItem,
  unwrapPatientChartData,
  unwrapPatientChartList,
} from '@/lib/patient-chart';

export interface PatientChartEncountersTabProps {
  businessId: string;
  customerId: string;
}

export function PatientChartEncountersTab({
  businessId,
  customerId,
}: PatientChartEncountersTabProps) {
  const { t, locale } = useI18n();
  const queryClient = useQueryClient();
  const [selectedEncounterId, setSelectedEncounterId] = useState<string | null>(null);
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);
  const [visitNoteDraft, setVisitNoteDraft] = useState('');
  const [addendumDraft, setAddendumDraft] = useState('');

  const { data: encounters = [], isLoading } = useQuery({
    queryKey: ['patient-encounters', businessId, customerId],
    queryFn: async () => {
      const { data } = await api.get(
        `/businesses/${businessId}/customers/${customerId}/encounters`,
      );
      return unwrapPatientChartList<PatientEncounterListItem>(data);
    },
    enabled: !!businessId && !!customerId,
  });

  const activeEncounterId =
    selectedEncounterId ??
    encounters.find((row) => row.encounterId)?.encounterId ??
    null;
  const activeBookingId =
    selectedBookingId ??
    encounters.find((row) => row.bookingId === selectedBookingId)?.bookingId ??
    encounters[0]?.bookingId ??
    null;

  const { data: encounterDetail, isLoading: detailLoading } = useQuery({
    queryKey: ['patient-encounter-detail', businessId, customerId, activeEncounterId],
    queryFn: async () => {
      const { data } = await api.get(
        `/businesses/${businessId}/customers/${customerId}/encounters/${activeEncounterId}`,
      );
      return unwrapPatientChartData<PatientEncounterDetailView>(data);
    },
    enabled: !!businessId && !!customerId && !!activeEncounterId,
  });

  const selectedRow = useMemo(
    () => encounters.find((row) => row.bookingId === activeBookingId) ?? encounters[0],
    [activeBookingId, encounters],
  );

  const saveVisitNoteMutation = useMutation({
    mutationFn: async () => {
      const bookingId = selectedRow?.bookingId;
      if (!bookingId) return;
      const { data } = await api.put(
        `/businesses/${businessId}/customers/${customerId}/encounters/by-booking/${bookingId}`,
        { visitNote: visitNoteDraft.trim() },
      );
      return unwrapPatientChartData<PatientEncounterDetailView>(data);
    },
    onSuccess: (detail) => {
      queryClient.invalidateQueries({ queryKey: ['patient-encounters', businessId, customerId] });
      if (detail?.encounterId) {
        setSelectedEncounterId(detail.encounterId);
      }
    },
  });

  const addAddendumMutation = useMutation({
    mutationFn: async () => {
      if (!activeEncounterId) return;
      const { data } = await api.post(
        `/businesses/${businessId}/customers/${customerId}/encounters/${activeEncounterId}/addenda`,
        { body: addendumDraft.trim() },
      );
      return unwrapPatientChartData<PatientEncounterDetailView>(data);
    },
    onSuccess: () => {
      setAddendumDraft('');
      queryClient.invalidateQueries({ queryKey: ['patient-encounters', businessId, customerId] });
      queryClient.invalidateQueries({
        queryKey: ['patient-encounter-detail', businessId, customerId, activeEncounterId],
      });
    },
  });

  const openRow = (row: PatientEncounterListItem) => {
    setSelectedBookingId(row.bookingId);
    setSelectedEncounterId(row.encounterId);
    setVisitNoteDraft(row.visitNote ?? '');
    setAddendumDraft('');
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-blue-400" />
      </div>
    );
  }

  if (encounters.length === 0) {
    return (
      <div className="card text-sm text-gray-500">{t('clinic.patientChart.encountersEmpty')}</div>
    );
  }

  const detail = encounterDetail ?? selectedRow;
  const canEditVisitNote = selectedRow?.canAuthorVisitNote && !selectedRow?.phiMasked;
  const canAddAddendum = (detail as PatientEncounterDetailView | undefined)?.canAddAddendum;

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1.4fr)]">
      <section className="card space-y-3">
        <h2 className="text-sm font-semibold">{t('clinic.patientChart.encountersListTitle')}</h2>
        <ul className="space-y-2">
          {encounters.map((row) => {
            const selected = row.bookingId === (selectedRow?.bookingId ?? '');
            return (
              <li key={row.bookingId}>
                <button
                  type="button"
                  onClick={() => openRow(row)}
                  className={`w-full rounded-lg border p-3 text-left text-sm transition-colors ${
                    selected
                      ? 'border-blue-500/60 bg-blue-500/10'
                      : 'border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900/40'
                  }`}
                >
                  <div className="font-medium">
                    {row.serviceName ?? t('customers.appointmentFallback')}
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    {formatDateDisplay(new Date(row.startTime), locale)} ·{' '}
                    {formatTimeRangeDisplay(new Date(row.startTime), new Date(row.endTime))}
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    {row.visitNote
                      ? t('clinic.patientChart.encounterHasNote')
                      : t('clinic.patientChart.encounterNeedsNote')}
                    {row.addendaCount > 0
                      ? ` · ${t('clinic.patientChart.addendaCount', { count: row.addendaCount })}`
                      : ''}
                  </p>
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="card space-y-4">
        {!selectedRow ? null : (
          <>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold">
                  {selectedRow.serviceName ?? t('customers.appointmentFallback')}
                </h2>
                <p className="mt-1 text-xs text-gray-500">
                  {formatDateDisplay(new Date(selectedRow.startTime), locale)} ·{' '}
                  {selectedRow.providerName ?? '—'}
                </p>
              </div>
              <Link
                href={`/dashboard/appointments?bookingId=${selectedRow.bookingId}`}
                className="text-xs text-blue-400 hover:underline"
              >
                {t('clinic.labQueue.openBooking')}
              </Link>
            </div>

            {selectedRow.phiMasked || detail?.phiMasked ? (
              <div className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-100">
                <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
                <p>{t('clinic.patientChart.phiMaskedNotice')}</p>
              </div>
            ) : null}

            <div>
              <label className="label">{t('clinic.patientChart.visitNoteLabel')}</label>
              <textarea
                className="input min-h-[160px]"
                value={
                  visitNoteDraft ||
                  selectedRow.visitNote ||
                  encounterDetail?.visitNote ||
                  ''
                }
                onChange={(e) => setVisitNoteDraft(e.target.value)}
                disabled={!canEditVisitNote}
              />
              {canEditVisitNote ? (
                <button
                  type="button"
                  className="btn-primary mt-3 inline-flex items-center gap-2 text-sm"
                  disabled={saveVisitNoteMutation.isPending || !visitNoteDraft.trim()}
                  onClick={() => saveVisitNoteMutation.mutate()}
                >
                  {saveVisitNoteMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  {selectedRow.encounterId
                    ? t('clinic.patientChart.saveVisitNote')
                    : t('clinic.patientChart.createVisitNote')}
                </button>
              ) : null}
            </div>

            {activeEncounterId ? (
              <div>
                <h3 className="text-sm font-semibold">{t('clinic.patientChart.addendaTitle')}</h3>
                {detailLoading ? (
                  <Loader2 className="mt-3 h-5 w-5 animate-spin text-blue-400" />
                ) : (
                  <ul className="mt-3 space-y-3">
                    {(encounterDetail?.addenda ?? []).map((addendum) => (
                      <li
                        key={addendum.id}
                        className="rounded-lg border border-gray-200 p-3 text-sm dark:border-gray-800"
                      >
                        <div className="flex items-center justify-between gap-2 text-xs text-gray-500">
                          <span>{addendum.authorName ?? t('clinic.patientChart.unknownAuthor')}</span>
                          <span>{formatDateDisplay(new Date(addendum.createdAt), locale)}</span>
                        </div>
                        <p className="mt-2 whitespace-pre-wrap">
                          {addendum.body ?? t('clinic.patientChart.phiMaskedNotice')}
                        </p>
                      </li>
                    ))}
                    {(encounterDetail?.addenda ?? []).length === 0 ? (
                      <li className="text-sm text-gray-500">
                        {t('clinic.patientChart.addendaEmpty')}
                      </li>
                    ) : null}
                  </ul>
                )}

                {canAddAddendum ? (
                  <div className="mt-4">
                    <label className="label">{t('clinic.patientChart.addendumLabel')}</label>
                    <textarea
                      className="input min-h-[100px]"
                      value={addendumDraft}
                      onChange={(e) => setAddendumDraft(e.target.value)}
                    />
                    <button
                      type="button"
                      className="btn-secondary mt-3 inline-flex items-center gap-2 text-sm"
                      disabled={addAddendumMutation.isPending || !addendumDraft.trim()}
                      onClick={() => addAddendumMutation.mutate()}
                    >
                      {addAddendumMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Plus className="h-4 w-4" />
                      )}
                      {t('clinic.patientChart.appendAddendum')}
                    </button>
                  </div>
                ) : null}
              </div>
            ) : null}
          </>
        )}
      </section>
    </div>
  );
}
