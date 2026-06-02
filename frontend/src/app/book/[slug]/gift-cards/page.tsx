import { notFound } from 'next/navigation';
import { getPublicGiftCardCatalog, getPublicProfile, getPublicServices } from '@/lib/public-api';
import { GiftCardCatalogClient } from '@/components/public-booking/gift-card-catalog-client';

export default async function GiftCardsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [tenant, catalog, { services }] = await Promise.all([
    getPublicProfile(slug),
    getPublicGiftCardCatalog(slug),
    getPublicServices(slug),
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
