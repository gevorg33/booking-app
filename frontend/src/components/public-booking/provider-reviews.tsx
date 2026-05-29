'use client';

import { Star } from 'lucide-react';
import { formatDateDisplay } from '@/lib/date-format';
import type { PublicProviderReview } from '@/lib/public-api';
import { useI18n } from '@/i18n';

export function StarRatingDisplay({
  rating,
  size = 'sm',
  primaryColor = '#fbbf24',
}: {
  rating: number;
  size?: 'sm' | 'md';
  primaryColor?: string;
}) {
  const starSize = size === 'md' ? 'w-4 h-4' : 'w-3.5 h-3.5';
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
          <li key={review.id} className="text-sm">
            <div className="flex items-center justify-between gap-2">
              <StarRatingDisplay rating={review.rating} primaryColor={primaryColor} />
              <span className="text-xs text-gray-400 shrink-0">
                {formatDateDisplay(new Date(review.createdAt))}
              </span>
            </div>
            {review.comment && (
              <p className="text-gray-600 mt-1.5 leading-relaxed">&ldquo;{review.comment}&rdquo;</p>
            )}
            {review.customerName && (
              <p className="text-xs text-gray-400 mt-1">— {review.customerName}</p>
            )}
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
