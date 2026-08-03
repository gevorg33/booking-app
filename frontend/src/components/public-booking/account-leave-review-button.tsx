'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Star } from 'lucide-react';
import { getPublicCustomerReviewSession } from '@/lib/public-api';
import { resolveAccountLeaveReviewHref } from '@/lib/account-leave-review.util';
import { useI18n } from '@/i18n';

interface AccountLeaveReviewButtonProps {
  slug: string;
  bookingId: string;
  primary: string;
}

/** e2e-bug.215 — fetch review token then open `/review?bookingId=&token=`. */
export function AccountLeaveReviewButton({
  slug,
  bookingId,
  primary,
}: AccountLeaveReviewButtonProps) {
  const { t } = useI18n();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onClick = async () => {
    setError(null);
    setLoading(true);
    try {
      const href = await resolveAccountLeaveReviewHref(
        slug,
        bookingId,
        getPublicCustomerReviewSession,
      );
      router.push(href);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : t('public.reviewSubmitFailed'),
      );
      setLoading(false);
    }
  };

  return (
    <div className="mt-3">
      <button
        type="button"
        data-testid="account-leave-review"
        data-booking-id={bookingId}
        disabled={loading}
        onClick={() => void onClick()}
        className="inline-flex items-center gap-1.5 text-sm font-medium disabled:opacity-60"
        style={{ color: primary }}
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Star className="w-4 h-4" />
        )}
        {t('public.leaveReview')}
      </button>
      {error && (
        <p className="text-xs text-red-600 mt-1" data-testid="account-leave-review-error">
          {error}
        </p>
      )}
    </div>
  );
}
