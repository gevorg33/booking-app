import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { IonButton, IonIcon } from '@ionic/react';
import { closeOutline, openOutline } from 'ionicons/icons';
import { fetchCheckoutRecommendations } from '../services/public-api.js';
import {
  buildCheckoutRecommendationParams,
  resolveRecommendationProductsFromQuery,
} from '../lib/checkout-recommendations.js';
import {
  formatRecommendationPrice,
  shouldShowRecommendationsSection,
} from '../lib/product-recommendation.js';
import { resolvePublicImageUrl } from '../lib/resolve-public-image-url.js';
import { formatConsumerPrice, resolveTenantPriceCurrency } from '../lib/business-currency.js';
import type { ConsumerCopy } from '../lib/copy.js';
import {
  trackProductRecommendationEvent,
  trackProductRecommendationImpressions,
} from '../lib/product-recommendation-analytics.js';
import type { PublicService } from '../lib/types.js';

export function ConsumerProductRecommendationCards({
  slug,
  service,
  tenantCurrency,
  bookingId,
  copy,
}: {
  slug: string;
  service: PublicService;
  tenantCurrency: string;
  bookingId?: string;
  copy: ConsumerCopy;
}) {
  const [dismissed, setDismissed] = useState(false);
  const impressionSeen = useRef(new Set<string>());
  const analyticsContext = {
    slug,
    serviceId: service.id,
    categoryId: service.category?.id,
    bookingId,
    surface: 'consumer_app' as const,
  };
  const currency = resolveTenantPriceCurrency(service.currency, tenantCurrency);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['checkout-recommendations', slug, service.id, service.category?.id],
    queryFn: () =>
      fetchCheckoutRecommendations(slug, buildCheckoutRecommendationParams(service)),
    enabled: !!slug && !!service.id,
  });

  const products = resolveRecommendationProductsFromQuery(data, isError);

  useEffect(() => {
    if (dismissed || isLoading || isError || products.length === 0) return;
    trackProductRecommendationImpressions(
      analyticsContext,
      products.map((product) => product.id),
      impressionSeen.current,
    );
  }, [
    dismissed,
    isLoading,
    isError,
    products,
    slug,
    service.id,
    service.category?.id,
    bookingId,
  ]);

  if (isLoading || !shouldShowRecommendationsSection(dismissed, products)) {
    return null;
  }

  const formatPrice = (amount: number) => formatConsumerPrice(amount, currency);

  return (
    <div className="ion-margin-top" style={{ textAlign: 'left' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          marginBottom: 12,
        }}
      >
        <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: 0 }}>
          {copy.youMightAlsoLike}
        </h3>
        <IonButton
          fill="clear"
          size="small"
          aria-label={copy.dismissRecommendations}
          onClick={() => setDismissed(true)}
        >
          <IonIcon slot="icon-only" icon={closeOutline} />
        </IonButton>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {products.map((product) => {
          const imageUrl = resolvePublicImageUrl(product.imageUrl);
          const priceLabel = formatRecommendationPrice(product.price, formatPrice);
          return (
            <article
              key={product.id}
              className="salon-card"
              style={{ display: 'flex', gap: 12, padding: 12 }}
            >
              {imageUrl ? (
                <img
                  src={imageUrl}
                  alt=""
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: 12,
                    objectFit: 'cover',
                    background: '#f3f4f6',
                    flexShrink: 0,
                  }}
                />
              ) : (
                <div
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: 12,
                    background: '#f3f4f6',
                    flexShrink: 0,
                  }}
                />
              )}
              <div style={{ minWidth: 0, flex: 1 }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    gap: 8,
                  }}
                >
                  <h4 style={{ fontWeight: 600, fontSize: '0.875rem', margin: 0 }}>
                    {product.name}
                  </h4>
                  {priceLabel && (
                    <span style={{ fontSize: '0.875rem', fontWeight: 600, flexShrink: 0 }}>
                      {priceLabel}
                    </span>
                  )}
                </div>
                {product.description && (
                  <p
                    style={{
                      fontSize: '0.75rem',
                      color: '#6b7280',
                      marginTop: 4,
                      marginBottom: 0,
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                  >
                    {product.description}
                  </p>
                )}
                {product.externalLink && (
                  <a
                    href={product.externalLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() =>
                      trackProductRecommendationEvent(
                        analyticsContext,
                        'clicked',
                        product.id,
                      )
                    }
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      color: 'var(--tenant-primary, #7c3aed)',
                      marginTop: 8,
                      textDecoration: 'none',
                    }}
                  >
                    {copy.learnMore}
                    <IonIcon icon={openOutline} style={{ fontSize: 14 }} />
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
