'use client';

import Link from 'next/link';
import { usePublicCustomerAuth } from '@/lib/public-customer-auth';
import { bookPath } from '@/lib/tenant-host';
import { useI18n } from '@/i18n';

export function BookingSuccessPanel({
  slug,
  primary,
  bookingId,
  manageToken,
  customerEmail,
  cashDueLabel,
}: {
  slug: string;
  primary: string;
  bookingId?: string;
  manageToken?: string;
  customerEmail?: string;
  cashDueLabel?: string | null;
}) {
  const { t } = useI18n();
  const { customer } = usePublicCustomerAuth();

  const manageHref =
    bookingId && manageToken
      ? bookPath(slug, `/manage?bookingId=${encodeURIComponent(bookingId)}&token=${encodeURIComponent(manageToken)}`)
      : bookPath(slug, '/account');

  return (
    <div className="flex flex-col items-center gap-3 mt-6">
      {cashDueLabel && (
        <p className="text-sm text-gray-600 max-w-sm">{cashDueLabel}</p>
      )}
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Link
          href={manageHref}
          className="inline-block px-5 py-2.5 rounded-2xl text-white font-semibold text-sm"
          style={{ backgroundColor: primary }}
        >
          {t('public.manageBooking')}
        </Link>
        <Link
          href={bookPath(slug)}
          className="inline-block px-5 py-2.5 rounded-2xl border border-gray-200 text-gray-700 font-semibold text-sm hover:bg-gray-50"
        >
          {t('public.bookAnother')}
        </Link>
      </div>
      {!customer && customerEmail && (
        <p className="text-xs text-gray-500 max-w-sm text-center">
          {t('public.manageBookingEmailHint', { email: customerEmail })}
        </p>
      )}
    </div>
  );
}
