import { IonIcon, IonSpinner } from '@ionic/react';
import { chevronDownOutline, chevronUpOutline } from 'ionicons/icons';
import { useEffect, useRef, useState } from 'react';
import { useHistory } from 'react-router-dom';
import type { ConsumerCopy } from '../lib/consumer-copy.types.js';
import { buildSalonPath } from '../lib/deep-link.js';
import { formatDateDisplay } from '../lib/date-format.js';
import { formatSubscriptionUsageLine } from '../lib/subscription-account.util.js';
import type { PublicCustomerSubscription } from '../lib/types.js';
import { cancelCustomerSubscription, fetchMySubscriptionUsage } from '../services/public-api.js';
import { ConsumerActionButton } from './ConsumerActionButton.js';

export function ConsumerSubscriptionsSection({
  slug,
  subscriptions,
  primary,
  copy,
  locale,
  initialExpandedSubscriptionId,
  onCancelled,
}: {
  slug: string;
  subscriptions: PublicCustomerSubscription[];
  primary: string;
  copy: ConsumerCopy;
  locale: string;
  initialExpandedSubscriptionId?: string | null;
  onCancelled?: () => void;
}) {
  const history = useHistory();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [usageById, setUsageById] = useState<
    Record<string, { loading: boolean; rows: import('../lib/types.js').PublicSubscriptionUsageRow[] }>
  >({});
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [cancelErrorId, setCancelErrorId] = useState<string | null>(null);
  const [cancelNoticeId, setCancelNoticeId] = useState<string | null>(null);
  const [cancelNoticeText, setCancelNoticeText] = useState<string | null>(null);
  const didAutoExpandRef = useRef(false);

  async function handleCancel(sub: PublicCustomerSubscription) {
    if (!window.confirm(copy.subscriptionsCancelConfirm)) return;
    setCancellingId(sub.id);
    setCancelErrorId(null);
    setCancelNoticeId(null);
    setCancelNoticeText(null);
    try {
      const result = await cancelCustomerSubscription(slug, sub.id);
      // e2e-bug.187 — refundStatus was fetched from the backend but only
      // ever checked for 'refunded'; 'ineligible' (already-used-a-visit,
      // permanent even after a later credit restore) and 'failed' were
      // silently swallowed, so a customer whose refund didn't happen saw
      // no explanation at all.
      if (result.refundStatus === 'refunded') {
        setCancelNoticeId(sub.id);
        setCancelNoticeText(copy.subscriptionsCancelRefunded);
      } else if (result.refundStatus === 'failed') {
        setCancelNoticeId(sub.id);
        setCancelNoticeText(copy.subscriptionsCancelRefundFailed);
      } else if (result.refundStatus === 'ineligible') {
        setCancelNoticeId(sub.id);
        setCancelNoticeText(copy.subscriptionsCancelIneligible);
      }
      onCancelled?.();
    } catch (err: unknown) {
      setCancelErrorId(sub.id);
      void err;
    } finally {
      setCancellingId(null);
    }
  }

  async function toggleUsage(sub: PublicCustomerSubscription) {
    if (expandedId === sub.id) {
      setExpandedId(null);
      return;
    }
    setExpandedId(sub.id);
    if (usageById[sub.id]) return;
    setUsageById((prev) => ({ ...prev, [sub.id]: { loading: true, rows: [] } }));
    try {
      const result = await fetchMySubscriptionUsage(slug, sub.id);
      setUsageById((prev) => ({
        ...prev,
        [sub.id]: { loading: false, rows: result.usage ?? [] },
      }));
    } catch {
      setUsageById((prev) => ({ ...prev, [sub.id]: { loading: false, rows: [] } }));
    }
  }

  useEffect(() => {
    if (!initialExpandedSubscriptionId || didAutoExpandRef.current) return;
    const sub = subscriptions.find((row) => row.id === initialExpandedSubscriptionId);
    if (!sub) return;
    didAutoExpandRef.current = true;
    void toggleUsage(sub);
  }, [initialExpandedSubscriptionId, subscriptions]);

  if (subscriptions.length === 0) {
    return <p style={{ color: '#6b7280' }}>{copy.subscriptionsEmpty}</p>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {subscriptions.map((sub) => {
        const serviceId = sub.plan?.service?.id;
        const expanded = expandedId === sub.id;
        const usageState = usageById[sub.id];
        const included = sub.appointmentsIncluded ?? sub.appointmentsRemaining;
        const isUnused =
          sub.status === 'active' && sub.appointmentsRemaining === included;
        return (
          <div key={sub.id} className="salon-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
              <div>
                <h2 style={{ fontWeight: 600, margin: 0 }}>
                  {sub.plan?.name ?? sub.planName ?? copy.subscriptionsFallbackName}
                </h2>
                {sub.plan?.service?.name ? (
                  <p style={{ color: '#6b7280', margin: '4px 0 0', fontSize: '0.875rem' }}>
                    {sub.plan.service.name}
                  </p>
                ) : null}
                <p style={{ margin: '8px 0 0', color: '#374151', fontSize: '0.9375rem' }}>
                  {copy.subscriptionsVisitsLeft
                    .replace('{remaining}', String(sub.appointmentsRemaining))
                    .replace('{included}', String(included))}
                  {' · '}
                  {copy.subscriptionsExpires.replace(
                    '{date}',
                    formatDateDisplay(new Date(sub.expiresAt), locale),
                  )}
                </p>
              </div>
              <span
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  textTransform: 'capitalize',
                  color: '#6b7280',
                }}
              >
                {sub.status}
              </span>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 12 }}>
              {sub.status === 'active' && sub.appointmentsRemaining > 0 && serviceId ? (
                <ConsumerActionButton
                  fill="clear"
                  size="small"
                  color={primary}
                  onClick={() =>
                    history.push(buildSalonPath(slug, `/book/${serviceId}`))
                  }
                >
                  {copy.subscriptionsBookNext}
                </ConsumerActionButton>
              ) : null}
              <ConsumerActionButton
                fill="clear"
                size="small"
                color="medium"
                aria-expanded={expanded}
                onClick={() => void toggleUsage(sub)}
              >
                {copy.subscriptionsUsageHistory}
                <IonIcon
                  slot="end"
                  icon={expanded ? chevronUpOutline : chevronDownOutline}
                />
              </ConsumerActionButton>
              {isUnused ? (
                <ConsumerActionButton
                  fill="outline"
                  size="small"
                  color="danger"
                  disabled={cancellingId === sub.id}
                  onClick={() => void handleCancel(sub)}
                >
                  {cancellingId === sub.id ? copy.submitting : copy.subscriptionsCancel}
                </ConsumerActionButton>
              ) : null}
            </div>

            {cancelErrorId === sub.id ? (
              <p style={{ color: '#dc2626', fontSize: '0.875rem', margin: '8px 0 0' }}>
                {copy.subscriptionsCancelFailed}
              </p>
            ) : null}
            {cancelNoticeId === sub.id && cancelNoticeText ? (
              <p
                style={{
                  color: cancelNoticeText === copy.subscriptionsCancelRefundFailed ? '#dc2626' : '#2563eb',
                  fontSize: '0.875rem',
                  margin: '8px 0 0',
                }}
              >
                {cancelNoticeText}
              </p>
            ) : null}

            {expanded ? (
              <div
                style={{
                  marginTop: 12,
                  paddingTop: 12,
                  borderTop: '1px solid #e5e7eb',
                }}
              >
                {usageState?.loading ? (
                  <IonSpinner name="crescent" />
                ) : usageState?.rows.length ? (
                  <ul
                    style={{
                      margin: 0,
                      paddingLeft: 18,
                      color: '#4b5563',
                      fontSize: '0.875rem',
                    }}
                  >
                    {usageState.rows.map((row) => (
                      <li key={row.id} style={{ marginBottom: 6 }}>
                        {formatSubscriptionUsageLine(row, copy, locale)}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p style={{ color: '#6b7280', fontSize: '0.875rem', margin: 0 }}>
                    {copy.subscriptionsNoUsage}
                  </p>
                )}
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
