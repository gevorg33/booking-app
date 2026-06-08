import { useState } from 'react';
import type { ConsumerCopy } from '../lib/consumer-copy.types.js';
import { formatCopy } from '../lib/copy.js';
import { formatPublicMoney } from '../lib/business-currency.js';
import {
  formatPackageDurationMinutes,
  type PublicServicePackage,
} from '../lib/package-booking.js';
import { resolvePackageItemPricing } from '../lib/package-item-pricing.util.js';
import { formatDateDisplay } from '../lib/date-format.js';

interface ConsumerPackageCardsProps {
  packages: PublicServicePackage[];
  businessCurrency: string;
  primaryColor: string;
  selectedPackageId: string | null;
  onSelect: (packageId: string) => void;
  copy: ConsumerCopy;
  locale: string;
}

export function ConsumerPackageCards({
  packages,
  businessCurrency,
  primaryColor,
  selectedPackageId,
  onSelect,
  copy,
  locale,
}: ConsumerPackageCardsProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (packages.length === 0) return null;

  const money = (amount: number, entityCurrency?: string | null) =>
    formatPublicMoney(amount, entityCurrency, businessCurrency, locale);

  return (
    <section style={{ marginBottom: 24 }}>
      <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>{copy.packagesTitle}</h2>
      {packages.map((pkg) => {
        const selected = selectedPackageId === pkg.id;
        const expanded = expandedId === pkg.id;
        const includes = pkg.items
          .map((item) => `${item.serviceName}${item.quantity > 1 ? ` ×${item.quantity}` : ''}`)
          .join(', ');
        const pricedItems = resolvePackageItemPricing(pkg);

        return (
          <div
            key={pkg.id}
            style={{
              marginBottom: 12,
              borderRadius: 16,
              border: selected ? `2px solid ${primaryColor}` : '1px solid #e5e7eb',
              background: '#fff',
              overflow: 'hidden',
            }}
          >
            <button
              type="button"
              onClick={() => onSelect(pkg.id)}
              style={{
                width: '100%',
                display: 'flex',
                gap: 12,
                padding: 16,
                textAlign: 'left',
                border: 'none',
                background: 'transparent',
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: 0, fontWeight: 600 }}>{pkg.name}</p>
                <span
                  style={{
                    display: 'inline-block',
                    marginTop: 4,
                    fontSize: 11,
                    fontWeight: 500,
                    color: '#1d4ed8',
                    background: '#eff6ff',
                    padding: '2px 8px',
                    borderRadius: 999,
                  }}
                >
                  {formatCopy(copy.packageBadge, {
                    percent: pkg.pricing.savingsPercent.toFixed(0),
                  })}
                </span>
                {pkg.description ? (
                  <p style={{ margin: '4px 0 0', fontSize: 14, color: '#6b7280' }}>{pkg.description}</p>
                ) : null}
                <p style={{ margin: '4px 0 0', fontSize: 14, color: '#6b7280' }}>
                  {formatCopy(copy.packageIncludes, { list: includes })}
                </p>
                <p style={{ margin: '4px 0 0', fontSize: 14, color: '#6b7280' }}>
                  {formatPackageDurationMinutes(pkg.totalDurationMinutes)}
                </p>
                {pkg.expiresAt ? (
                  <p style={{ margin: '4px 0 0', fontSize: 12, color: '#b45309' }}>
                    {formatCopy(copy.packageValidUntil, {
                      date: formatDateDisplay(pkg.expiresAt, locale),
                    })}
                  </p>
                ) : null}
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <p style={{ margin: 0, fontWeight: 600 }}>{money(pkg.pricing.packagePrice, pkg.currency)}</p>
                <p style={{ margin: '2px 0 0', fontSize: 12, color: '#9ca3af', textDecoration: 'line-through' }}>
                  {money(pkg.pricing.regularTotal, pkg.currency)}
                </p>
                <span
                  style={{
                    display: 'inline-block',
                    marginTop: 8,
                    width: 20,
                    height: 20,
                    borderRadius: 4,
                    border: `2px solid ${selected ? primaryColor : '#d1d5db'}`,
                    background: selected ? primaryColor : 'transparent',
                  }}
                />
              </div>
            </button>
            <div style={{ padding: '0 16px 12px' }}>
              <button
                type="button"
                onClick={() => setExpandedId(expanded ? null : pkg.id)}
                style={{
                  fontSize: 12,
                  color: primaryColor,
                  border: 'none',
                  background: 'transparent',
                  padding: 0,
                }}
              >
                {expanded ? copy.packageHideDetails : copy.packageShowDetails}
              </button>
              {expanded ? (
                <ul style={{ margin: '8px 0 0', padding: 0, listStyle: 'none', borderTop: '1px solid #f3f4f6', paddingTop: 8 }}>
                  {pricedItems.map((item, itemIndex) => (
                    <li
                      key={`${item.serviceId}-${itemIndex}`}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        gap: 12,
                        fontSize: 14,
                        marginBottom: 8,
                      }}
                    >
                      <div style={{ minWidth: 0 }}>
                        <p style={{ margin: 0 }}>
                          {item.serviceName}
                          {item.quantity > 1 ? ` ×${item.quantity}` : ''}
                        </p>
                        <p style={{ margin: '2px 0 0', color: '#6b7280' }}>
                          {formatPackageDurationMinutes(item.durationMinutes)}
                        </p>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <p style={{ margin: 0, fontWeight: 500 }}>
                          {money(item.discountedLineTotal, pkg.currency)}
                        </p>
                        {item.lineSavings > 0 ? (
                          <>
                            <p style={{ margin: 0, fontSize: 12, color: '#9ca3af', textDecoration: 'line-through' }}>
                              {money(item.lineTotal, pkg.currency)}
                            </p>
                            <p style={{ margin: 0, fontSize: 12, color: '#047857', fontWeight: 500 }}>
                              {formatCopy(copy.packageItemSave, {
                                amount: money(item.lineSavings, pkg.currency),
                              })}
                            </p>
                          </>
                        ) : null}
                      </div>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          </div>
        );
      })}
    </section>
  );
}
