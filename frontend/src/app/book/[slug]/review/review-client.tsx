'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Loader2, Star } from 'lucide-react';
import { PublicHeader } from '@/components/public-booking/public-header';
import {
  getPublicReviewContext,
  submitPublicReview,
  type PublicBusinessProfile,
  type PublicReviewContext,
} from '@/lib/public-api';
import { bookPath } from '@/lib/tenant-host';
import { useI18n } from '@/i18n';
import { formatBookingDateTimeRange } from '@/lib/date-format';

function StarPicker({
  value,
  onChange,
  primary,
}: {
  value: number;
  onChange: (n: number) => void;
  primary: string;
}) {
  return (
    <div className="flex gap-2 justify-center">
      {Array.from({ length: 5 }, (_, i) => {
        const n = i + 1;
        const filled = n <= value;
        return (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            className="p-1 rounded-lg transition-transform hover:scale-110"
            aria-label={`${n} stars`}
          >
            <Star
              className="w-10 h-10"
              style={{ color: filled ? primary : '#d1d5db' }}
              fill={filled ? primary : 'transparent'}
            />
          </button>
        );
      })}
    </div>
  );
}

export function ReviewClient({ tenant }: { tenant: PublicBusinessProfile }) {
  const { t, locale } = useI18n();
  const searchParams = useSearchParams();
  const bookingId = searchParams.get('bookingId') ?? '';
  const token = searchParams.get('token') ?? '';
  const ratingParam = parseInt(searchParams.get('rating') ?? '', 10);
  const initialRating =
    Number.isFinite(ratingParam) && ratingParam >= 1 && ratingParam <= 5 ? ratingParam : 0;
  const primary = tenant.branding.primaryColor || '#7c3aed';

  const [rating, setRating] = useState(initialRating);
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: context, isLoading, isError } = useQuery({
    queryKey: ['public-review', tenant.slug, bookingId, token],
    queryFn: () => getPublicReviewContext(tenant.slug, bookingId, token),
    enabled: Boolean(bookingId && token),
    retry: false,
  });

  const submit = useMutation({
    mutationFn: () =>
      submitPublicReview(tenant.slug, {
        bookingId,
        token,
        rating,
        comment: comment.trim() || undefined,
      }),
    onSuccess: () => {
      setError(null);
      setSubmitted(true);
    },
    onError: (err) => {
      setError(err instanceof Error ? err.message : t('public.reviewSubmitFailed'));
    },
  });

  const missingParams = !bookingId || !token;

  function renderBody(ctx: PublicReviewContext) {
    if (ctx.alreadySubmitted || submitted) {
      return (
        <div className="text-center py-12">
          <div className="w-16 h-16 rounded-full bg-green-100 text-green-600 flex items-center justify-center mx-auto mb-4 text-2xl">
            ✓
          </div>
          <h2 className="text-xl font-semibold text-gray-900">{t('public.reviewThankYou')}</h2>
          <p className="text-gray-500 mt-2 text-sm">{t('public.reviewThankYouDetail')}</p>
          <a
            href={bookPath(tenant.slug)}
            className="inline-block mt-8 px-6 py-3 rounded-2xl text-white font-semibold"
            style={{ backgroundColor: primary }}
          >
            {t('public.bookAnother')}
          </a>
        </div>
      );
    }

    const when = new Date(ctx.appointmentDate);

    return (
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (rating < 1) {
            setError(t('public.reviewRatingRequired'));
            return;
          }
          submit.mutate();
        }}
        className="space-y-6"
      >
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">{t('public.reviewTitle')}</h1>
          <p className="text-gray-500 text-sm mt-2">{t('public.reviewSubtitle')}</p>
        </div>

        <div className="rounded-2xl bg-white border border-gray-100 p-4 text-sm text-gray-600 space-y-1">
          <p>
            <span className="font-medium text-gray-900">{ctx.employeeName}</span>
            {' · '}
            {ctx.serviceName}
          </p>
          <p>
            {formatBookingDateTimeRange(when, when, locale)}
          </p>
        </div>

        <div>
          <p className="text-center text-sm font-medium text-gray-700 mb-3">{t('public.reviewRatingLabel')}</p>
          <StarPicker value={rating} onChange={setRating} primary={primary} />
        </div>

        <label className="block text-sm">
          <span className="text-gray-700">{t('public.reviewCommentLabel')}</span>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={4}
            className="input w-full mt-1 text-sm"
            placeholder={t('public.reviewCommentPlaceholder')}
          />
        </label>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={submit.isPending}
          className="w-full py-3 rounded-2xl text-white font-semibold disabled:opacity-60"
          style={{ backgroundColor: primary }}
        >
          {submit.isPending ? t('public.submitting') : t('public.reviewSubmit')}
        </button>
      </form>
    );
  }

  return (
    <>
      <PublicHeader tenant={tenant} showBack backHref={bookPath(tenant.slug)} />
      <main className="max-w-lg mx-auto px-4 py-6">
        {missingParams && (
          <p className="text-center text-gray-500 py-16 text-sm">{t('public.reviewInvalidLink')}</p>
        )}
        {!missingParams && isLoading && (
          <div className="flex justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        )}
        {!missingParams && isError && (
          <p className="text-center text-red-600 py-16 text-sm">{t('public.reviewInvalidLink')}</p>
        )}
        {!missingParams && context && renderBody(context)}
      </main>
    </>
  );
}
