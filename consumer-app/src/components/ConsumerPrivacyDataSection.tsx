import { IonButton, IonSpinner, useIonToast } from '@ionic/react';
import { useState, useEffect } from 'react';
import type { ConsumerCopy } from '../lib/consumer-copy.types.js';
import { downloadCustomerDataExport } from '../lib/consumer-privacy-data.util.js';
import {
  deletePublicCustomerData,
  exportPublicCustomerData,
} from '../services/public-api.js';

export function ConsumerPrivacyDataSection({
  slug,
  businessName,
  copy,
  onDeleted,
  autoAction,
}: {
  slug: string;
  businessName: string;
  copy: ConsumerCopy;
  onDeleted: () => void;
  autoAction?: 'export' | 'delete';
}) {
  const [presentToast] = useIonToast();
  const [loading, setLoading] = useState<'export' | 'delete' | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [autoHandled, setAutoHandled] = useState(false);

  const onExport = async () => {
    setLoading('export');
    setMessage(null);
    try {
      const data = await exportPublicCustomerData(slug);
      const result = await downloadCustomerDataExport({ slug, data, businessName });
      const successMessage =
        result === 'copied' ? copy.privacyExportCopied : copy.privacyExportSuccess;
      setMessage(successMessage);
      await presentToast({ message: successMessage, duration: 2500 });
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return;
      setMessage(copy.privacyActionFailed);
      await presentToast({ message: copy.privacyActionFailed, duration: 2500 });
    } finally {
      setLoading(null);
    }
  };

  const onDelete = async () => {
    if (!window.confirm(copy.privacyDeleteConfirm)) return;
    setLoading('delete');
    setMessage(null);
    try {
      await deletePublicCustomerData(slug);
      setMessage(copy.privacyDeleteSuccess);
      await presentToast({ message: copy.privacyDeleteSuccess, duration: 2500 });
      onDeleted();
    } catch {
      setMessage(copy.privacyActionFailed);
      await presentToast({ message: copy.privacyActionFailed, duration: 2500 });
    } finally {
      setLoading(null);
    }
  };

  useEffect(() => {
    if (!autoAction || autoHandled) return;
    setAutoHandled(true);
    if (autoAction === 'export') {
      void onExport();
      return;
    }
    void onDelete();
  }, [autoAction, autoHandled]);

  return (
    <div className="salon-card ion-margin-top">
      <p style={{ fontWeight: 600, marginBottom: 12 }}>{copy.privacyDataTitle}</p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        <IonButton
          fill="outline"
          size="small"
          disabled={loading !== null}
          onClick={() => void onExport()}
        >
          {loading === 'export' ? <IonSpinner name="crescent" /> : copy.privacyExportMyData}
        </IonButton>
        <IonButton
          fill="outline"
          color="danger"
          size="small"
          disabled={loading !== null}
          onClick={() => void onDelete()}
        >
          {loading === 'delete' ? copy.privacyLoading : copy.privacyDeleteMyData}
        </IonButton>
      </div>
      {message ? (
        <p style={{ fontSize: '0.8125rem', color: '#6b7280', marginTop: 10 }}>{message}</p>
      ) : null}
    </div>
  );
}
