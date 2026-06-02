'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import api from '@/lib/api';
import { useI18n } from '@/i18n';
import { dateKeyToExpiresAtEndOfDay, formatDateDisplay } from '@/lib/date-format';

function unwrap<T>(res: unknown): T {
  return ((res as { data?: T })?.data ?? res) as T;
}

function expiresAtToDateKey(expiresAt: string | null | undefined): string {
  if (!expiresAt) return '';
  const d = new Date(expiresAt);
  if (Number.isNaN(d.getTime())) return '';
  return d.toISOString().slice(0, 10);
}

export type GiftCardRow = {
  id: string;
  code: string;
  balance: number;
  currency: string;
  cardType?: string;
  expiresAt?: string | null;
  isActive?: boolean;
  codeRevealed?: boolean;
  deliveryMethod?: string;
  fulfillmentStatus?: string;
  recipientName?: string | null;
  recipientEmail?: string | null;
  recipientPhone?: string | null;
  purchaserEmail?: string | null;
  createdAt?: string;
  purchaseAmount?: number | null;
  trackingCarrier?: string | null;
  trackingNumber?: string | null;
  personalMessage?: string | null;
  serviceCredits?: Array<{
    serviceName: string;
    quantityRemaining: number;
    quantityTotal: number;
  }>;
};

export function GiftCardExpirationEditor({
  businessId,
  card,
  onClose,
}: {
  businessId: string;
  card: GiftCardRow;
  onClose: () => void;
}) {
  const { t, locale } = useI18n();
  const queryClient = useQueryClient();
  const [mode, setMode] = useState<'set' | 'extend'>('set');
  const [expiresAtDay, setExpiresAtDay] = useState(expiresAtToDateKey(card.expiresAt));
  const [extendMonths, setExtendMonths] = useState('3');
  const [extendDays, setExtendDays] = useState('');
  const [note, setNote] = useState('');

  const { data: auditEntries = [], isLoading: auditLoading } = useQuery({
    queryKey: ['gift-card-expiration-audit', businessId, card.id],
    queryFn: async () => {
      const { data } = await api.get(`/businesses/${businessId}/gift-cards/${card.id}/expiration-audit`);
      return unwrap<{ entries: Array<{ action: string; previousExpiresAt?: string | null; newExpiresAt?: string | null; note?: string | null; createdAt: string }> }>(data).entries;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (body: Record<string, unknown>) => {
      const { data } = await api.put(`/businesses/${businessId}/gift-cards/${card.id}/expiration`, body);
      return unwrap<{ card: GiftCardRow }>(data).card;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gift-cards', businessId] });
      queryClient.invalidateQueries({ queryKey: ['gift-card-fulfillment', businessId] });
      queryClient.invalidateQueries({ queryKey: ['gift-card-fulfillment-detail', businessId] });
      queryClient.invalidateQueries({ queryKey: ['gift-card-expiration-audit', businessId, card.id] });
      onClose();
    },
  });

  return (
    <div className="rounded-lg border border-gray-700 bg-gray-900/60 p-4 space-y-4 mt-2">
      <div className="flex gap-2 text-xs">
        <button
          type="button"
          className={`px-2 py-1 rounded ${mode === 'set' ? 'bg-blue-600/20 text-blue-300' : 'text-gray-400'}`}
          onClick={() => setMode('set')}
        >
          {t('monetization.expirationDate')}
        </button>
        <button
          type="button"
          className={`px-2 py-1 rounded ${mode === 'extend' ? 'bg-blue-600/20 text-blue-300' : 'text-gray-400'}`}
          onClick={() => setMode('extend')}
        >
          {t('monetization.giftCardExtendBy')}
        </button>
      </div>

      {mode === 'set' ? (
        <div className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="label">{t('monetization.expirationDate')}</label>
            <input
              type="date"
              className="input max-w-[160px]"
              value={expiresAtDay}
              onChange={(e) => setExpiresAtDay(e.target.value)}
            />
          </div>
          <button
            type="button"
            className="btn-secondary text-sm"
            disabled={saveMutation.isPending}
            onClick={() => {
              const expiresAt = expiresAtDay ? dateKeyToExpiresAtEndOfDay(expiresAtDay) : null;
              saveMutation.mutate({ expiresAt, note: note || undefined });
            }}
          >
            {saveMutation.isPending ? t('monetization.saving') : t('monetization.giftCardSaveExpiration')}
          </button>
          <button
            type="button"
            className="text-sm text-gray-400 hover:text-gray-200"
            disabled={saveMutation.isPending}
            onClick={() => saveMutation.mutate({ expiresAt: null, note: note || undefined })}
          >
            {t('monetization.giftCardClearExpiration')}
          </button>
        </div>
      ) : (
        <div className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="label">{t('monetization.giftCardExtendMonths')}</label>
            <input
              type="number"
              min="0"
              className="input max-w-[100px]"
              value={extendMonths}
              onChange={(e) => setExtendMonths(e.target.value)}
            />
          </div>
          <div>
            <label className="label">{t('monetization.giftCardExtendDays')}</label>
            <input
              type="number"
              min="0"
              className="input max-w-[100px]"
              value={extendDays}
              onChange={(e) => setExtendDays(e.target.value)}
            />
          </div>
          <button
            type="button"
            className="btn-primary text-sm"
            disabled={saveMutation.isPending}
            onClick={() =>
              saveMutation.mutate({
                extendMonths: extendMonths ? Number(extendMonths) : 0,
                extendDays: extendDays ? Number(extendDays) : 0,
                note: note || undefined,
              })
            }
          >
            {saveMutation.isPending ? t('monetization.saving') : t('monetization.giftCardSaveExpiration')}
          </button>
        </div>
      )}

      <div>
        <label className="label">{t('monetization.giftCardExpirationNote')}</label>
        <input className="input" value={note} onChange={(e) => setNote(e.target.value)} />
      </div>

      <div>
        <p className="text-xs font-medium text-gray-400 mb-2">{t('monetization.giftCardExpirationAudit')}</p>
        {auditLoading ? (
          <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
        ) : auditEntries.length === 0 ? (
          <p className="text-xs text-gray-500">—</p>
        ) : (
          <ul className="text-xs text-gray-400 space-y-1">
            {auditEntries.map((entry, i) => (
              <li key={i}>
                <span className="capitalize text-gray-300">{entry.action}</span>
                {' · '}
                {entry.previousExpiresAt
                  ? formatDateDisplay(entry.previousExpiresAt, locale)
                  : t('monetization.noExpiration')}
                {' → '}
                {entry.newExpiresAt ? formatDateDisplay(entry.newExpiresAt, locale) : t('monetization.noExpiration')}
                {entry.note ? ` · ${entry.note}` : ''}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
