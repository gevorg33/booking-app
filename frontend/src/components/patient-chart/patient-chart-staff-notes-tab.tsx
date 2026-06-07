'use client';

import { useState } from 'react';
import { Loader2, Lock, Plus, ShieldAlert } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import api from '@/lib/api';
import { useI18n } from '@/i18n';
import { formatDateDisplay } from '@/lib/date-format';
import {
  type PatientStaffNotesListView,
  unwrapPatientChartData,
} from '@/lib/patient-chart';

export interface PatientChartStaffNotesTabProps {
  businessId: string;
  customerId: string;
}

export function PatientChartStaffNotesTab({
  businessId,
  customerId,
}: PatientChartStaffNotesTabProps) {
  const { t, locale } = useI18n();
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState('');

  const { data, isLoading, error } = useQuery({
    queryKey: ['patient-staff-notes', businessId, customerId],
    queryFn: async () => {
      const { data: payload } = await api.get(
        `/businesses/${businessId}/customers/${customerId}/staff-notes`,
      );
      return unwrapPatientChartData<PatientStaffNotesListView>(payload);
    },
    enabled: !!businessId && !!customerId,
    retry: (_, err) => !(isAxiosError(err) && err.response?.status === 403),
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const { data: payload } = await api.post(
        `/businesses/${businessId}/customers/${customerId}/staff-notes`,
        { body: draft.trim() },
      );
      return unwrapPatientChartData(payload);
    },
    onSuccess: () => {
      setDraft('');
      queryClient.invalidateQueries({ queryKey: ['patient-staff-notes', businessId, customerId] });
    },
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-blue-400" />
      </div>
    );
  }

  if (isAxiosError(error) && error.response?.status === 403) {
    return (
      <div className="card flex items-start gap-3 text-sm text-gray-500">
        <Lock className="mt-0.5 h-4 w-4 shrink-0" />
        <p>{t('clinic.patientChart.staffNotesForbidden')}</p>
      </div>
    );
  }

  const notes = data?.notes ?? [];
  const canCreate = data?.canCreate ?? false;

  return (
    <div className="space-y-4">
      <div className="card flex items-start gap-3 border border-slate-500/20 bg-slate-500/5 text-sm">
        <Lock className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
        <p>{t('clinic.patientChart.staffNotesInternalNotice')}</p>
      </div>

      {notes.length === 0 ? (
        <div className="card text-sm text-gray-500">{t('clinic.patientChart.staffNotesEmpty')}</div>
      ) : (
        <ul className="space-y-3">
          {notes.map((note) => (
            <li key={note.id} className="card space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-gray-500">
                <span>{note.authorName ?? t('clinic.patientChart.unknownAuthor')}</span>
                <span>{formatDateDisplay(new Date(note.createdAt), locale)}</span>
              </div>
              {note.phiMasked ? (
                <div className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-100">
                  <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
                  <p>{t('clinic.patientChart.phiMaskedNotice')}</p>
                </div>
              ) : (
                <p className="whitespace-pre-wrap text-sm">{note.body}</p>
              )}
            </li>
          ))}
        </ul>
      )}

      {canCreate ? (
        <section className="card space-y-3">
          <h2 className="text-sm font-semibold">{t('clinic.patientChart.addStaffNoteTitle')}</h2>
          <label className="label">{t('clinic.patientChart.staffNoteLabel')}</label>
          <textarea
            className="input min-h-[120px]"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
          />
          <button
            type="button"
            className="btn-primary inline-flex items-center gap-2 text-sm"
            disabled={createMutation.isPending || !draft.trim()}
            onClick={() => createMutation.mutate()}
          >
            {createMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            {t('clinic.patientChart.addStaffNote')}
          </button>
        </section>
      ) : null}
    </div>
  );
}
