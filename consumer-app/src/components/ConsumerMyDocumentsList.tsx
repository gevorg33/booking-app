import {
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonSpinner,
} from '@ionic/react';
import { consumerCopyForLocale, formatCopy } from '../lib/copy.js';
import { formatDateDisplay } from '../lib/date-format.js';
import type { PublicCustomerReleasedClinicDocument } from '../lib/public-clinic-documents.js';

export interface ConsumerMyDocumentsListProps {
  documents: PublicCustomerReleasedClinicDocument[];
  loading: boolean;
  error: string | null;
  locale: string;
}

export function ConsumerMyDocumentsList({
  documents,
  loading,
  error,
  locale,
}: ConsumerMyDocumentsListProps) {
  const copy = consumerCopyForLocale(locale);

  if (loading) {
    return (
      <div className="flex justify-center py-10">
        <IonSpinner name="crescent" />
      </div>
    );
  }

  if (error) {
    return <p className="text-sm text-red-600">{error}</p>;
  }

  if (documents.length === 0) {
    return (
      <IonCard>
        <IonCardContent>{copy.myDocumentsEmpty}</IonCardContent>
      </IonCard>
    );
  }

  return (
    <div className="space-y-3">
      {documents.map((document) => (
        <IonCard key={document.id}>
          <IonCardHeader>
            <IonCardTitle className="text-base">
              {document.title ??
                document.originalFileName ??
                copy.myDocumentsUnnamed}
            </IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <p className="text-sm text-gray-600">
              {formatCopy(copy.myDocumentsCategoryLine, {
                category: copy.myDocumentCategories[document.category],
                date: formatDateDisplay(document.createdAt, locale),
              })}
            </p>
            <a
              href={document.downloadUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block mt-3 text-sm text-violet-700"
            >
              {copy.myDocumentsOpenDocument}
            </a>
          </IonCardContent>
        </IonCard>
      ))}
    </div>
  );
}
