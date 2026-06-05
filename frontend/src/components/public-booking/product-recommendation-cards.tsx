'use client';

import { useEffect, useRef, useState } from 'react';
import { ExternalLink, X } from 'lucide-react';
import {
  getCheckoutRecommendations,
  formatPrice,
  type PublicRecommendationProduct,
  type PublicService,
} from '@/lib/public-api';
import { shouldShowRecommendationsSection } from '@/lib/product-recommendation';
import {
  trackProductRecommendationEvent,
  trackProductRecommendationImpressions,
} from '@/lib/product-recommendation-analytics';
import { resolvePublicImageUrl } from '@/lib/resolve-public-image-url';
import { useI18n } from '@/i18n';

export function ProductRecommendationCards({
  slug,
  service,
  currency,
  bookingId,
}: {
  slug: string;
  service: PublicService;
  currency: string;
  bookingId?: string;
}) {
  const { t } = useI18n();
  const [products, setProducts] = useState<PublicRecommendationProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [dismissed, setDismissed] = useState(false);
  const impressionSeen = useRef(new Set<string>());
  const analyticsContext = {
    slug,
    serviceId: service.id,
    categoryId: service.category?.id,
    bookingId,
    surface: 'web_checkout' as const,
  };

  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => setLoading(true));
    getCheckoutRecommendations(slug, {
      serviceId: service.id,
      categoryId: service.category?.id,
    })
      .then((result) => {
        if (!cancelled) setProducts(result.products);
      })
      .catch(() => {
        if (!cancelled) setProducts([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [slug, service.id, service.category?.id]);

  useEffect(() => {
    if (dismissed || loading || products.length === 0) return;
    trackProductRecommendationImpressions(
      analyticsContext,
      products.map((product) => product.id),
      impressionSeen.current,
    );
  }, [
    dismissed,
    loading,
    products,
    slug,
    service.id,
    service.category?.id,
    bookingId,
  ]);

  if (loading || !shouldShowRecommendationsSection(dismissed, products)) {
    return null;
  }

  return (
    <div className="mt-8 max-w-lg mx-auto text-left">
      <div className="flex items-center justify-between gap-3 mb-4">
        <h3 className="text-base font-semibold text-gray-900">
          {t('recommendations.youMightAlsoLike')}
        </h3>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100"
          aria-label={t('recommendations.dismiss')}
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="space-y-3">
        {products.map((product) => {
          const imageUrl = resolvePublicImageUrl(product.imageUrl);
          const priceLabel =
            product.price != null && product.price > 0
              ? formatPrice(product.price, currency)
              : null;
          return (
            <article
              key={product.id}
              className="flex gap-3 rounded-2xl border border-gray-200 bg-white p-3 shadow-sm"
            >
              {imageUrl ? (
                <img
                  src={imageUrl}
                  alt=""
                  className="w-16 h-16 rounded-xl object-cover shrink-0 bg-gray-100"
                />
              ) : (
                <div className="w-16 h-16 rounded-xl bg-gray-100 shrink-0" />
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <h4 className="font-medium text-gray-900 text-sm">{product.name}</h4>
                  {priceLabel && (
                    <span className="text-sm font-semibold text-gray-700 shrink-0">
                      {priceLabel}
                    </span>
                  )}
                </div>
                {product.description && (
                  <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                    {product.description}
                  </p>
                )}
                {product.externalLink && (
                  <a
                    href={product.externalLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-medium text-violet-600 mt-2 hover:text-violet-700"
                    onClick={() =>
                      trackProductRecommendationEvent(
                        analyticsContext,
                        'clicked',
                        product.id,
                      )
                    }
                  >
                    {t('recommendations.learnMore')}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
