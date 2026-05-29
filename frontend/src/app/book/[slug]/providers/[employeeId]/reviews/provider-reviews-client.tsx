'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { PublicHeader } from '@/components/public-booking/public-header';
import {
  ProviderReviewList,
  ProviderReviewSummary,
} from '@/components/public-booking/provider-reviews';
import {
  getPublicProviderReviews,
  type PublicBusinessProfile,
} from '@/lib/public-api';
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
          <div className="space-y-6">
            <div className="flex items-start gap-3">
              {data.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={data.avatarUrl}
                  alt=""
                  className="w-14 h-14 rounded-full object-cover shrink-0"
                />
              ) : (
                <div
                  className="w-14 h-14 rounded-full shrink-0 flex items-center justify-center text-white text-lg font-semibold"
                  style={{ backgroundColor: primary }}
                >
                  {data.employeeName.charAt(0)}
                </div>
              )}
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {t('public.reviewsPageTitle', { name: data.employeeName })}
                </h1>
                {data.employeeRole && (
                  <p className="text-sm text-gray-500 mt-0.5">{data.employeeRole}</p>
                )}
                {data.averageRating != null && data.reviewCount > 0 && (
                  <div className="mt-2">
                    <ProviderReviewSummary
                      averageRating={data.averageRating}
                      reviewCount={data.reviewCount}
                      primaryColor={primary}
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-gray-100 bg-white p-4">
              {data.items.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-8">{t('public.noProviderReviews')}</p>
              ) : (
                <ProviderReviewList reviews={data.items} primaryColor={primary} />
              )}
            </div>

            {data.totalPages > 1 && (
              <div className="flex items-center justify-between gap-3">
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
