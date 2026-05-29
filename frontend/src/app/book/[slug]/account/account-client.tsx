'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Loader2, LogOut, Star } from 'lucide-react';
import { PublicHeader } from '@/components/public-booking/public-header';
import {
  getPublicCustomerBookings,
  type PublicBusinessProfile,
  type PublicCustomerBookingItem,
} from '@/lib/public-api';
import { usePublicCustomerAuth } from '@/lib/public-customer-auth';
import { isPublicGoogleSignInCancelled, isPublicGoogleSignInRedirecting } from '@/lib/public-google-auth';
import { bookPath } from '@/lib/tenant-host';
import { formatDateDisplay, formatScheduleTime } from '@/lib/date-format';
import { useI18n } from '@/i18n';

function bookingStatusLabel(status: string, t: (key: string) => string) {
  switch (status) {
    case 'completed':
      return t('public.bookingStatusCompleted');
    case 'cancelled':
      return t('public.bookingStatusCancelled');
    case 'confirmed':
      return t('public.bookingStatusConfirmed');
    default:
      return status;
  }
}

function BookingRow({
  booking,
  slug,
  primary,
  t,
}: {
  booking: PublicCustomerBookingItem;
  slug: string;
  primary: string;
  t: (key: string) => string;
}) {
  const start = new Date(booking.startTime);
  const end = new Date(booking.endTime);

  return (
    <article className="bg-white rounded-2xl border border-gray-100 px-4 py-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-medium text-gray-900">{booking.serviceName}</p>
          <p className="text-sm text-gray-500 mt-0.5">{booking.employeeName}</p>
          <p className="text-sm text-gray-600 mt-2">
            {formatDateDisplay(start)} · {formatScheduleTime(start)} – {formatScheduleTime(end)}
          </p>
        </div>
        <span className="text-xs font-medium text-gray-500 shrink-0">
          {bookingStatusLabel(booking.status, t)}
        </span>
      </div>

      {booking.canReview && (
        <Link
          href={bookPath(slug, `/providers/${booking.employeeId}`)}
          className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium"
          style={{ color: primary }}
        >
          <Star className="w-4 h-4" />
          {t('public.leaveReview')}
        </Link>
      )}
    </article>
  );
}

export function AccountClient({ tenant }: { tenant: PublicBusinessProfile }) {
  const { t } = useI18n();
  const primary = tenant.branding.primaryColor || '#7c3aed';
  const { customer, loading, googleEnabled, signInWithGoogle, signOut } = usePublicCustomerAuth();
  const [bookings, setBookings] = useState<PublicCustomerBookingItem[]>([]);
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [bookingsError, setBookingsError] = useState<string | null>(null);
  const [signingIn, setSigningIn] = useState(false);

  useEffect(() => {
    if (!customer) {
      setBookings([]);
      return;
    }

    let cancelled = false;
    setBookingsLoading(true);
    setBookingsError(null);

    void getPublicCustomerBookings(tenant.slug)
      .then((res) => {
        if (!cancelled) setBookings(res.bookings);
      })
      .catch((err) => {
        if (!cancelled) {
          setBookingsError(err instanceof Error ? err.message : t('public.bookingsLoadFailed'));
        }
      })
      .finally(() => {
        if (!cancelled) setBookingsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [customer, tenant.slug, t]);

  async function handleSignIn() {
    setSigningIn(true);
    try {
      await signInWithGoogle();
    } catch (err) {
      if (!isPublicGoogleSignInCancelled(err) && !isPublicGoogleSignInRedirecting(err)) {
        console.error('Google sign-in failed', err);
      }
    } finally {
      setSigningIn(false);
    }
  }

  return (
    <div className="max-w-lg mx-auto min-h-screen pb-24">
      <PublicHeader tenant={tenant} showBack backHref={bookPath(tenant.slug)} />

      <main className="px-4 py-6">
        <h1 className="text-2xl font-bold text-gray-900">{t('public.accountTitle')}</h1>

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
          </div>
        ) : !customer ? (
          <div className="mt-8 bg-white rounded-2xl border border-gray-100 px-5 py-8 text-center">
            <p className="text-gray-600">{t('public.accountSignInPrompt')}</p>
            {googleEnabled ? (
              <button
                type="button"
                onClick={() => void handleSignIn()}
                disabled={signingIn}
                className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 px-5 py-3 text-sm font-medium text-gray-800 hover:bg-gray-50 disabled:opacity-50"
              >
                {signingIn ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="" className="w-5 h-5" />
                )}
                {signingIn ? t('public.signingIn') : t('public.signInWithGoogle')}
              </button>
            ) : (
              <p className="text-sm text-amber-700 mt-4">{t('public.googleSignInUnavailable')}</p>
            )}
          </div>
        ) : (
          <>
            <div className="mt-6 bg-white rounded-2xl border border-gray-100 px-5 py-4">
              <p className="font-medium text-gray-900">{customer.name}</p>
              {customer.email && <p className="text-sm text-gray-500 mt-1">{customer.email}</p>}
              {customer.phone && <p className="text-sm text-gray-500 mt-0.5">{customer.phone}</p>}
              <button
                type="button"
                onClick={signOut}
                className="mt-4 inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
              >
                <LogOut className="w-4 h-4" />
                {t('public.signOut')}
              </button>
            </div>

            <h2 className="text-lg font-semibold text-gray-900 mt-8 mb-4">{t('public.myBookings')}</h2>

            {bookingsLoading ? (
              <div className="flex justify-center py-10">
                <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
              </div>
            ) : bookingsError ? (
              <p className="text-sm text-red-600">{bookingsError}</p>
            ) : bookings.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-100 px-5 py-8 text-center">
                <p className="text-gray-500">{t('public.noBookingsYet')}</p>
                <Link
                  href={bookPath(tenant.slug)}
                  className="inline-block mt-4 px-5 py-2.5 rounded-xl text-white text-sm font-semibold"
                  style={{ backgroundColor: primary }}
                >
                  {t('public.bookAppointment')}
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {bookings.map((booking) => (
                  <BookingRow
                    key={booking.id}
                    booking={booking}
                    slug={tenant.slug}
                    primary={primary}
                    t={t}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
