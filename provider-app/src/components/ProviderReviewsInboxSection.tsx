import { useState } from 'react';
import {
  IonBadge,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonChip,
  IonSpinner,
  IonText,
} from '@ionic/react';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../services/auth-store';
import { useI18n } from '../i18n';
import {
  fetchProviderReviewsInbox,
  toggleReviewsInboxFilter,
  type ProviderReviewsInboxFilters,
} from '../lib/provider-reviews-inbox';
import { renderStarRating } from '../lib/provider-profile';
import { formatDateDisplay } from '../lib/date-format';
import BookingDetailModal from './BookingDetailModal';

export function ProviderReviewsInboxSection() {
  const { t } = useI18n();
  const { business } = useAuthStore();
  const [filters, setFilters] = useState<ProviderReviewsInboxFilters>({
    last30d: false,
    lowRating: false,
  });
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);

  const inboxQuery = useQuery({
    queryKey: ['provider-reviews-inbox', business?.id, filters],
    queryFn: () => fetchProviderReviewsInbox(business!.id, filters),
    enabled: !!business?.id,
  });

  const inbox = inboxQuery.data;

  return (
    <>
      <IonCard>
        <IonCardHeader>
          <IonCardTitle>{t('provider.reviewsInboxTitle')}</IonCardTitle>
        </IonCardHeader>
        <IonCardContent>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
            <IonChip
              color={filters.last30d ? 'primary' : undefined}
              outline={!filters.last30d}
              onClick={() =>
                setFilters((current) => toggleReviewsInboxFilter(current, 'last30d'))
              }
            >
              {t('provider.reviewsFilterLast30d')}
            </IonChip>
            <IonChip
              color={filters.lowRating ? 'primary' : undefined}
              outline={!filters.lowRating}
              onClick={() =>
                setFilters((current) => toggleReviewsInboxFilter(current, 'lowRating'))
              }
            >
              {t('provider.reviewsFilterLowRating')}
            </IonChip>
          </div>

          {inboxQuery.isLoading ? (
            <IonSpinner />
          ) : inboxQuery.isError ? (
            <IonText color="danger">
              <p className="booking-meta">{t('provider.reviewsInboxLoadFailed')}</p>
            </IonText>
          ) : !inbox?.reviewCount ? (
            <p className="booking-meta">{t('provider.profileNoReviews')}</p>
          ) : (
            <>
              <p style={{ marginTop: 0 }}>
                <span style={{ color: '#f59e0b', letterSpacing: 1 }}>
                  {renderStarRating(inbox.averageRating ?? 0)}
                </span>{' '}
                {t('provider.profileAverageRating', {
                  rating: (inbox.averageRating ?? 0).toFixed(1),
                  count: inbox.reviewCount,
                })}
                {' · '}
                {t('provider.reviewsInboxShowing', { count: inbox.filteredCount })}
              </p>

              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12,
                  maxHeight: 360,
                  overflowY: 'auto',
                  paddingRight: 4,
                }}
              >
                {inbox.reviews.length === 0 ? (
                  <p className="booking-meta">{t('provider.reviewsInboxNoMatches')}</p>
                ) : (
                  inbox.reviews.map((review) => (
                    <div
                      key={review.id}
                      role="button"
                      tabIndex={review.bookingId ? 0 : -1}
                      aria-disabled={!review.bookingId}
                      className="salon-card"
                      style={{
                        display: 'block',
                        padding: 12,
                        textAlign: 'left',
                        width: '100%',
                        border: 'none',
                        background: 'var(--ion-background-color, #fff)',
                        cursor: review.bookingId ? 'pointer' : 'default',
                      }}
                      onClick={() => {
                        if (review.bookingId) setSelectedBookingId(review.bookingId);
                      }}
                      onKeyDown={(e) => {
                        if (!review.bookingId) return;
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          setSelectedBookingId(review.bookingId);
                        }
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          gap: 8,
                          alignItems: 'center',
                        }}
                      >
                        <p style={{ margin: 0, color: '#f59e0b' }}>
                          {renderStarRating(review.rating)}
                        </p>
                        {review.rating <= 3 ? (
                          <IonBadge color="warning">{t('provider.reviewsLowRatingBadge')}</IonBadge>
                        ) : null}
                      </div>
                      {review.comment ? <p style={{ margin: '6px 0' }}>{review.comment}</p> : null}
                      <p className="booking-meta" style={{ margin: 0 }}>
                        {review.customerName ?? t('provider.profileAnonymousReview')} ·{' '}
                        {formatDateDisplay(review.createdAt.slice(0, 10))}
                        {review.bookingId
                          ? ` · ${t('provider.reviewsTapToOpenBooking')}`
                          : ''}
                      </p>
                    </div>
                  ))
                )}
              </div>

              {inbox.postVisitReviewEnabled ? (
                <p className="booking-meta" style={{ marginTop: 12, marginBottom: 0 }}>
                  {t('provider.reviewsRequestHint')}
                </p>
              ) : null}
            </>
          )}
        </IonCardContent>
      </IonCard>

      {business?.id ? (
        <BookingDetailModal
          businessId={business.id}
          bookingId={selectedBookingId}
          onClose={() => setSelectedBookingId(null)}
        />
      ) : null}
    </>
  );
}
