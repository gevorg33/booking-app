'use client';

import { ExternalLink, Loader2 } from 'lucide-react';
import { useI18n } from '@/i18n';
import { formatDateDisplay } from '@/lib/date-format';
import type { PublicCustomerReleasedClinicDocument } from '@/lib/public-clinic-documents';

export interface PublicMyDocumentsSectionProps {
  documents: PublicCustomerReleasedClinicDocument[];
  loading: boolean;
  error: string | null;
  locale: string;
}

export function PublicMyDocumentsSection({
  documents,
  loading,
  error,
  locale,
}: PublicMyDocumentsSectionProps) {
  const { t } = useI18n();

  if (loading) {
    return (
      <div className="flex justify-center py-10">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  if (error) {
    return <p className="text-sm text-red-600">{error}</p>;
  }

  if (documents.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 px-5 py-8 text-center">
        <p className="text-gray-500">{t('public.myDocuments.empty')}</p>
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {documents.map((document) => (
        <li
          key={document.id}
          className="bg-white rounded-2xl border border-gray-100 px-4 py-4"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="font-medium text-gray-900">
                {document.title ??
                  document.originalFileName ??
                  t('public.myDocuments.unnamedDocument')}
              </p>
              <p className="text-sm text-gray-600 mt-2">
                {t(`public.myDocuments.categories.${document.category}`)} ·{' '}
                {formatDateDisplay(new Date(document.createdAt), locale)}
              </p>
            </div>
          </div>
          <a
            href={document.downloadUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex items-center gap-2 text-sm text-violet-700 hover:underline"
          >
            <ExternalLink className="h-4 w-4" />
            {t('public.myDocuments.openDocument')}
          </a>
        </li>
      ))}
    </ul>
  );
}
