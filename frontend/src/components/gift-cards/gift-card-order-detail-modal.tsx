'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Loader2, X } from 'lucide-react';
import api from '@/lib/api';
import { useI18n } from '@/i18n';
import { formatDateDisplay } from '@/lib/date-format';
import {
  GiftCardExpirationEditor,
  type GiftCardRow,
} from '@/components/gift-cards/gift-card-expiration-editor';
import { useBusinessCurrency } from '@/hooks/use-business-currency';

function unwrap<T>(res: unknown): T {
  return ((res as { data?: T })?.data ?? res) as T;
}

function formatFulfillmentStatus(status: string | null | undefined, t: (key: string) => string): string {
  switch (status) {
    case 'cancelled':
      return t('monetization.giftCardStatusCancelled');
    case 'pending':
      return t('monetization.giftCardStatusPending');
    case 'awaiting_card_creation':
      return t('monetization.giftCardStatusAwaitingCreation');
    case 'ready_for_delivery':
      return t('monetization.giftCardStatusReady');
    case 'out_for_delivery':
      return t('monetization.giftCardStatusOutForDelivery');
    case 'shipped':
      return t('monetization.giftCardStatusShipped');
    case 'delivered':
      return t('monetization.giftCardStatusDelivered');
    default:
      return status ?? '—';
  }
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5 sm:flex-row sm:gap-3 sm:items-start">
      <dt className="text-xs font-medium text-gray-500 shrink-0 sm:w-36">{label}</dt>
      <dd className="text-sm text-gray-200 break-words">{value}</dd>
    </div>
  );
}

export function GiftCardOrderDetailModal({
  businessId,
  giftCardId,
  onClose,
  onUpdated,
}: {
  businessId: string;
  giftCardId: string;
  onClose: () => void;
  onUpdated: () => void;
}) {
  const { t, locale } = useI18n();
  const { formatMoney } = useBusinessCurrency();
  const [showExpirationEditor, setShowExpirationEditor] = useState(false);

  const { data: order, isLoading, error } = useQuery({
    queryKey: ['gift-card-fulfillment-detail', businessId, giftCardId],
    queryFn: async () => {
      const { data } = await api.get(`/businesses/${businessId}/gift-cards/fulfillment/${giftCardId}`);
      return unwrap<{ order: GiftCardRow }>(data).order;
    },
  });

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="bg-gray-900 border border-gray-700 rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl"
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between gap-3 px-5 py-4 border-b border-gray-800 bg-gray-900">
          <h3 className="font-semibold text-white">{t('monetization.giftCardOrderDetails')}</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-white"
            aria-label={t('common.cancel')}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-5 py-4">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
            </div>
          ) : error || !order ? (
            <p className="text-sm text-red-400">{t('common.errorGeneric')}</p>
          ) : (
            <dl className="space-y-3">
              <DetailRow
                label={t('monetization.giftCardDetailCode')}
                value={<span className="font-mono">{order.codeRevealed ? order.code : '****'}</span>}
              />
              <DetailRow
                label={t('monetization.giftCardDetailType')}
                value={<span className="capitalize">{order.cardType ?? '—'}</span>}
              />
              <DetailRow
                label={t('monetization.giftCardDetailDelivery')}
                value={<span className="capitalize">{order.deliveryMethod ?? '—'}</span>}
              />
              <DetailRow
                label={t('monetization.giftCardDetailStatus')}
                value={formatFulfillmentStatus(order.fulfillmentStatus, t)}
              />
              <DetailRow
                label={t('monetization.giftCardDetailCreated')}
                value={order.createdAt ? formatDateDisplay(order.createdAt, locale) : '—'}
              />
              <DetailRow
                label={t('monetization.expirationDate')}
                value={
                  order.expiresAt
                    ? formatDateDisplay(order.expiresAt, locale)
                    : t('monetization.noExpiration')
                }
              />
              <DetailRow label={t('monetization.giftCardDetailRecipient')} value={order.recipientName ?? '—'} />
              <DetailRow
                label={t('monetization.giftCardDetailRecipientEmail')}
                value={order.recipientEmail ?? '—'}
              />
              <DetailRow
                label={t('monetization.giftCardDetailRecipientPhone')}
                value={order.recipientPhone ?? '—'}
              />
              <DetailRow
                label={t('monetization.giftCardDetailPurchaserEmail')}
                value={order.purchaserEmail ?? '—'}
              />
              <DetailRow
                label={t('monetization.giftCardDetailBalance')}
                value={formatMoney(order.balance, order.currency)}
              />
              {order.purchaseAmount != null && (
                <DetailRow
                  label={t('monetization.giftCardDetailPurchaseAmount')}
                  value={formatMoney(order.purchaseAmount, order.currency)}
                />
              )}
              {order.trackingNumber && (
                <DetailRow
                  label={t('monetization.giftCardDetailTracking')}
                  value={`${order.trackingCarrier ?? ''} ${order.trackingNumber}`.trim()}
                />
              )}
              {order.personalMessage && (
                <DetailRow label={t('monetization.giftCardDetailMessage')} value={order.personalMessage} />
              )}
              {order.serviceCredits && order.serviceCredits.length > 0 && (
                <div className="pt-2">
                  <p className="text-xs font-medium text-gray-500 mb-2">{t('monetization.giftCardDetailCredits')}</p>
                  <ul className="text-sm text-gray-300 space-y-1">
                    {order.serviceCredits.map((credit, index) => (
                      <li key={`${credit.serviceName}-${index}`}>
                        {credit.serviceName} — {credit.quantityRemaining}/{credit.quantityTotal}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </dl>
          )}
        </div>

        {order && (
          <div className="px-5 pb-5 space-y-3 border-t border-gray-800 pt-4">
            <button
              type="button"
              className="text-sm text-blue-400 hover:underline"
              onClick={() => setShowExpirationEditor((open) => !open)}
            >
              {t('monetization.giftCardEditExpiration')}
            </button>
            {showExpirationEditor && (
              <GiftCardExpirationEditor
                businessId={businessId}
                card={order}
                onClose={() => {
                  setShowExpirationEditor(false);
                  onUpdated();
                }}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
