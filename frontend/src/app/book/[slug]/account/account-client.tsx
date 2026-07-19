'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Loader2, LogOut, Star } from 'lucide-react';
import { PublicHeader } from '@/components/public-booking/public-header';
import {
  getPublicCustomerBookings,
  getPublicCustomerClinicTestResults,
  getPublicCustomerClinicLabBookingRequests,
  getPublicCustomerClinicDocuments,
  getPublicCustomerGiftCards,
  getPublicCustomerLoyalty,
  getPublicCustomerSubscriptions,
  exportPublicCustomerData,
  deletePublicCustomerData,
  formatPrice,
  formatPublicMoney,
  type PublicBusinessProfile,
  type PublicCustomerBookingItem,
  type PublicCustomerLoyalty,
  type PublicCustomerReleasedClinicResult,
  type PublicCustomerReleasedClinicDocument,
  type PublicCustomerSubscription,
  type PublicGiftCardOrder,
  type PublicGiftCardRedeemed,
} from '@/lib/public-api';
import { PublicSubscriptionsSection } from '@/components/public-booking/public-subscriptions-section';
import { PublicGiftCardsSection } from '@/components/public-booking/public-gift-cards-section';
import { PublicGiftCardsRedeemedSection } from '@/components/public-booking/public-gift-cards-redeemed-section';
import { PublicGiftCardClaimSection } from '@/components/public-booking/public-gift-card-claim-section';
import { PublicMyResultsSection } from '@/components/public-booking/public-my-results-section';
import { PublicMyLabBookingRequestsSection } from '@/components/public-booking/public-my-lab-booking-requests-section';
import { unwrapPublicClinicLabBookingRequests } from '@/lib/clinic-lab-booking-request';
import type { PublicClinicLabBookingRequest } from '@/lib/clinic-lab-booking-request';
import { PublicMyDocumentsSection } from '@/components/public-booking/public-my-documents-section';
import { PublicPatientAlertsBanner } from '@/components/public-booking/public-patient-alerts-banner';
import { PublicCustomerBookingActions } from '@/components/public-booking/public-customer-booking-actions';
import { PublicCustomerPackageVisitActions } from '@/components/public-booking/public-customer-package-visit-actions';
import { PublicCustomerMultiServiceVisitActions } from '@/components/public-booking/public-customer-multi-service-visit-actions';
import { groupBookingsForAccount } from '@/lib/group-package-bookings';
import { usePublicCustomerAuth } from '@/lib/public-customer-auth';
import { isPublicGoogleSignInCancelled, isPublicGoogleSignInRedirecting } from '@/lib/public-google-auth';
import { bookPath } from '@/lib/tenant-host';
import { formatBookingDateTimeRange } from '@/lib/date-format';
import { shouldShowPatientResultsTab } from '@/lib/clinic-service';
import { useI18n } from '@/i18n';
import { confirmDialog } from '@/lib/app-dialog';
import { PublicAccountGrowthSection } from '@/components/public-booking/public-account-growth-section';

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
  const start = new Date(visit.appointments[0]?.startTime ?? '1970-01-01T00:00:00.000Z');
  const end = new Date(
    visit.appointments[visit.appointments.length - 1]?.endTime ?? visit.appointments[0]?.startTime ?? '1970-01-01T00:00:00.000Z',
  );
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
            {formatBookingDateTimeRange(start, end, locale)}
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

function MultiServiceVisitRow({
  visit,
  slug,
  tenant,
  primary,
  t,
  locale,
  onUpdated,
}: {
  visit: ReturnType<typeof groupBookingsForAccount>['multiServiceGroups'][number];
  slug: string;
  tenant: PublicBusinessProfile;
  primary: string;
  t: (key: string, params?: Record<string, string | number>) => string;
  locale: string;
  onUpdated: () => void;
}) {
  const start = new Date(visit.appointments[0]?.startTime ?? '1970-01-01T00:00:00.000Z');
  const end = new Date(
    visit.appointments[visit.appointments.length - 1]?.endTime ??
      visit.appointments[0]?.startTime ??
      '1970-01-01T00:00:00.000Z',
  );
  const allCancelled = visit.appointments.every((a) => a.status === 'cancelled');

  return (
    <article className="bg-white rounded-2xl border border-gray-100 px-4 py-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-medium text-gray-900">{visit.label}</p>
          <p className="text-sm text-gray-500 mt-0.5">
            {t('public.multiServiceVisitAppointmentCount', { count: visit.appointments.length })}
          </p>
          <p className="text-sm text-gray-600 mt-2">
            {formatBookingDateTimeRange(start, end, locale)}
          </p>
        </div>
        {allCancelled && (
          <span className="text-xs font-medium text-gray-500 shrink-0">
            {t('public.bookingStatusCancelled')}
          </span>
        )}
      </div>
      <PublicCustomerMultiServiceVisitActions
        slug={slug}
        tenant={tenant}
        primary={primary}
        anchorBookingId={visit.anchorBookingId}
        visit={visit}
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
            {formatBookingDateTimeRange(start, end, locale)}
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
  const [clinicResults, setClinicResults] = useState<PublicCustomerReleasedClinicResult[]>([]);
  const [clinicResultsError, setClinicResultsError] = useState<string | null>(null);
  const [labBookingRequests, setLabBookingRequests] = useState<PublicClinicLabBookingRequest[]>([]);
  const [labBookingRequestsError, setLabBookingRequestsError] = useState<string | null>(null);
  const [clinicDocuments, setClinicDocuments] = useState<PublicCustomerReleasedClinicDocument[]>([]);
  const [clinicDocumentsError, setClinicDocumentsError] = useState<string | null>(null);
  const showMyResultsTab = shouldShowPatientResultsTab(tenant.businessType);

  useEffect(() => {
    if (!showMyResultsTab || typeof window === 'undefined') return;
    const section = new URLSearchParams(window.location.search).get('section');
    if (section === 'results') {
      document.getElementById('my-results')?.scrollIntoView({ behavior: 'smooth' });
    }
    if (section === 'lab-requests') {
      document.getElementById('my-lab-requests')?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [showMyResultsTab, customer]);

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
      queueMicrotask(() => {
        setBookings([]);
        setLoyalty(null);
        setSubscriptions([]);
        setGiftCardOrders([]);
        setRedeemedGiftCards([]);
        setClinicResults([]);
        setClinicResultsError(null);
        setLabBookingRequests([]);
        setLabBookingRequestsError(null);
        setClinicDocuments([]);
        setClinicDocumentsError(null);
      });
      return;
    }

    let cancelled = false;
    queueMicrotask(() => {
      setBookingsLoading(true);
      setBookingsError(null);
    });

    void Promise.all([
      getPublicCustomerBookings(tenant.slug),
      getPublicCustomerLoyalty(tenant.slug).catch(() => null),
      getPublicCustomerSubscriptions(tenant.slug).catch(() => []),
      getPublicCustomerGiftCards(tenant.slug).catch(() => ({ orders: [], redeemed: [] })),
      showMyResultsTab
        ? getPublicCustomerClinicTestResults(tenant.slug).catch((err) => {
            if (!cancelled) {
              setClinicResultsError(
                err instanceof Error ? err.message : t('public.myResults.loadFailed'),
              );
            }
            return [];
          })
        : Promise.resolve([]),
      showMyResultsTab
        ? getPublicCustomerClinicDocuments(tenant.slug).catch((err) => {
            if (!cancelled) {
              setClinicDocumentsError(
                err instanceof Error ? err.message : t('public.myDocuments.loadFailed'),
              );
            }
            return [];
          })
        : Promise.resolve([]),
      showMyResultsTab
        ? getPublicCustomerClinicLabBookingRequests(tenant.slug)
            .then((res) => unwrapPublicClinicLabBookingRequests(res))
            .catch((err) => {
              if (!cancelled) {
                setLabBookingRequestsError(
                  err instanceof Error ? err.message : t('public.myLabRequests.loadFailed'),
                );
              }
              return [];
            })
        : Promise.resolve([]),
    ])
      .then(([bookingsRes, loyaltyRes, subsRes, giftCardsRes, resultsRes, documentsRes, labRequestsRes]) => {
        if (!cancelled) {
          setBookings(bookingsRes.bookings);
          setLoyalty(loyaltyRes);
          setSubscriptions(subsRes);
          setGiftCardOrders(giftCardsRes.orders);
          setRedeemedGiftCards(giftCardsRes.redeemed);
          setClinicResults(resultsRes);
          setLabBookingRequests(labRequestsRes);
          setClinicResultsError(null);
          setClinicDocuments(documentsRes);
          setClinicDocumentsError(null);
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
  }, [customer, tenant.slug, t, showMyResultsTab]);

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
                    if (!(await confirmDialog({ message: t('public.dataDeleteConfirm'), destructive: true }))) return;
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

            <PublicAccountGrowthSection
              slug={tenant.slug}
              tenant={tenant}
              customerId={customer.id}
            />

            {loyalty && loyalty.pointsBalance > 0 && (
              <div className="mt-4 bg-white rounded-2xl border border-gray-100 px-5 py-4">
                <p className="text-sm font-medium text-gray-900">{t('public.loyaltyPoints')}</p>
                <p className="text-sm text-gray-600 mt-1">
                  {t('public.loyaltyBalance')
                    .replace('{points}', String(loyalty.pointsBalance))
                    .replace(
                      '{value}',
                      formatPublicMoney(loyalty.pointsValue, null, tenant.currency, locale),
                    )}
                </p>
              </div>
            )}

            {showMyResultsTab ? (
              <>
                <div id="my-intake" />
                <PublicPatientAlertsBanner
                  slug={tenant.slug}
                  onViewAlert={(_alert, anchorId) => {
                    document
                      .getElementById(anchorId)
                      ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }}
                />
              </>
            ) : null}

            {showMyResultsTab ? (
              <div id="my-lab-requests">
                <h2 className="text-lg font-semibold text-gray-900 mt-8 mb-4">
                  {t('public.myLabRequests.title')}
                </h2>
                <PublicMyLabBookingRequestsSection
                  requests={labBookingRequests}
                  loading={bookingsLoading}
                  error={labBookingRequestsError}
                  locale={locale}
                />
              </div>
            ) : null}

            {showMyResultsTab ? (
              <div id="my-results">
                <h2 className="text-lg font-semibold text-gray-900 mt-8 mb-4">
                  {t('public.myResults.title')}
                </h2>
                <PublicMyResultsSection
                  results={clinicResults}
                  loading={bookingsLoading}
                  error={clinicResultsError}
                  locale={locale}
                />
              </div>
            ) : null}

            {showMyResultsTab ? (
              <div id="my-documents">
                <h2 className="text-lg font-semibold text-gray-900 mt-8 mb-4">
                  {t('public.myDocuments.title')}
                </h2>
                <PublicMyDocumentsSection
                  documents={clinicDocuments}
                  loading={bookingsLoading}
                  error={clinicDocumentsError}
                  locale={locale}
                />
              </div>
            ) : null}

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

            <div id="my-bookings">
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
                  const { standalone, packageGroups, multiServiceGroups } =
                    groupBookingsForAccount(bookings);
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
                      {multiServiceGroups.map((visit) => (
                        <MultiServiceVisitRow
                          key={visit.multiServiceGroupId}
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
            </div>
          </>
        )}
      </main>
    </div>
  );
}
