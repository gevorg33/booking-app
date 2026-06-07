'use client';

import { useMemo, useState } from 'react';
import { ExternalLink, Loader2, ShieldAlert, Upload, UserCheck, UserX } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import api from '@/lib/api';
import { useI18n } from '@/i18n';
import { formatDateDisplay } from '@/lib/date-format';
import {
  type PatientChartDocumentView,
  type PatientChartDocumentsListView,
  type PatientDocumentCategory,
  unwrapPatientChartData,
} from '@/lib/patient-chart';

export interface PatientChartDocumentsTabProps {
  businessId: string;
  customerId: string;
}

const CATEGORY_OPTIONS: Array<PatientDocumentCategory | 'all'> = [
  'all',
  'lab_report',
  'referral_letter',
  'imaging_report',
  'other',
];

export function PatientChartDocumentsTab({
  businessId,
  customerId,
}: PatientChartDocumentsTabProps) {
  const { t, locale } = useI18n();
  const queryClient = useQueryClient();
  const [categoryFilter, setCategoryFilter] = useState<PatientDocumentCategory | 'all'>('all');
  const [uploadCategory, setUploadCategory] =
    useState<PatientDocumentCategory>('lab_report');
  const [uploadTitle, setUploadTitle] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const queryKey = ['patient-documents', businessId, customerId, categoryFilter];

  const { data, isLoading, error } = useQuery({
    queryKey,
    queryFn: async () => {
      const params =
        categoryFilter === 'all' ? undefined : { category: categoryFilter };
      const { data: payload } = await api.get(
        `/businesses/${businessId}/customers/${customerId}/documents`,
        { params },
      );
      return unwrapPatientChartData<PatientChartDocumentsListView>(payload);
    },
    enabled: !!businessId && !!customerId,
  });

  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!selectedFile) return;
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('category', uploadCategory);
      if (uploadTitle.trim()) {
        formData.append('title', uploadTitle.trim());
      }
      const { data: payload } = await api.post(
        `/businesses/${businessId}/customers/${customerId}/documents`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } },
      );
      return unwrapPatientChartData<PatientChartDocumentView>(payload);
    },
    onSuccess: () => {
      setSelectedFile(null);
      setUploadTitle('');
      queryClient.invalidateQueries({ queryKey: ['patient-documents', businessId, customerId] });
    },
  });

  const releaseMutation = useMutation({
    mutationFn: async (input: { documentId: string; releasedToPatient: boolean }) => {
      const { data: payload } = await api.patch(
        `/businesses/${businessId}/customers/${customerId}/documents/${input.documentId}/release`,
        { releasedToPatient: input.releasedToPatient },
      );
      return unwrapPatientChartData<PatientChartDocumentView>(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patient-documents', businessId, customerId] });
    },
  });

  const documents = data?.documents ?? [];
  const canUpload = data?.canUpload ?? false;

  const categoryLabel = useMemo(
    () => (category: PatientDocumentCategory | 'all') =>
      category === 'all'
        ? t('clinic.patientChart.documentCategories.all')
        : t(`clinic.patientChart.documentCategories.${category}`),
    [t],
  );

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-blue-400" />
      </div>
    );
  }

  if (isAxiosError(error) && error.response?.status === 403) {
    return (
      <div className="card text-sm text-gray-500">{t('clinic.patientChart.documentsForbidden')}</div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="card flex flex-wrap items-end justify-between gap-3">
        <div>
          <label className="label">{t('clinic.patientChart.documentFilterLabel')}</label>
          <select
            className="input max-w-xs"
            value={categoryFilter}
            onChange={(e) =>
              setCategoryFilter(e.target.value as PatientDocumentCategory | 'all')
            }
          >
            {CATEGORY_OPTIONS.map((category) => (
              <option key={category} value={category}>
                {categoryLabel(category)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {documents.length === 0 ? (
        <div className="card text-sm text-gray-500">{t('clinic.patientChart.documentsEmpty')}</div>
      ) : (
        <ul className="space-y-3">
          {documents.map((document) => (
            <li key={document.id} className="card space-y-2">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold">
                    {document.title ??
                      document.originalFileName ??
                      t('clinic.patientChart.documentUntitled')}
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    {categoryLabel(document.category)} ·{' '}
                    {formatDateDisplay(new Date(document.createdAt), locale)}
                    {document.uploadedByName ? ` · ${document.uploadedByName}` : ''}
                  </p>
                </div>
                {document.releasedToPatient ? (
                  <span className="rounded-full bg-emerald-500/10 px-2 py-1 text-xs text-emerald-300">
                    {t('clinic.patientChart.documentReleasedBadge')}
                  </span>
                ) : null}
              </div>

              {document.phiMasked ? (
                <div className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-100">
                  <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
                  <p>{t('clinic.patientChart.phiMaskedNotice')}</p>
                </div>
              ) : document.downloadUrl ? (
                <a
                  href={document.downloadUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-blue-400 hover:underline"
                >
                  <ExternalLink className="h-4 w-4" />
                  {t('clinic.patientChart.openDocument')}
                </a>
              ) : null}
              {!document.phiMasked ? (
                <button
                  type="button"
                  className="btn-secondary mt-2 inline-flex items-center gap-2 text-xs"
                  disabled={releaseMutation.isPending}
                  onClick={() =>
                    releaseMutation.mutate({
                      documentId: document.id,
                      releasedToPatient: !document.releasedToPatient,
                    })
                  }
                >
                  {releaseMutation.isPending ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : document.releasedToPatient ? (
                    <UserX className="h-3.5 w-3.5" />
                  ) : (
                    <UserCheck className="h-3.5 w-3.5" />
                  )}
                  {document.releasedToPatient
                    ? t('clinic.patientChart.revokeDocumentRelease')
                    : t('clinic.patientChart.releaseDocumentToPatient')}
                </button>
              ) : null}
            </li>
          ))}
        </ul>
      )}

      {canUpload ? (
        <section className="card space-y-3">
          <h2 className="text-sm font-semibold">{t('clinic.patientChart.uploadDocumentTitle')}</h2>
          <div>
            <label className="label">{t('clinic.patientChart.documentCategoryLabel')}</label>
            <select
              className="input max-w-md"
              value={uploadCategory}
              onChange={(e) =>
                setUploadCategory(e.target.value as PatientDocumentCategory)
              }
            >
              {CATEGORY_OPTIONS.filter((category) => category !== 'all').map((category) => (
                <option key={category} value={category}>
                  {categoryLabel(category)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">{t('clinic.patientChart.documentTitleLabel')}</label>
            <input
              className="input max-w-md"
              value={uploadTitle}
              onChange={(e) => setUploadTitle(e.target.value)}
              placeholder={t('clinic.patientChart.documentTitlePlaceholder')}
            />
          </div>
          <div>
            <label className="label">{t('clinic.patientChart.documentFileLabel')}</label>
            <input
              type="file"
              accept="application/pdf,.pdf"
              className="block text-sm"
              onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)}
            />
          </div>
          <button
            type="button"
            className="btn-primary inline-flex items-center gap-2 text-sm"
            disabled={uploadMutation.isPending || !selectedFile}
            onClick={() => uploadMutation.mutate()}
          >
            {uploadMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Upload className="h-4 w-4" />
            )}
            {t('clinic.patientChart.uploadDocument')}
          </button>
        </section>
      ) : null}
    </div>
  );
}
