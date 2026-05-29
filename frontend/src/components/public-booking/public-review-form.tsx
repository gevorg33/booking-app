'use client';

import { useState } from 'react';
import { Loader2, Star } from 'lucide-react';
import {
  getPublicGoogleIdToken,
  isPublicGoogleSignInCancelled,
  isPublicGoogleSignInRedirecting,
} from '@/lib/public-google-auth';
import { isPublicGoogleSignInAvailable } from '@/lib/firebase-public';
import { submitProviderPortalReview, type PublicProviderReview } from '@/lib/public-api';
import { usePublicCustomerAuth } from '@/lib/public-customer-auth';
import { useI18n } from '@/i18n';

function InteractiveStarRating({
  value,
  onChange,
}: {
  value: number;
  onChange: (rating: number) => void;
}) {
  const [hover, setHover] = useState(0);

  return (
    <div className="flex gap-1" role="radiogroup" aria-label="Rating">
      {Array.from({ length: 5 }, (_, i) => {
        const starValue = i + 1;
        const active = starValue <= (hover || value);
        return (
          <button
            key={starValue}
            type="button"
            role="radio"
            aria-checked={value === starValue}
            className="p-0.5 rounded transition-transform hover:scale-110"
            onMouseEnter={() => setHover(starValue)}
            onMouseLeave={() => setHover(0)}
            onClick={() => onChange(starValue)}
          >
            <Star
              className="w-7 h-7"
              style={{ color: active ? '#fbbf24' : '#d1d5db' }}
              fill={active ? '#fbbf24' : 'transparent'}
            />
          </button>
        );
      })}
    </div>
  );
}

interface PublicReviewFormProps {
  slug: string;
  employeeId: string;
  primaryColor: string;
  onSubmitted: (review: PublicProviderReview) => void;
}

export function PublicReviewForm({ slug, employeeId, primaryColor, onSubmitted }: PublicReviewFormProps) {
  const { t } = useI18n();
  const { customer, token, signInWithGoogle } = usePublicCustomerAuth();
  const googleEnabled = isPublicGoogleSignInAvailable();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit() {
    setError(null);

    if (rating < 1) {
      setError(t('public.reviewRatingRequired'));
      return;
    }

    if (!googleEnabled && !token) {
      setError(t('public.googleSignInUnavailable'));
      return;
    }

    setSubmitting(true);
    try {
      const body: { rating: number; comment?: string; idToken?: string } = {
        rating,
        comment: comment.trim() || undefined,
      };

      if (!token) {
        body.idToken = await getPublicGoogleIdToken({ slug });
      }

      const review = await submitProviderPortalReview(slug, employeeId, body);

      setSuccess(true);
      onSubmitted(review);
    } catch (err) {
      if (!isPublicGoogleSignInCancelled(err) && !isPublicGoogleSignInRedirecting(err)) {
        setError(err instanceof Error ? err.message : t('public.reviewSubmitFailed'));
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <div className="bg-white rounded-2xl border border-green-100 px-5 py-4">
        <p className="font-medium text-green-700">{t('public.reviewThankYou')}</p>
        <p className="text-sm text-gray-500 mt-1">{t('public.reviewThankYouDetail')}</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 px-5 py-4">
      <p className="font-medium text-gray-900 mb-3">{t('public.rateAndReview')}</p>
      <InteractiveStarRating value={rating} onChange={setRating} />

      <textarea
        className="w-full mt-4 rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-200 focus:border-violet-400 min-h-[88px] resize-none"
        placeholder={t('public.reviewCommentPlaceholder')}
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        maxLength={2000}
      />

      <p className="text-xs text-gray-400 mt-2">
        {customer ? t('public.reviewSignedInHint') : t('public.reviewGoogleHint')}
      </p>

      {error && <p className="text-sm text-red-600 mt-3">{error}</p>}

      {customer ? (
        <button
          type="button"
          onClick={() => void handleSubmit()}
          disabled={submitting}
          className="mt-4 w-full flex items-center justify-center gap-2 py-3 rounded-xl text-white text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          style={{ backgroundColor: primaryColor }}
        >
          {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          {submitting ? t('public.submitting') : t('public.reviewSubmit')}
        </button>
      ) : (
        <button
          type="button"
          onClick={async () => {
            if (!googleEnabled) return;
            setSubmitting(true);
            setError(null);
            try {
              await signInWithGoogle();
              await handleSubmit();
            } catch (err) {
              if (!isPublicGoogleSignInCancelled(err) && !isPublicGoogleSignInRedirecting(err)) {
                setError(err instanceof Error ? err.message : t('public.reviewSubmitFailed'));
              }
            } finally {
              setSubmitting(false);
            }
          }}
          disabled={submitting || !googleEnabled}
          className="mt-4 w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-800 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {submitting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="" className="w-5 h-5" />
          )}
          {submitting ? t('public.submitting') : t('public.submitReviewWithGoogle')}
        </button>
      )}

      {!googleEnabled && !customer && (
        <p className="text-xs text-amber-700 mt-2">{t('public.googleSignInUnavailable')}</p>
      )}
    </div>
  );
}
