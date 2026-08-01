'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { PublicHeader } from '@/components/public-booking/public-header';
import {
  ProviderReviewCard,
  ProviderReviewSummary,
} from '@/components/public-booking/provider-reviews';
import { getPublicProviderReviews, type PublicBusinessProfile } from '@/lib/public-api';
import { resolveProviderReviewsPageSummary } from '@/lib/provider-reviews-page-summary.util';
import { bookPath } from '@/lib/tenant-host';
import { useI18n } from '@/i18n';

interface ProviderReviewsClientProps {
  slug: string;
  tenant: PublicBusinessProfile;
  employeeId: string;
  backHref: string;
}

export function ProviderReviewsClient({
  slug,
  tenant,
  employeeId,
  backHref,
}: ProviderReviewsClientProps) {
  const { t } = useI18n();
  const searchParams = useSearchParams();
  const primary = tenant.branding.primaryColor || '#7c3aed';

  const page = useMemo(() => {
    const raw = parseInt(searchParams.get('page') ?? '1', 10);
    return Number.isFinite(raw) && raw > 0 ? raw : 1;
  }, [searchParams]);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['public-provider-reviews', slug, employeeId, page],
    queryFn: () => getPublicProviderReviews(slug, employeeId, page),
    retry: false,
  });

  const pageHref = (nextPage: number) => {
    const q = new URLSearchParams({ page: String(nextPage) });
    return `${bookPath(slug, `/providers/${employeeId}/reviews`)}?${q.toString()}`;
  };

  const summary = data
    ? resolveProviderReviewsPageSummary({
        averageRating: data.averageRating,
        reviewCount: data.reviewCount,
      })
    : null;

  return (
    <>
      <PublicHeader tenant={tenant} showBack backHref={backHref} />
      <main className="max-w-lg mx-auto px-4 py-6 pb-12">
        {isLoading && (
          <div className="flex justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        )}

        {isError && (
          <p className="text-center text-red-600 py-16 text-sm">{t('public.reviewsPageNotFound')}</p>
        )}

        {data && (
          <div className="space-y-4" data-testid="provider-reviews-page">
            <div className="px-1">
              <h1 className="text-xl font-bold text-gray-900">
                {t('public.reviewsPageTitle', { name: data.employeeName })}
              </h1>
              {summary && (
                <ProviderReviewSummary
                  averageRating={summary.averageRating}
                  reviewCount={summary.reviewCount}
                  primaryColor="#fbbf24"
                />
              )}
            </div>

            {data.items.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">{t('public.noProviderReviews')}</p>
            ) : (
              data.items.map((review) => (
                <ProviderReviewCard key={review.id} review={review} primaryColor="#fbbf24" />
              ))
            )}

            {data.totalPages > 1 && (
              <div className="flex items-center justify-between gap-3 pt-4">
                {page > 1 ? (
                  <Link
                    href={pageHref(page - 1)}
                    className="inline-flex items-center gap-1 text-sm font-medium text-gray-700 hover:text-gray-900"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    {t('public.reviewsPreviousPage')}
                  </Link>
                ) : (
                  <span />
                )}

                <span className="text-sm text-gray-500">
                  {t('public.reviewsPageOf', { page: data.page, total: data.totalPages })}
                </span>

                {page < data.totalPages ? (
                  <Link
                    href={pageHref(page + 1)}
                    className="inline-flex items-center gap-1 text-sm font-medium text-gray-700 hover:text-gray-900"
                  >
                    {t('public.reviewsNextPage')}
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                ) : (
                  <span />
                )}
              </div>
            )}
          </div>
        )}
      </main>
    </>
  );
}
