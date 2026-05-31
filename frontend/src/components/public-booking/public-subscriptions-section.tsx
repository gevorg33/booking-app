'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { formatDateDisplay, formatPrice, getPublicCustomerSubscriptionUsage, type PublicCustomerSubscription } from '@/lib/public-api';
import { bookPath } from '@/lib/tenant-host';

export function PublicSubscriptionsSection({
  slug,
  subscriptions,
  primary,
  locale,
}: {
  slug: string;
  subscriptions: PublicCustomerSubscription[];
  primary: string;
  locale: string;
}) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [usageById, setUsageById] = useState<Record<string, { loading: boolean; rows: any[] }>>({});

  async function toggleUsage(sub: PublicCustomerSubscription) {
    if (expandedId === sub.id) {
      setExpandedId(null);
      return;
    }
    setExpandedId(sub.id);
    if (usageById[sub.id]) return;
    setUsageById((prev) => ({ ...prev, [sub.id]: { loading: true, rows: [] } }));
    try {
      const res = await getPublicCustomerSubscriptionUsage(slug, sub.id);
      setUsageById((prev) => ({ ...prev, [sub.id]: { loading: false, rows: res.usage ?? [] } }));
    } catch {
      setUsageById((prev) => ({ ...prev, [sub.id]: { loading: false, rows: [] } }));
    }
  }

  if (subscriptions.length === 0) {
    return <p className="text-sm text-gray-500">No subscriptions yet.</p>;
  }

  return (
    <ul className="space-y-3">
      {subscriptions.map((sub) => {
        const serviceId = sub.plan?.service?.id;
        const expanded = expandedId === sub.id;
        const usageState = usageById[sub.id];
        return (
          <li key={sub.id} className="bg-white rounded-2xl border border-gray-100 px-4 py-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-medium text-gray-900">{sub.plan?.name ?? 'Subscription'}</p>
                {sub.plan?.service?.name && (
                  <p className="text-sm text-gray-500 mt-0.5">{sub.plan.service.name}</p>
                )}
                <p className="text-sm text-gray-600 mt-2">
                  {sub.appointmentsRemaining} / {sub.appointmentsIncluded} visits left · expires{' '}
                  {formatDateDisplay(new Date(sub.expiresAt), locale)}
                </p>
              </div>
              <span className="text-xs font-medium capitalize text-gray-500 shrink-0">{sub.status}</span>
            </div>
            <div className="mt-3 flex flex-wrap gap-3">
              {sub.status === 'active' && sub.appointmentsRemaining > 0 && serviceId && (
                <Link
                  href={bookPath(slug, `/any/availability?serviceId=${encodeURIComponent(serviceId)}`)}
                  className="text-sm font-medium"
                  style={{ color: primary }}
                >
                  Book next visit
                </Link>
              )}
              <button
                type="button"
                onClick={() => void toggleUsage(sub)}
                className="text-sm text-gray-600 inline-flex items-center gap-1"
              >
                Usage history
                {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            </div>
            {expanded && (
              <div className="mt-3 pt-3 border-t border-gray-100">
                {usageState?.loading ? (
                  <div className="flex justify-center py-2">
                    <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                  </div>
                ) : usageState?.rows.length ? (
                  <ul className="space-y-2 text-sm text-gray-600">
                    {usageState.rows.map((row) => (
                      <li key={row.id} className="flex justify-between gap-2">
                        <span className="capitalize">{row.action}</span>
                        <span>
                          {formatDateDisplay(new Date(row.createdAt), locale)} · {row.appointmentsRemainingAfter}{' '}
                          left
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-500">No usage recorded yet.</p>
                )}
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
