import { IonButton, IonSpinner } from '@ionic/react';
import { useState } from 'react';
import type { ConsumerCopy } from '../lib/consumer-copy.types.js';
import { formatPublicMoney } from '../lib/business-currency.js';
import { formatDateDisplay } from '../lib/date-format.js';
import { formatGiftCardCancelWindow } from '../lib/gift-card-catalog.util.js';
import type { PublicGiftCardOrder } from '../lib/gift-card.types.js';
import { formatFriendlyNetworkError } from '../lib/consumer-network-ux.util.js';
import { submitPublicGiftCardCancelRequest } from '../services/public-api.js';

function OrderRow({
  slug,
  order,
  copy,
  locale,
  tenantCurrency,
  onUpdated,
}: {
  slug: string;
  order: PublicGiftCardOrder;
  copy: ConsumerCopy;
  locale: string;
  tenantCurrency: string;
  onUpdated: (order: PublicGiftCardOrder) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const cancelOrder = async () => {
    if (!window.confirm(copy.giftCardCancelConfirm)) return;
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const result = await submitPublicGiftCardCancelRequest(slug, order.id, {});
      onUpdated(result.order);
      if (result.refundStatus === 'refunded' || result.refundStatus === 'already_refunded') {
        setSuccess(copy.giftCardCancelRefunded);
      } else if (result.refundStatus === 'failed') {
        setError(copy.giftCardCancelRefundFailed);
      } else {
        setSuccess(copy.giftCardCancelSuccess);
      }
    } catch (err: unknown) {
      // e2e-bug.3 — unwrap Nest/axios body; never show bare status text.
      setError(formatFriendlyNetworkError(err, copy.networkLoadFailed));
    } finally {
      setLoading(false);
    }
  };

  return (
    <article className="salon-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
        <div>
          <p style={{ fontWeight: 600, textTransform: 'capitalize' }}>
            {order.cardType} · {order.code}
          </p>
          <p style={{ fontSize: 13, color: '#6b7280' }}>
            {formatDateDisplay(order.createdAt, locale)} · {order.deliveryMethod ?? '—'}
          </p>
          {order.cardType === 'monetary' ? (
            <p style={{ fontSize: 13 }}>
              {formatPublicMoney(order.balance, order.currency, tenantCurrency)} {copy.giftCardBalance}
            </p>
          ) : null}
          {order.trackingNumber ? (
            <p style={{ fontSize: 13, color: '#6b7280' }}>
              {order.trackingCarrier}: {order.trackingNumber}
            </p>
          ) : null}
          <p style={{ fontSize: 12, color: '#6b7280', textTransform: 'capitalize' }}>
            {order.fulfillmentStatus === 'cancelled'
              ? copy.giftCardStatusCancelled
              : (order.fulfillmentStatus?.replace(/_/g, ' ') ?? '—')}
          </p>
        </div>
        <span style={{ fontSize: 12, color: '#6b7280' }}>
          {order.isActive ? copy.giftCardActive : copy.giftCardInactive}
        </span>
      </div>

      {order.changeRequest ? (
        <p style={{ fontSize: 12, color: '#b45309', marginTop: 8 }}>
          {copy.giftCardRequestStatus}: {order.changeRequest.status.replace('_', ' ')}
        </p>
      ) : null}

      {!order.changeRequest && order.policy.canCancel ? (
        <div style={{ marginTop: 8 }}>
          {order.policy.windowRemainingMs > 0 ? (
            <p style={{ fontSize: 12, color: '#6b7280' }}>
              {copy.giftCardCancelWindow}: {formatGiftCardCancelWindow(order.policy.windowRemainingMs)}
            </p>
          ) : null}
          <IonButton fill="outline" color="danger" size="small" disabled={loading} onClick={() => void cancelOrder()}>
            {loading ? <IonSpinner name="crescent" /> : copy.giftCardCancelOrder}
          </IonButton>
        </div>
      ) : order.policy.blockReason ? (
        <p style={{ fontSize: 12, color: '#6b7280', marginTop: 8 }}>{order.policy.blockReason}</p>
      ) : null}

      {success ? <p style={{ fontSize: 12, color: '#15803d', marginTop: 8 }}>{success}</p> : null}
      {error ? <p style={{ fontSize: 12, color: '#b91c1c', marginTop: 8 }}>{error}</p> : null}
    </article>
  );
}

export function ConsumerGiftCardsOrdersSection({
  slug,
  copy,
  locale,
  tenantCurrency,
  orders,
  onOrderUpdated,
}: {
  slug: string;
  copy: ConsumerCopy;
  locale: string;
  tenantCurrency: string;
  orders: PublicGiftCardOrder[];
  onOrderUpdated: (order: PublicGiftCardOrder) => void;
}) {
  if (orders.length === 0) {
    return <p style={{ color: '#6b7280' }}>{copy.giftCardNoOrders}</p>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {orders.map((order) => (
        <OrderRow
          key={order.id}
          slug={slug}
          order={order}
          copy={copy}
          locale={locale}
          tenantCurrency={tenantCurrency}
          onUpdated={onOrderUpdated}
        />
      ))}
    </div>
  );
}
