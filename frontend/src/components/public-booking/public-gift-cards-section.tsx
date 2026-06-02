'use client';

import { useState } from 'react';
import { Loader2, Package, Truck } from 'lucide-react';
import {
  formatPrice,
  submitPublicGiftCardCancelRequest,
  submitPublicGiftCardModifyRequest,
  type PublicGiftCardOrder,
} from '@/lib/public-api';
import { formatDateDisplay } from '@/lib/date-format';
import { useI18n } from '@/i18n';

function formatWindowRemaining(ms: number): string {
  if (ms <= 0) return '';
  const hours = Math.floor(ms / (60 * 60 * 1000));
  const minutes = Math.floor((ms % (60 * 60 * 1000)) / (60 * 1000));
  if (hours >= 24) return `${Math.floor(hours / 24)}d ${hours % 24}h left`;
  return `${hours}h ${minutes}m left`;
}

function OrderActions({
  slug,
  order,
  primary,
  onUpdated,
}: {
  slug: string;
  order: PublicGiftCardOrder;
  primary: string;
  onUpdated: (order: PublicGiftCardOrder) => void;
}) {
  const { t } = useI18n();
  const [loading, setLoading] = useState<'cancel' | 'modify' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showModify, setShowModify] = useState(false);
  const [recipientName, setRecipientName] = useState(order.recipientName ?? '');
  const [personalMessage, setPersonalMessage] = useState('');
  const [notes, setNotes] = useState('');

  if (order.changeRequest) {
    return (
      <p className="text-xs text-amber-700 mt-2">
        {t('public.giftCards.requestStatus')}: {order.changeRequest.status.replace('_', ' ')}
      </p>
    );
  }

  if (!order.policy.canCancel && !order.policy.canModify) {
    return order.policy.blockReason ? (
      <p className="text-xs text-gray-500 mt-2">{order.policy.blockReason}</p>
    ) : null;
  }

  return (
    <div className="mt-3 space-y-2">
      {order.policy.windowRemainingMs > 0 && (
        <p className="text-xs text-gray-500">
          {t('public.giftCards.modifyWindow')}: {formatWindowRemaining(order.policy.windowRemainingMs)}
        </p>
      )}
      {error && <p className="text-xs text-red-600">{error}</p>}
      <div className="flex flex-wrap gap-2">
        {order.policy.canCancel && (
          <button
            type="button"
            disabled={loading !== null}
            className="text-xs px-3 py-1.5 rounded-lg border border-red-200 text-red-700"
            onClick={async () => {
              if (!window.confirm(t('public.giftCards.cancelConfirm'))) return;
              setLoading('cancel');
              setError(null);
              try {
                const result = await submitPublicGiftCardCancelRequest(slug, order.id, {
                  customerNotes: notes || undefined,
                });
                onUpdated(result.order);
              } catch (err) {
                setError(err instanceof Error ? err.message : t('common.errorGeneric'));
              } finally {
                setLoading(null);
              }
            }}
          >
            {loading === 'cancel' ? t('common.loading') : t('public.giftCards.cancelOrder')}
          </button>
        )}
        {order.policy.canModify && (
          <button
            type="button"
            disabled={loading !== null}
            className="text-xs px-3 py-1.5 rounded-lg border border-gray-200"
            onClick={() => setShowModify((v) => !v)}
          >
            {t('public.giftCards.modifyOrder')}
          </button>
        )}
      </div>
      {showModify && (
        <div className="rounded-xl border border-gray-100 p-3 space-y-2 bg-gray-50">
          <input
            className="input text-sm w-full"
            placeholder={t('public.giftCards.recipientName')}
            value={recipientName}
            onChange={(e) => setRecipientName(e.target.value)}
          />
          <textarea
            className="input text-sm w-full min-h-[72px]"
            placeholder={t('public.giftCards.personalMessage')}
            value={personalMessage}
            onChange={(e) => setPersonalMessage(e.target.value)}
          />
          <textarea
            className="input text-sm w-full min-h-[56px]"
            placeholder={t('public.giftCards.requestNotes')}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
          <button
            type="button"
            disabled={loading !== null}
            className="text-xs px-3 py-1.5 rounded-lg text-white"
            style={{ backgroundColor: primary }}
            onClick={async () => {
              setLoading('modify');
              setError(null);
              try {
                const result = await submitPublicGiftCardModifyRequest(slug, order.id, {
                  modifyPayload: {
                    recipientName: recipientName || undefined,
                    personalMessage: personalMessage || undefined,
                  },
                  customerNotes: notes || undefined,
                });
                onUpdated(result.order);
                setShowModify(false);
              } catch (err) {
                setError(err instanceof Error ? err.message : t('common.errorGeneric'));
              } finally {
                setLoading(null);
              }
            }}
          >
            {loading === 'modify' ? t('common.loading') : t('public.giftCards.submitModify')}
          </button>
        </div>
      )}
    </div>
  );
}

export function PublicGiftCardsSection({
  slug,
  orders,
  primary,
  locale,
  onOrderUpdated,
}: {
  slug: string;
  orders: PublicGiftCardOrder[];
  primary: string;
  locale: string;
  onOrderUpdated: (order: PublicGiftCardOrder) => void;
}) {
  const { t } = useI18n();

  if (orders.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 px-5 py-8 text-center">
        <p className="text-gray-500">{t('public.giftCards.noOrders')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {orders.map((order) => (
        <article key={order.id} className="bg-white rounded-2xl border border-gray-100 px-4 py-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-medium text-gray-900 capitalize flex items-center gap-2">
                <Package className="w-4 h-4 text-gray-400" />
                {order.cardType} · {order.code}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                {formatDateDisplay(order.createdAt, locale)} · {order.deliveryMethod ?? '—'}
              </p>
              {order.cardType === 'monetary' && (
                <p className="text-sm text-gray-600 mt-1">
                  {formatPrice(order.balance, order.currency, locale)} {t('public.giftCards.balance')}
                </p>
              )}
              {order.trackingNumber && (
                <p className="text-sm text-gray-600 mt-1 inline-flex items-center gap-1">
                  <Truck className="w-3.5 h-3.5" />
                  {order.trackingCarrier}: {order.trackingNumber}
                </p>
              )}
              <p className="text-xs text-gray-500 mt-1 capitalize">
                {order.fulfillmentStatus?.replace(/_/g, ' ') ?? '—'}
              </p>
            </div>
            <span className="text-xs font-medium text-gray-500 shrink-0">
              {order.isActive ? t('public.giftCards.active') : t('public.giftCards.inactive')}
            </span>
          </div>
          <OrderActions slug={slug} order={order} primary={primary} onUpdated={onOrderUpdated} />
        </article>
      ))}
    </div>
  );
}
