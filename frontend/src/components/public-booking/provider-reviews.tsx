'use client';

import { Star } from 'lucide-react';
import { formatPublicReviewDate } from '@/lib/date-format';
import type { PublicProviderReview } from '@/lib/public-api';
import { useI18n } from '@/i18n';

const REVIEWER_AVATAR_COLORS = [
  '#8b5cf6',
  '#6366f1',
  '#ec4899',
  '#f97316',
  '#14b8a6',
  '#3b82f6',
  '#a855f7',
];

function reviewerAvatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return REVIEWER_AVATAR_COLORS[Math.abs(hash) % REVIEWER_AVATAR_COLORS.length];
}

function reviewerInitial(name: string | null): string {
  const trimmed = name?.trim();
  if (!trimmed) return '?';
  return trimmed.charAt(0).toUpperCase();
}

export function StarRatingDisplay({
  rating,
  size = 'sm',
  primaryColor = '#fbbf24',
}: {
  rating: number;
  size?: 'sm' | 'md';
  primaryColor?: string;
}) {
  const starSize = size === 'md' ? 'w-5 h-5' : 'w-3.5 h-3.5';
  const rounded = Math.max(0, Math.min(5, Math.round(rating)));

  return (
    <span className="inline-flex gap-0.5" aria-label={`${rating} out of 5 stars`}>
      {Array.from({ length: 5 }, (_, i) => {
        const filled = i < rounded;
        return (
          <Star
            key={i}
            className={starSize}
            style={{ color: filled ? primaryColor : '#d1d5db' }}
            fill={filled ? primaryColor : 'transparent'}
          />
        );
      })}
    </span>
  );
}

export function EmptyStarRatingDisplay({ size = 'md' }: { size?: 'sm' | 'md' }) {
  const starSize = size === 'md' ? 'w-6 h-6' : 'w-4 h-4';

  return (
    <span className="inline-flex gap-1" aria-hidden>
      {Array.from({ length: 5 }, (_, i) => (
        <Star key={i} className={starSize} style={{ color: '#d1d5db' }} fill="transparent" />
      ))}
    </span>
  );
}

export function ProviderReviewCountLabel({ count }: { count: number }) {
  const { t } = useI18n();
  return <span className="text-sm text-gray-500">{t('public.reviewCountLabel', { count })}</span>;
}

export function ProviderReviewSummary({
  averageRating,
  reviewCount,
  primaryColor,
}: {
  averageRating: number;
  reviewCount: number;
  primaryColor: string;
}) {
  const { t } = useI18n();

  return (
    <div className="flex items-center gap-2 mt-1">
      <StarRatingDisplay rating={averageRating} primaryColor={primaryColor} />
      <span className="text-xs text-gray-500">
        {t('public.providerReviewSummary', {
          rating: averageRating.toFixed(1),
          count: reviewCount,
        })}
      </span>
    </div>
  );
}

export function RateReviewPrompt({ hint }: { hint: string }) {
  const { t } = useI18n();

  return (
    <div className="bg-white rounded-2xl border border-gray-100 px-5 py-4">
      <p className="font-medium text-gray-900 mb-3">{t('public.rateAndReview')}</p>
      <EmptyStarRatingDisplay size="md" />
      <p className="text-xs text-gray-400 mt-3">{hint}</p>
    </div>
  );
}

export function ProviderReviewCard({
  review,
  primaryColor = '#fbbf24',
}: {
  review: PublicProviderReview;
  primaryColor?: string;
}) {
  const { locale } = useI18n();
  const displayName = review.customerName?.trim() || 'Guest';
  const avatarColor = reviewerAvatarColor(displayName);

  return (
    <article className="bg-white rounded-2xl border border-gray-100 px-5 py-4">
      <div className="flex items-start gap-3">
        <div
          className="w-10 h-10 rounded-full shrink-0 flex items-center justify-center text-white text-sm font-semibold"
          style={{ backgroundColor: avatarColor }}
        >
          {reviewerInitial(review.customerName)}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900">{displayName}</p>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <StarRatingDisplay rating={review.rating} primaryColor={primaryColor} />
            <span className="text-xs text-gray-400">
              {formatPublicReviewDate(review.createdAt, locale)}
            </span>
          </div>
          {review.comment && (
            <p className="text-sm text-gray-600 mt-2 leading-relaxed">{review.comment}</p>
          )}
        </div>
      </div>
    </article>
  );
}

export function ProviderReviewList({
  reviews,
  primaryColor,
  seeMoreHref,
  showSeeMore,
}: {
  reviews: PublicProviderReview[];
  primaryColor: string;
  seeMoreHref?: string;
  showSeeMore?: boolean;
}) {
  const { t } = useI18n();

  if (reviews.length === 0) {
    return <p className="text-sm text-gray-400">{t('public.noProviderReviews')}</p>;
  }

  return (
    <>
      <ul className="space-y-3">
        {reviews.map((review) => (
          <li key={review.id}>
            <ProviderReviewCard review={review} primaryColor={primaryColor} />
          </li>
        ))}
      </ul>
      {showSeeMore && seeMoreHref && (
        <a
          href={seeMoreHref}
          className="inline-block mt-4 text-sm font-medium hover:underline"
          style={{ color: primaryColor }}
        >
          {t('public.seeMoreReviews')}
        </a>
      )}
    </>
  );
}
