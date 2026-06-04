'use client';

import { Loader2, Star } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/lib/store';
import api from '@/lib/api';
import { useI18n } from '@/i18n';
import { formatDateDisplay } from '@/lib/date-format';

function unwrap<T>(res: unknown): T {
  return ((res as { data?: T })?.data ?? res) as T;
}

function StarRating({ rating }: { rating: number }) {
  return (
    <span className="inline-flex gap-0.5">
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          className={`w-3.5 h-3.5 ${i < rating ? 'text-amber-400 fill-amber-400' : 'text-gray-600'}`}
        />
      ))}
    </span>
  );
}

export default function ReviewsPage() {
  const { t } = useI18n();
  const { business } = useAuthStore();

  const { data: reviews = [], isLoading: reviewsLoading } = useQuery({
    queryKey: ['reviews', business?.id],
    queryFn: async () => {
      const { data } = await api.get(`/businesses/${business!.id}/reviews`);
      return unwrap<any[]>(data);
    },
    enabled: !!business?.id,
  });

  const { data: summary = [], isLoading: summaryLoading } = useQuery({
    queryKey: ['reviews-summary', business?.id],
    queryFn: async () => {
      const { data } = await api.get(`/businesses/${business!.id}/reviews/summary`);
      return unwrap<
        Array<{ employeeId: string; employeeName: string; avgRating: number; reviewCount: number }>
      >(data);
    },
    enabled: !!business?.id,
  });

  const loading = reviewsLoading || summaryLoading;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Star className="w-6 h-6 text-amber-400" />
          {t('reviewsPage.title')}
        </h1>
        <p className="text-gray-400 text-sm mt-1">{t('reviewsPage.subtitle')}</p>
      </div>

      {loading ? (
        <div className="card flex justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
        </div>
      ) : (
        <div className="space-y-6">
          <section className="card">
            <h2 className="font-semibold mb-4">{t('reviewsPage.providerSummary')}</h2>
            {summary.length === 0 ? (
              <p className="text-gray-500 text-sm">{t('reviewsPage.noRatings')}</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {summary.map((row) => (
                  <div key={row.employeeId} className="rounded-lg border border-gray-800 p-4">
                    <p className="font-medium">{row.employeeName}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <StarRating rating={Math.round(row.avgRating)} />
                      <span className="text-sm text-gray-400">
                        {row.avgRating} ({row.reviewCount})
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="card overflow-hidden p-0">
            {reviews.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-12">{t('reviewsPage.noReviews')}</p>
            ) : (
              <ul className="divide-y divide-gray-800">
                {reviews.map((review) => (
                  <li key={review.id} className="px-6 py-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-medium">
                          {review.employee?.name ?? t('reviewsPage.providerFallback')}
                          <span className="text-gray-500 font-normal">
                            {' '}
                            · {review.customer?.name ?? review.customerName ?? t('reviewsPage.anonymous')}
                          </span>
                        </p>
                        <div className="mt-1">
                          <StarRating rating={review.rating} />
                        </div>
                        {review.comment && (
                          <p className="text-sm text-gray-400 mt-2">{review.comment}</p>
                        )}
                      </div>
                      <span className="text-xs text-gray-500 shrink-0">
                        {formatDateDisplay(new Date(review.createdAt))}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
