import type { AppLocale } from '../i18n/messages.js';
import { t } from '../i18n/messages.js';
import { resolvePriceCurrency } from './business-currency.util.js';
import { readBusinessTaxSettings } from './business-tax.util.js';
import { readBookingReceiptTaxSnapshot } from './booking-receipt-tax.util.js';

const INTL_LOCALE: Record<AppLocale, string | undefined> = {
  en: undefined,
  hy: 'hy-AM',
  ru: 'ru-RU',
};

export interface BookingPriceSource {
  service?: { price?: number | string | null; currency?: string | null } | null;
  metadata?: Record<string, unknown> | null;
  paymentStatus?: string | null;
}

export interface BookingPriceLines {
  priceLabel: string;
  priceLineText: string;
  priceLineHtml: string;
  taxRegistrationFooter?: string;
}

function formatTaxRateLabel(rate: number): string {
  return Number.isInteger(rate) ? String(rate) : rate.toFixed(1);
}

export function formatNotificationMoney(
  amount: number | string | null | undefined,
  entityCurrency: string | null | undefined,
  businessSettings?: Record<string, unknown>,
  locale: AppLocale = 'en',
): string | null {
  if (amount == null || amount === '') return null;
  const value = Number(amount);
  if (!Number.isFinite(value)) return null;

  const currency = resolvePriceCurrency(entityCurrency, businessSettings);
  const intlLocale = INTL_LOCALE[locale];

  try {
    return new Intl.NumberFormat(intlLocale, {
      style: 'currency',
      currency,
      maximumFractionDigits: value % 1 === 0 ? 0 : 2,
    }).format(value);
  } catch {
    return `${value} ${currency}`;
  }
}

export function resolveBookingNotificationAmount(
  booking: BookingPriceSource,
): number | null {
  const metadata = booking.metadata ?? {};
  const pricing =
    metadata.pricing && typeof metadata.pricing === 'object'
      ? (metadata.pricing as Record<string, unknown>)
      : null;

  const candidates = [
    pricing?.amountDue,
    metadata.amountPaid,
    metadata.prepaymentAmount,
    booking.service?.price,
  ];

  for (const candidate of candidates) {
    if (candidate == null || candidate === '') continue;
    const value = Number(candidate);
    if (Number.isFinite(value) && value >= 0) return value;
  }

  return null;
}

function resolveBookingPriceMessageKey(booking: BookingPriceSource): string {
  const metadata = booking.metadata ?? {};
  const paid =
    booking.paymentStatus === 'paid' ||
    booking.paymentStatus === 'partially_paid' ||
    metadata.amountPaid != null;
  return paid ? 'email.amountPaidLine' : 'email.servicePriceLine';
}

export function resolveEmailFooterNote(
  locale: AppLocale,
  baseFooter: string,
  taxRegistrationFooter?: string,
): string {
  if (!taxRegistrationFooter) return baseFooter;
  return `${baseFooter}\n\n${taxRegistrationFooter}`;
}

export function buildBookingPriceLines(
  booking: BookingPriceSource,
  businessSettings: Record<string, unknown> | undefined,
  locale: AppLocale,
): BookingPriceLines {
  const taxSnapshot = readBookingReceiptTaxSnapshot(booking);
  const taxSettings = readBusinessTaxSettings(businessSettings);
  const taxRegistrationFooter = taxSettings.taxNumber
    ? t(locale, 'email.taxRegistrationFooter', {
        number: taxSettings.taxNumber,
      })
    : undefined;

  if (taxSnapshot && taxSnapshot.taxAmount > 0) {
    const textLines: string[] = [];
    const htmlLines: string[] = [];
    const subtotalAmount =
      taxSnapshot.subtotal ?? taxSnapshot.netAmount ?? null;
    if (subtotalAmount != null) {
      const formattedSubtotal = formatNotificationMoney(
        subtotalAmount,
        booking.service?.currency,
        businessSettings,
        locale,
      );
      if (formattedSubtotal) {
        const subtotalLine = t(locale, 'email.receiptSubtotalLine', {
          price: formattedSubtotal,
        });
        textLines.push(subtotalLine);
        htmlLines.push(subtotalLine);
      }
    }

    for (const taxLine of taxSnapshot.taxLines) {
      const formattedTax = formatNotificationMoney(
        taxLine.amount,
        booking.service?.currency,
        businessSettings,
        locale,
      );
      if (!formattedTax) continue;
      const includedSuffix =
        taxSnapshot.taxModel === 'inclusive'
          ? ` (${t(locale, 'email.receiptTaxIncluded')})`
          : '';
      const prefix = taxSnapshot.taxModel === 'exclusive' ? '+' : '';
      const line = t(locale, 'email.receiptTaxLine', {
        name: taxLine.name,
        rate: formatTaxRateLabel(taxLine.rate),
        prefix,
        price: `${formattedTax}${includedSuffix}`,
      });
      textLines.push(line);
      htmlLines.push(line);
    }

    const grossAmount =
      taxSnapshot.grossAmount ?? resolveBookingNotificationAmount(booking);
    const formattedTotal = formatNotificationMoney(
      grossAmount,
      booking.service?.currency,
      businessSettings,
      locale,
    );
    if (formattedTotal) {
      const totalLine = t(locale, 'email.receiptTotalLine', {
        price: formattedTotal,
      });
      textLines.push(totalLine);
      htmlLines.push(totalLine);
    }

    return {
      priceLabel: formattedTotal ?? '',
      priceLineText: textLines.length > 0 ? `\n${textLines.join('\n')}` : '',
      priceLineHtml:
        htmlLines.length > 0 ? `<br/>${htmlLines.join('<br/>')}` : '',
      taxRegistrationFooter,
    };
  }

  const amount = resolveBookingNotificationAmount(booking);
  const formatted = formatNotificationMoney(
    amount,
    booking.service?.currency,
    businessSettings,
    locale,
  );

  if (!formatted) {
    return {
      priceLabel: '',
      priceLineText: '',
      priceLineHtml: '',
      taxRegistrationFooter,
    };
  }

  const line = t(locale, resolveBookingPriceMessageKey(booking), {
    price: formatted,
  });

  return {
    priceLabel: formatted,
    priceLineText: `\n${line}`,
    priceLineHtml: `<br/>${line}`,
    taxRegistrationFooter,
  };
}

export function appendPriceToAppointmentDetail(
  detail: string,
  priceLabel: string,
): string {
  if (!priceLabel) return detail;
  return `${detail} · ${priceLabel}`;
}

export function formatGiftCardBalanceLine(
  balance: number | string,
  currency: string,
  businessSettings: Record<string, unknown> | undefined,
  locale: AppLocale,
): string {
  const formatted =
    formatNotificationMoney(balance, currency, businessSettings, locale) ??
    `${Number(balance).toFixed(2)} ${currency}`;
  return t(locale, 'email.giftCardBalanceLine', { price: formatted });
}

export function formatGiftCardPurchaseLine(
  purchaseAmount: number | string | null | undefined,
  currency: string,
  businessSettings: Record<string, unknown> | undefined,
  locale: AppLocale,
): string {
  if (purchaseAmount == null || purchaseAmount === '') return '';
  const formatted = formatNotificationMoney(
    purchaseAmount,
    currency,
    businessSettings,
    locale,
  );
  if (!formatted) return '';
  return t(locale, 'email.giftCardPurchaseLine', { price: formatted });
}
