'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { PublicHeader } from '@/components/public-booking/public-header';
import { FixedActionBar } from '@/components/public-booking/fixed-action-bar';
import {
  ProviderReviewCard,
  ProviderReviewCountLabel,
  StarRatingDisplay,
} from '@/components/public-booking/provider-reviews';
import { PublicReviewForm } from '@/components/public-booking/public-review-form';
import type {
  PublicBusinessProfile,
  PublicProvider,
  PublicProviderReview,
  PublicProviderReviewsPage,
} from '@/lib/public-api';
import { formatScheduleTime } from '@/lib/date-format';
import { bookPath } from '@/lib/tenant-host';
import { useI18n } from '@/i18n';

interface ProviderProfileClientProps {
  slug: string;
  tenant: PublicBusinessProfile;
  provider: PublicProvider;
  reviews: PublicProviderReviewsPage;
  backHref: string;
}

export function ProviderProfileClient({
  slug,
  tenant,
  provider,
  reviews,
  backHref,
}: ProviderProfileClientProps) {
  const router = useRouter();
  const { t } = useI18n();
  const primary = tenant.branding.primaryColor || '#7c3aed';
  const [selectedStartTime, setSelectedStartTime] = useState<string | null>(
    provider.slots[0]?.startTime ?? null,
  );
  const [reviewItems, setReviewItems] = useState(reviews.items);
  const [reviewCount, setReviewCount] = useState(reviews.reviewCount);
  const [averageRating, setAverageRating] = useState(reviews.averageRating);

  const hasReviews = reviewCount > 0 && averageRating != null;
  const reviewsPageHref = bookPath(slug, `/providers/${provider.id}/reviews`);

  const chooseDisabled = useMemo(() => {
    if (provider.slots.length === 0) return true;
    return !selectedStartTime;
  }, [provider.slots.length, selectedStartTime]);

  const onChoose = () => {
    if (!selectedStartTime) return;
    const q = new URLSearchParams({
      employeeId: provider.id,
      startTime: selectedStartTime,
    });
    router.push(`${bookPath(slug, '/services')}?${q.toString()}`);
  };

  return (
    <>
      <PublicHeader tenant={tenant} showBack backHref={backHref} />
      <main className="max-w-lg mx-auto px-4 py-4 pb-36">
        <section className="bg-white rounded-3xl border border-gray-100 px-6 py-8 text-center shadow-sm">
          {provider.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={provider.avatarUrl}
              alt=""
              className="w-28 h-28 rounded-full object-cover mx-auto shrink-0"
            />
          ) : (
            <div
              className="w-28 h-28 rounded-full mx-auto flex items-center justify-center text-white text-3xl font-semibold shrink-0"
              style={{ backgroundColor: primary }}
            >
              {provider.name.charAt(0)}
            </div>
          )}

          <h1 className="text-2xl font-bold text-gray-900 mt-5">{provider.name}</h1>
          {provider.role && <p className="text-sm text-gray-500 mt-1">{provider.role}</p>}

          {hasReviews && (
            <div className="flex items-center justify-center gap-2 mt-4">
              <StarRatingDisplay rating={averageRating!} size="md" primaryColor="#fbbf24" />
              <ProviderReviewCountLabel count={reviewCount} />
            </div>
          )}
        </section>

        {provider.slots.length > 0 && (
          <section className="mt-5">
            <p className="text-xs text-gray-500 mb-2 px-1">
              {provider.nearestDateLabel
                ? t('public.nearestSlots', { date: provider.nearestDateLabel })
                : t('public.availableSlots')}
            </p>
            <div className="flex flex-wrap gap-2">
              {provider.slots.map((slot) => {
                const active = selectedStartTime === slot.startTime;
                return (
                  <button
                    key={slot.startTime}
                    type="button"
                    onClick={() => setSelectedStartTime(slot.startTime)}
                    className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
                      active
                        ? 'text-white border-transparent'
                        : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300'
                    }`}
                    style={active ? { backgroundColor: primary } : undefined}
                  >
                    {formatScheduleTime(slot.startTime)}
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {provider.slots.length === 0 && (
          <p className="text-sm text-gray-400 mt-5 px-1">{t('public.noSlots')}</p>
        )}

        <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4 px-1">{t('public.commentsTitle')}</h2>

        <PublicReviewForm
          slug={slug}
          employeeId={provider.id}
          primaryColor={primary}
          onSubmitted={(review) => {
            setReviewItems((prev) => [review, ...prev]);
            setReviewCount((prev) => {
              const next = prev + 1;
              setAverageRating((currentAvg) => {
                if (currentAvg == null) return review.rating;
                return Math.round(((currentAvg * prev + review.rating) / next) * 10) / 10;
              });
              return next;
            });
          }}
        />

        <div className="mt-4 space-y-4">
          {reviewItems.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">{t('public.noProviderReviews')}</p>
          ) : (
            reviewItems.map((review) => (
              <ProviderReviewCard key={review.id} review={review} primaryColor="#fbbf24" />
            ))
          )}
        </div>

        {reviews.totalPages > 1 && (
          <a
            href={reviewsPageHref}
            className="block text-center mt-6 text-sm font-medium hover:underline"
            style={{ color: primary }}
          >
            {t('public.seeMoreReviews')}
          </a>
        )}
      </main>

      <FixedActionBar
        primaryColor={primary}
        disabled={chooseDisabled}
        label={t('public.chooseThisProfessional')}
        onClick={onChoose}
      />
    </>
  );
}

export function ProviderProfileLoading() {
  return (
    <div className="flex justify-center py-24">
      <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
    </div>
  );
}
