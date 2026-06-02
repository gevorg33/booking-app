'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Loader2, LogOut, Star } from 'lucide-react';
import { PublicHeader } from '@/components/public-booking/public-header';
import {
  getPublicCustomerBookings,
  getPublicCustomerGiftCards,
  getPublicCustomerLoyalty,
  getPublicCustomerSubscriptions,
  exportPublicCustomerData,
  deletePublicCustomerData,
  formatPrice,
  type PublicBusinessProfile,
  type PublicCustomerBookingItem,
  type PublicCustomerLoyalty,
  type PublicCustomerSubscription,
  type PublicGiftCardOrder,
  type PublicGiftCardRedeemed,
} from '@/lib/public-api';
import { PublicSubscriptionsSection } from '@/components/public-booking/public-subscriptions-section';
import { PublicGiftCardsSection } from '@/components/public-booking/public-gift-cards-section';
import { PublicGiftCardsRedeemedSection } from '@/components/public-booking/public-gift-cards-redeemed-section';
import { PublicGiftCardClaimSection } from '@/components/public-booking/public-gift-card-claim-section';
import { PublicCustomerBookingActions } from '@/components/public-booking/public-customer-booking-actions';
import { PublicCustomerPackageVisitActions } from '@/components/public-booking/public-customer-package-visit-actions';
import { groupBookingsForAccount } from '@/lib/group-package-bookings';
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

function PackageVisitRow({
  visit,
  slug,
  tenant,
  primary,
  t,
  locale,
  onUpdated,
}: {
  visit: ReturnType<typeof groupBookingsForAccount>['packageGroups'][number];
  slug: string;
  tenant: PublicBusinessProfile;
  primary: string;
  t: (key: string, params?: Record<string, string | number>) => string;
  locale: string;
  onUpdated: () => void;
}) {
  const start = new Date(visit.appointments[0]?.startTime ?? Date.now());
  const end = new Date(visit.appointments[visit.appointments.length - 1]?.endTime ?? Date.now());
  const allCancelled = visit.appointments.every((a) => a.status === 'cancelled');

  return (
    <article className="bg-white rounded-2xl border border-gray-100 px-4 py-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-medium text-gray-900">{visit.packageName}</p>
          <p className="text-sm text-gray-500 mt-0.5">
            {t('public.packageVisitAppointmentCount', { count: visit.appointments.length })}
          </p>
          <p className="text-sm text-gray-600 mt-2">
            {formatDateDisplay(start, locale)} · {formatScheduleTime(start)} – {formatScheduleTime(end)}
          </p>
        </div>
        {allCancelled && (
          <span className="text-xs font-medium text-gray-500 shrink-0">
            {t('public.bookingStatusCancelled')}
          </span>
        )}
      </div>
      <PublicCustomerPackageVisitActions
        slug={slug}
        tenant={tenant}
        primary={primary}
        anchorBookingId={visit.anchorBookingId}
        packageVisit={visit}
        onUpdated={onUpdated}
      />
    </article>
  );
}

function BookingRow({
  booking,
  slug,
  primary,
  t,
  locale,
  onUpdated,
}: {
  booking: PublicCustomerBookingItem;
  slug: string;
  primary: string;
  t: (key: string, params?: Record<string, string | number>) => string;
  locale: string;
  onUpdated: () => void;
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
            {formatDateDisplay(start, locale)} · {formatScheduleTime(start)} – {formatScheduleTime(end)}
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

      <PublicCustomerBookingActions
        booking={booking}
        slug={slug}
        primary={primary}
        onUpdated={onUpdated}
      />
    </article>
  );
}

export function AccountClient({ tenant }: { tenant: PublicBusinessProfile }) {
  const { t, locale } = useI18n();
  const primary = tenant.branding.primaryColor || '#7c3aed';
  const { customer, loading, googleEnabled, signInWithGoogle, signOut } = usePublicCustomerAuth();
  const [bookings, setBookings] = useState<PublicCustomerBookingItem[]>([]);
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [bookingsError, setBookingsError] = useState<string | null>(null);
  const [signingIn, setSigningIn] = useState(false);
  const [privacyLoading, setPrivacyLoading] = useState<'export' | 'delete' | null>(null);
  const [privacyMessage, setPrivacyMessage] = useState<string | null>(null);
  const [loyalty, setLoyalty] = useState<PublicCustomerLoyalty | null>(null);
  const [subscriptions, setSubscriptions] = useState<PublicCustomerSubscription[]>([]);
  const [giftCardOrders, setGiftCardOrders] = useState<PublicGiftCardOrder[]>([]);
  const [redeemedGiftCards, setRedeemedGiftCards] = useState<PublicGiftCardRedeemed[]>([]);

  function reloadGiftCardAccount() {
    return getPublicCustomerGiftCards(tenant.slug)
      .then((res) => {
        setGiftCardOrders(res.orders);
        setRedeemedGiftCards(res.redeemed);
      })
      .catch(() => {});
  }

  async function reloadBookings() {
    if (!customer) return;
    setBookingsLoading(true);
    setBookingsError(null);
    try {
      const bookingsRes = await getPublicCustomerBookings(tenant.slug);
      setBookings(bookingsRes.bookings);
    } catch (err) {
      setBookingsError(err instanceof Error ? err.message : t('public.bookingsLoadFailed'));
    } finally {
      setBookingsLoading(false);
    }
  }

  useEffect(() => {
    if (!customer) {
      setBookings([]);
      setLoyalty(null);
      setSubscriptions([]);
      setGiftCardOrders([]);
      setRedeemedGiftCards([]);
      return;
    }

    let cancelled = false;
    setBookingsLoading(true);
    setBookingsError(null);

    void Promise.all([
      getPublicCustomerBookings(tenant.slug),
      getPublicCustomerLoyalty(tenant.slug).catch(() => null),
      getPublicCustomerSubscriptions(tenant.slug).catch(() => []),
      getPublicCustomerGiftCards(tenant.slug).catch(() => ({ orders: [], redeemed: [] })),
    ])
      .then(([bookingsRes, loyaltyRes, subsRes, giftCardsRes]) => {
        if (!cancelled) {
          setBookings(bookingsRes.bookings);
          setLoyalty(loyaltyRes);
          setSubscriptions(subsRes);
          setGiftCardOrders(giftCardsRes.orders);
          setRedeemedGiftCards(giftCardsRes.redeemed);
        }
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

            <div className="mt-4 bg-white rounded-2xl border border-gray-100 px-5 py-4 space-y-3">
              <p className="text-sm font-medium text-gray-900">{t('public.privacyConsent')}</p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={privacyLoading !== null}
                  className="text-sm px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50"
                  onClick={async () => {
                    setPrivacyLoading('export');
                    setPrivacyMessage(null);
                    try {
                      const data = await exportPublicCustomerData(tenant.slug);
                      const blob = new Blob([JSON.stringify(data, null, 2)], {
                        type: 'application/json',
                      });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `my-data-${tenant.slug}.json`;
                      a.click();
                      URL.revokeObjectURL(url);
                      setPrivacyMessage(t('public.dataExportSuccess'));
                    } catch {
                      setPrivacyMessage(t('common.errorGeneric'));
                    } finally {
                      setPrivacyLoading(null);
                    }
                  }}
                >
                  {privacyLoading === 'export' ? t('common.loading') : t('public.exportMyData')}
                </button>
                <button
                  type="button"
                  disabled={privacyLoading !== null}
                  className="text-sm px-3 py-1.5 rounded-lg border border-red-200 text-red-700 hover:bg-red-50 disabled:opacity-50"
                  onClick={async () => {
                    if (!window.confirm(t('public.dataDeleteConfirm'))) return;
                    setPrivacyLoading('delete');
                    setPrivacyMessage(null);
                    try {
                      await deletePublicCustomerData(tenant.slug);
                      setPrivacyMessage(t('public.dataDeleteSuccess'));
                      signOut();
                    } catch {
                      setPrivacyMessage(t('common.errorGeneric'));
                    } finally {
                      setPrivacyLoading(null);
                    }
                  }}
                >
                  {privacyLoading === 'delete' ? t('common.loading') : t('public.deleteMyData')}
                </button>
              </div>
              {privacyMessage && <p className="text-xs text-gray-500">{privacyMessage}</p>}
            </div>

            {loyalty && loyalty.pointsBalance > 0 && (
              <div className="mt-4 bg-white rounded-2xl border border-gray-100 px-5 py-4">
                <p className="text-sm font-medium text-gray-900">{t('public.loyaltyPoints')}</p>
                <p className="text-sm text-gray-600 mt-1">
                  {t('public.loyaltyBalance')
                    .replace('{points}', String(loyalty.pointsBalance))
                    .replace('{value}', formatPrice(loyalty.pointsValue, 'USD', locale))}
                </p>
              </div>
            )}

            <h2 className="text-lg font-semibold text-gray-900 mt-8 mb-4">My subscriptions</h2>
            <PublicSubscriptionsSection
              slug={tenant.slug}
              subscriptions={subscriptions}
              primary={primary}
              locale={locale}
            />

            <PublicGiftCardClaimSection
              slug={tenant.slug}
              onClaimed={() => {
                void reloadGiftCardAccount();
              }}
            />

            <h2 className="text-lg font-semibold text-gray-900 mt-8 mb-4">
              {t('public.giftCards.myRedeemedGiftCards')}
            </h2>
            <PublicGiftCardsRedeemedSection
              slug={tenant.slug}
              redeemed={redeemedGiftCards}
              locale={locale}
            />

            <h2 className="text-lg font-semibold text-gray-900 mt-8 mb-4">
              {t('public.giftCards.myOrderedGiftCards')}
            </h2>
            <PublicGiftCardsSection
              slug={tenant.slug}
              orders={giftCardOrders}
              locale={locale}
              onOrderUpdated={(order) =>
                setGiftCardOrders((prev) =>
                  prev.map((item) => (item.id === order.id ? order : item)),
                )
              }
            />

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
                {(() => {
                  const { standalone, packageGroups } = groupBookingsForAccount(bookings);
                  return (
                    <>
                      {packageGroups.map((visit) => (
                        <PackageVisitRow
                          key={visit.packagePurchaseId}
                          visit={visit}
                          slug={tenant.slug}
                          tenant={tenant}
                          primary={primary}
                          t={t}
                          locale={locale}
                          onUpdated={() => void reloadBookings()}
                        />
                      ))}
                      {standalone.map((booking) => (
                        <BookingRow
                          key={booking.id}
                          booking={booking}
                          slug={tenant.slug}
                          primary={primary}
                          t={t}
                          locale={locale}
                          onUpdated={() => void reloadBookings()}
                        />
                      ))}
                    </>
                  );
                })()}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
