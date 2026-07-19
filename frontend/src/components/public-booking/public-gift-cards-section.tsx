'use client';

import { Loader2, Package, Truck, X } from 'lucide-react';
import { useState } from 'react';
import {
  formatPrice,
  submitPublicGiftCardCancelRequest,
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
  onUpdated,
}: {
  slug: string;
  order: PublicGiftCardOrder;
  onUpdated: (order: PublicGiftCardOrder) => void;
}) {
  const { t } = useI18n();
  const [cancelOpen, setCancelOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [notes, setNotes] = useState('');

  function closeCancelModal() {
    setCancelOpen(false);
    setNotes('');
    setError(null);
  }

  async function confirmCancellation() {
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const result = await submitPublicGiftCardCancelRequest(slug, order.id, {
        customerNotes: notes.trim() || undefined,
      });
      onUpdated(result.order);
      closeCancelModal();
      if (result.refundStatus === 'refunded' || result.refundStatus === 'already_refunded') {
        setSuccess(t('public.giftCards.cancelRefunded'));
      } else if (result.refundStatus === 'failed') {
        setError(t('public.giftCards.cancelRefundFailed'));
      } else {
        setSuccess(t('public.giftCards.cancelSuccess'));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t('common.errorGeneric'));
    } finally {
      setLoading(false);
    }
  }

  if (order.changeRequest) {
    return (
      <p className="text-xs text-amber-700 mt-2">
        {t('public.giftCards.requestStatus')}: {order.changeRequest.status.replace('_', ' ')}
      </p>
    );
  }

  if (!order.policy.canCancel) {
    return order.policy.blockReason ? (
      <p className="text-xs text-gray-500 mt-2">{order.policy.blockReason}</p>
    ) : null;
  }

  return (
    <div className="mt-3 space-y-2">
      {order.policy.windowRemainingMs > 0 && (
        <p className="text-xs text-gray-500">
          {t('public.giftCards.cancelWindow')}: {formatWindowRemaining(order.policy.windowRemainingMs)}
        </p>
      )}
      {success && <p className="text-xs text-green-700 mt-2">{success}</p>}
      {error && !cancelOpen && <p className="text-xs text-red-600">{error}</p>}
      <button
        type="button"
        disabled={loading}
        className="text-xs px-3 py-1.5 rounded-lg border border-red-200 text-red-700 hover:bg-red-50 disabled:opacity-50"
        onClick={() => {
          setError(null);
          setCancelOpen(true);
        }}
      >
        {t('public.giftCards.cancelOrder')}
      </button>

      {cancelOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          {/* e2e-bug.4 spot-check — dismiss control is a real <button>, not a clickable div */}
          <button
            type="button"
            className="absolute inset-0 bg-black/50"
            aria-label={t('common.cancel')}
            onClick={closeCancelModal}
          />
          <div
            className="relative bg-white rounded-2xl border border-gray-100 shadow-xl w-full max-w-sm p-5"
            role="dialog"
            aria-modal="true"
            aria-labelledby={`gift-card-cancel-title-${order.id}`}
          >
            <div className="flex items-start justify-between gap-3 mb-3">
              <h3
                id={`gift-card-cancel-title-${order.id}`}
                className="text-base font-semibold text-gray-900"
              >
                {t('public.giftCards.cancelModalTitle')}
              </h3>
              <button
                type="button"
                onClick={closeCancelModal}
                className="text-gray-400 hover:text-gray-600 shrink-0"
                aria-label={t('common.cancel')}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-gray-600">{t('public.giftCards.cancelConfirm')}</p>
            <label className="block mt-4 text-sm font-medium text-gray-700">
              {t('public.giftCards.requestNotes')}
              <textarea
                className="input text-sm w-full min-h-[80px] mt-1.5"
                placeholder={t('public.giftCards.requestNotesPlaceholder')}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                disabled={loading}
              />
            </label>
            {error && <p className="text-xs text-red-600 mt-3">{error}</p>}
            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                disabled={loading}
                onClick={closeCancelModal}
                className="w-full sm:w-auto px-4 py-2 rounded-xl text-sm font-medium border border-gray-200 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                {t('common.cancel')}
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={() => void confirmCancellation()}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white bg-red-600 hover:bg-red-700 disabled:opacity-50"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                {loading ? t('common.loading') : t('public.giftCards.confirmCancellation')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function PublicGiftCardsSection({
  slug,
  orders,
  locale,
  onOrderUpdated,
}: {
  slug: string;
  orders: PublicGiftCardOrder[];
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
                {order.fulfillmentStatus === 'cancelled'
                  ? t('public.giftCards.statusCancelled')
                  : (order.fulfillmentStatus?.replace(/_/g, ' ') ?? '—')}
              </p>
            </div>
            <span className="text-xs font-medium text-gray-500 shrink-0">
              {order.isActive ? t('public.giftCards.active') : t('public.giftCards.inactive')}
            </span>
          </div>
          <OrderActions slug={slug} order={order} onUpdated={onOrderUpdated} />
        </article>
      ))}
    </div>
  );
}
