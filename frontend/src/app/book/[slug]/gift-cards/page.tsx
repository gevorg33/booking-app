import { notFound } from 'next/navigation';
import { getPublicProfileResolved } from '@/lib/get-public-profile-resolved';
import { getPublicGiftCardCatalog, getPublicServices } from '@/lib/public-api';
import { resolvePublicBookingLocale } from '@/lib/server-public-locale';
import { GiftCardCatalogClient } from '@/components/public-booking/gift-card-catalog-client';

export default async function GiftCardsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const tenant = await getPublicProfileResolved(slug);
  const locale = await resolvePublicBookingLocale(tenant.locale);
  const [catalog, { services }] = await Promise.all([
    getPublicGiftCardCatalog(slug),
    getPublicServices(slug, { locale }),
  ]);

  if (!catalog.purchaseEnabled || !catalog.settings) {
    notFound();
  }

  return (
    <GiftCardCatalogClient
      slug={slug}
      tenant={tenant}
      catalog={catalog}
      services={services}
    />
  );
}
