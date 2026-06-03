'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import { PublicHeader } from '@/components/public-booking/public-header';
import { PublicCustomerBookingActions } from '@/components/public-booking/public-customer-booking-actions';
import { PublicCustomerPackageVisitActions } from '@/components/public-booking/public-customer-package-visit-actions';
import {
  getPublicBookingManageContext,
  type PublicBookingManageContext,
  type PublicBusinessProfile,
  type PublicCustomerBookingItem,
} from '@/lib/public-api';
import { usePublicCustomerAuth } from '@/lib/public-customer-auth';
import { bookPath } from '@/lib/tenant-host';
import { formatBookingDateTimeRange, formatDateDisplay, formatScheduleTime } from '@/lib/date-format';
import { useI18n } from '@/i18n';

export function ManageBookingClient({ tenant }: { tenant: PublicBusinessProfile }) {
  const { t, locale } = useI18n();
  const searchParams = useSearchParams();
  const bookingId = searchParams.get('bookingId') ?? '';
  const token = searchParams.get('token') ?? '';
  const primary = tenant.branding.primaryColor || '#7c3aed';
  const { customer, googleEnabled, signInWithGoogle } = usePublicCustomerAuth();
  const [context, setContext] = useState<PublicBookingManageContext | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [signingIn, setSigningIn] = useState(false);
  const [rescheduleNotice, setRescheduleNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!bookingId || !token) {
      setError(t('public.manageBookingInvalidLink'));
      setLoading(false);
      return;
    }
    let cancelled = false;
    void getPublicBookingManageContext(tenant.slug, bookingId, token)
      .then((res) => {
        if (!cancelled) setContext(res);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : t('public.manageBookingInvalidLink'));
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [bookingId, token, tenant.slug, t]);

  async function reloadContext() {
    if (!bookingId || !token) return;
    const res = await getPublicBookingManageContext(tenant.slug, bookingId, token);
    setContext(res);
  }

  const bookingItem: PublicCustomerBookingItem | null = context
    ? {
        id: context.bookingId,
        startTime: context.startTime,
        endTime: context.endTime,
        status: context.status,
        paymentStatus: context.paymentStatus,
        serviceName: context.serviceName,
        employeeName: context.employeeName,
        employeeId: context.employeeId,
        serviceId: context.serviceId,
        canReview: false,
        canCancel: context.canCancel,
        canReschedule: context.canReschedule,
        policyMessage: context.policyMessage,
        rescheduleCount: context.rescheduleCount,
        maxReschedules: context.maxReschedules,
        allowProviderChangeOnReschedule: context.allowProviderChangeOnReschedule,
      }
    : null;

  return (
    <div className="max-w-lg mx-auto min-h-screen pb-24">
      <PublicHeader tenant={tenant} showBack backHref={bookPath(tenant.slug)} />
      <main className="px-4 py-6">
        <h1 className="text-2xl font-bold text-gray-900">{t('public.manageBookingTitle')}</h1>

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
          </div>
        ) : error || !context || !bookingItem ? (
          <p className="text-sm text-red-600 mt-6">{error ?? t('public.manageBookingInvalidLink')}</p>
        ) : (
          <article className="mt-6 bg-white rounded-2xl border border-gray-100 px-4 py-4">
            {context.packageVisit && context.packageVisit.appointments.length > 0 ? (
              <>
                <p className="font-medium text-gray-900">{context.packageVisit.packageName}</p>
                <p className="text-sm text-gray-500 mt-0.5">
                  {t('public.packageVisitAppointmentCount', {
                    count: context.packageVisit.appointments.length,
                  })}
                </p>
              </>
            ) : (
              <>
                <p className="font-medium text-gray-900">{context.serviceName}</p>
                <p className="text-sm text-gray-500 mt-0.5">{context.employeeName}</p>
                <p className="text-sm text-gray-600 mt-2">
                  {formatBookingDateTimeRange(context.startTime, context.endTime, locale)}
                </p>
              </>
            )}

            {!customer && context.customerEmail && (
              <div className="mt-4 rounded-xl bg-gray-50 px-3 py-3 text-sm text-gray-600">
                <p>{t('public.manageBookingSignInPrompt', { email: context.customerEmail })}</p>
                {googleEnabled && (
                  <button
                    type="button"
                    disabled={signingIn}
                    onClick={async () => {
                      setSigningIn(true);
                      try {
                        await signInWithGoogle();
                      } finally {
                        setSigningIn(false);
                      }
                    }}
                    className="mt-3 w-full py-2 rounded-xl text-white text-sm font-semibold disabled:opacity-60"
                    style={{ backgroundColor: primary }}
                  >
                    {signingIn ? t('public.signingIn') : t('public.signInWithGoogle')}
                  </button>
                )}
              </div>
            )}

            {rescheduleNotice && (
              <p className="text-sm text-green-700 mt-3 rounded-lg bg-green-50 px-3 py-2">{rescheduleNotice}</p>
            )}

            {context.packageVisit ? (
              <PublicCustomerPackageVisitActions
                slug={tenant.slug}
                tenant={tenant}
                primary={primary}
                anchorBookingId={context.bookingId}
                packageVisit={context.packageVisit}
                manageToken={token}
                onUpdated={() => void reloadContext()}
                onRescheduled={(previous, next) => {
                  setRescheduleNotice(
                    t('public.reschedulePackageVisitSuccess', {
                      from: `${formatDateDisplay(previous, locale)} ${formatScheduleTime(new Date(previous), locale)}`,
                      to: `${formatDateDisplay(next, locale)} ${formatScheduleTime(new Date(next), locale)}`,
                    }),
                  );
                }}
              />
            ) : (
              bookingItem && (
                <PublicCustomerBookingActions
                  booking={bookingItem}
                  slug={tenant.slug}
                  primary={primary}
                  manageToken={token}
                  onUpdated={() => void reloadContext()}
                  onRescheduled={(previous, next) => {
                    setRescheduleNotice(
                      t('public.rescheduleSuccessDetail', {
                        from: `${formatDateDisplay(previous, locale)} ${formatScheduleTime(new Date(previous))}`,
                        to: `${formatDateDisplay(next, locale)} ${formatScheduleTime(new Date(next))}`,
                      }),
                    );
                  }}
                />
              )
            )}
          </article>
        )}

        <Link
          href={bookPath(tenant.slug, '/account')}
          className="inline-block mt-6 text-sm font-medium"
          style={{ color: primary }}
        >
          {t('public.myBookings')}
        </Link>
      </main>
    </div>
  );
}
