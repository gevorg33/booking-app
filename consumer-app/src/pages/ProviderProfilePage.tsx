import {
  IonBackButton,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonItem,
  IonLabel,
  IonList,
  IonPage,
  IonSpinner,
  IonTextarea,
  IonTitle,
  IonToolbar,
} from '@ionic/react';
import { useEffect, useMemo, useState } from 'react';
import { useHistory, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useTenantBootstrap } from '../hooks/use-tenant-bootstrap.js';
import { useConsumerCopy } from '../hooks/use-consumer-copy.js';
import { ConsumerProviderReviewSummary } from '../components/ConsumerProviderReviewSummary.js';
import { buildSalonPath } from '../lib/deep-link.js';
import { getCustomerToken } from '../lib/customer-auth.js';
import { formatFriendlyNetworkError } from '../lib/consumer-network-ux.util.js';
import { formatScheduleTime, resolveNearestSlotDateLabel } from '../lib/date-format.js';
import { applyOptimisticReviewSummary } from '../lib/provider-review-summary.util.js';
import {
  canLoadMoreProviderReviews,
  mergeProviderReviewItems,
  nextProviderReviewsPage,
} from '../lib/provider-reviews-pagination.util.js';
import type { PublicProviderReview } from '../lib/types.js';
import { buildProfessionalServicesPath } from '../lib/provider-booking.util.js';
import {
  fetchPublicProviderReviews,
  fetchPublicProviders,
  submitPublicProviderReview,
} from '../services/public-api.js';

function formatReviewDate(iso: string): string {
  const parsed = Date.parse(iso);
  if (Number.isNaN(parsed)) return iso;
  return new Date(parsed).toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export default function ProviderProfilePage() {
  const history = useHistory();
  const queryClient = useQueryClient();
  const { employeeId } = useParams<{ slug: string; employeeId: string }>();
  const { slug, profile, loading, error } = useTenantBootstrap();
  const { copy, locale } = useConsumerCopy(slug ?? '', profile ?? { locale: 'en' });

  const providersQuery = useQuery({
    queryKey: ['public-providers', slug, locale],
    queryFn: () => fetchPublicProviders(slug!, { locale }),
    enabled: Boolean(slug),
  });

  const reviewsQuery = useQuery({
    queryKey: ['public-provider-reviews', slug, employeeId],
    queryFn: () => fetchPublicProviderReviews(slug!, employeeId!),
    enabled: Boolean(slug && employeeId),
  });

  const provider = useMemo(
    () => providersQuery.data?.find((entry) => entry.id === employeeId),
    [employeeId, providersQuery.data],
  );

  const [selectedStartTime, setSelectedStartTime] = useState<string | null>(null);
  const [reviewItems, setReviewItems] = useState<PublicProviderReview[]>([]);
  const [reviewCount, setReviewCount] = useState(0);
  const [averageRating, setAverageRating] = useState<number | null>(null);
  const [reviewsPage, setReviewsPage] = useState(1);
  const [reviewsLoadingMore, setReviewsLoadingMore] = useState(false);
  const [reviewsLoadMoreMessage, setReviewsLoadMoreMessage] = useState('');
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewMessage, setReviewMessage] = useState('');

  useEffect(() => {
    if (!provider?.slots.length) return;
    setSelectedStartTime((prev) => prev ?? provider.slots[0]?.startTime ?? null);
  }, [provider]);

  useEffect(() => {
    if (!reviewsQuery.data) return;
    // Reset to the first page whenever the query refreshes (initial load / invalidate).
    setReviewItems(reviewsQuery.data.items);
    setReviewCount(reviewsQuery.data.reviewCount);
    setAverageRating(reviewsQuery.data.averageRating);
    setReviewsPage(reviewsQuery.data.page);
    setReviewsLoadMoreMessage('');
  }, [reviewsQuery.data]);

  const canLoadMoreReviews = canLoadMoreProviderReviews({
    loadedCount: reviewItems.length,
    reviewCount,
  });

  const loadMoreReviews = async () => {
    if (!slug || !employeeId || reviewsLoadingMore || !canLoadMoreReviews) return;
    setReviewsLoadingMore(true);
    setReviewsLoadMoreMessage('');
    try {
      const page = await fetchPublicProviderReviews(
        slug,
        employeeId,
        nextProviderReviewsPage(reviewsPage),
      );
      setReviewItems((prev) => mergeProviderReviewItems(prev, page.items));
      setReviewCount(page.reviewCount);
      setAverageRating(page.averageRating);
      setReviewsPage(page.page);
    } catch (err: unknown) {
      setReviewsLoadMoreMessage(
        formatFriendlyNetworkError(err, copy.providerReviewsLoadMoreFailed),
      );
    } finally {
      setReviewsLoadingMore(false);
    }
  };

  const authed = slug ? !!getCustomerToken(slug) : false;
  const primary = profile?.branding.primaryColor || '#7c3aed';
  const nearestDateText = provider
    ? resolveNearestSlotDateLabel(provider, copy.todayInline)
    : null;

  const onChoose = () => {
    if (!slug || !employeeId || !selectedStartTime || !provider) return;
    history.push(
      buildProfessionalServicesPath(slug, employeeId, selectedStartTime, {
        employeeName: provider.name,
      }),
    );
  };

  const submitReview = async () => {
    if (!slug || !employeeId || rating < 1) {
      setReviewMessage(copy.reviewRatingRequired);
      return;
    }
    if (!authed) {
      setReviewMessage(copy.reviewSignInRequired);
      history.push(buildSalonPath(slug, '/login'));
      return;
    }
    setReviewSubmitting(true);
    setReviewMessage('');
    try {
      const review = await submitPublicProviderReview(slug, employeeId, {
        rating,
        comment: comment.trim() || undefined,
      });
      // e2e-bug.26 — compute from plain locals; never nest setAverageRating inside setReviewCount.
      const summary = applyOptimisticReviewSummary({
        currentAverage: averageRating,
        previousCount: reviewCount,
        newRating: review.rating,
      });
      setReviewItems((prev) => [review, ...prev]);
      setReviewCount(summary.reviewCount);
      setAverageRating(summary.averageRating);
      void queryClient.invalidateQueries({
        queryKey: ['public-provider-reviews', slug, employeeId],
      });
      setRating(0);
      setComment('');
      setReviewMessage(copy.reviewSubmitted);
    } catch (err: unknown) {
      setReviewMessage(
        formatFriendlyNetworkError(err, copy.assistantErrorGeneric),
      );
    } finally {
      setReviewSubmitting(false);
    }
  };

  if (loading || providersQuery.isLoading || reviewsQuery.isLoading) {
    return (
      <IonPage>
        <IonContent className="ion-padding ion-text-center">
          <IonSpinner name="crescent" style={{ marginTop: '40vh' }} />
        </IonContent>
      </IonPage>
    );
  }

  if (error || !profile || !slug || !employeeId || !provider) {
    return (
      <IonPage>
        <IonContent className="ion-padding">
          <p>{error || copy.providerNotFound}</p>
        </IonContent>
      </IonPage>
    );
  }

  const hasReviews = reviewCount > 0 && averageRating != null;

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref={buildSalonPath(slug, '/professionals')}  text={copy.guidePageBack} />
          </IonButtons>
          <IonTitle>{provider.name}</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          {provider.avatarUrl ? (
            <img
              src={provider.avatarUrl}
              alt=""
              style={{
                width: 112,
                height: 112,
                borderRadius: '50%',
                objectFit: 'cover',
              }}
            />
          ) : (
            <div
              style={{
                width: 112,
                height: 112,
                borderRadius: '50%',
                margin: '0 auto',
                background: primary,
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 40,
                fontWeight: 600,
              }}
            >
              {provider.name.charAt(0)}
            </div>
          )}
          <h1 style={{ fontSize: 24, fontWeight: 700, marginTop: 16 }}>{provider.name}</h1>
          {provider.role ? <p style={{ color: '#6b7280' }}>{provider.role}</p> : null}
          {hasReviews ? (
            <div style={{ marginTop: 12 }}>
              <ConsumerProviderReviewSummary
                averageRating={averageRating!}
                reviewCount={reviewCount}
                summaryTemplate={copy.providerReviewSummary}
              />
            </div>
          ) : null}
        </div>

        {provider.slots.length > 0 ? (
          <section style={{ marginBottom: 24 }}>
            <p style={{ fontSize: 12, color: '#6b7280' }}>
              {nearestDateText
                ? copy.nearestSlots.replace('{date}', nearestDateText)
                : copy.availableSlots}
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {provider.slots.map((slot) => {
                const active = selectedStartTime === slot.startTime;
                return (
                  <button
                    key={slot.startTime}
                    type="button"
                    onClick={() => setSelectedStartTime(slot.startTime)}
                    style={{
                      borderRadius: 999,
                      border: active ? 'none' : '1px solid #e5e7eb',
                      background: active ? primary : '#f9fafb',
                      color: active ? '#fff' : '#374151',
                      padding: '8px 14px',
                      fontSize: 14,
                      fontWeight: 500,
                    }}
                  >
                    {formatScheduleTime(slot.startTime, locale)}
                  </button>
                );
              })}
            </div>
          </section>
        ) : (
          <p style={{ color: '#9ca3af' }}>{copy.noSlots}</p>
        )}

        <h2 style={{ fontSize: 18, fontWeight: 700 }}>{copy.providerReviewsTitle}</h2>

        <div style={{ marginTop: 12, marginBottom: 16 }}>
          <p style={{ fontSize: 14, marginBottom: 8 }}>{copy.reviewYourRating}</p>
          <div style={{ display: 'flex', gap: 4 }}>
            {[1, 2, 3, 4, 5].map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setRating(value)}
                style={{
                  fontSize: 28,
                  color: value <= rating ? '#f59e0b' : '#d1d5db',
                  background: 'none',
                  border: 'none',
                  padding: 0,
                }}
                aria-label={`${value} stars`}
              >
                ★
              </button>
            ))}
          </div>
          <IonTextarea
            value={comment}
            placeholder={copy.reviewCommentPlaceholder}
            onIonInput={(event) => setComment(event.detail.value ?? '')}
            style={{ marginTop: 12 }}
          />
          {reviewMessage ? <p style={{ color: '#b45309', fontSize: 14 }}>{reviewMessage}</p> : null}
          <IonButton
            expand="block"
            fill="outline"
            disabled={reviewSubmitting}
            style={{ marginTop: 8 }}
            onClick={() => void submitReview()}
          >
            {copy.reviewSubmit}
          </IonButton>
        </div>

        {reviewItems.length === 0 ? (
          <p style={{ color: '#9ca3af' }}>{copy.noProviderReviews}</p>
        ) : (
          <>
            <IonList>
              {reviewItems.map((review) => (
                <IonItem key={review.id} lines="full">
                  <IonLabel className="ion-text-wrap">
                    <h3>
                      {'★'.repeat(review.rating)}
                      {review.customerName ? ` · ${review.customerName}` : ''}
                    </h3>
                    <p style={{ fontSize: 12, color: '#6b7280' }}>
                      {formatReviewDate(review.createdAt)}
                    </p>
                    {review.comment ? <p>{review.comment}</p> : null}
                  </IonLabel>
                </IonItem>
              ))}
            </IonList>
            {canLoadMoreReviews ? (
              <div style={{ marginTop: 12 }}>
                {reviewsLoadMoreMessage ? (
                  <p style={{ color: '#b45309', fontSize: 14 }} role="alert">
                    {reviewsLoadMoreMessage}
                  </p>
                ) : null}
                <IonButton
                  expand="block"
                  fill="outline"
                  disabled={reviewsLoadingMore}
                  onClick={() => void loadMoreReviews()}
                >
                  {reviewsLoadingMore ? <IonSpinner name="crescent" /> : copy.providerReviewsLoadMore}
                </IonButton>
              </div>
            ) : null}
          </>
        )}

        <IonButton
          expand="block"
          disabled={!selectedStartTime}
          style={{ marginTop: 24, '--background': primary }}
          onClick={onChoose}
        >
          {copy.chooseThisProfessional}
        </IonButton>
      </IonContent>
    </IonPage>
  );
}
