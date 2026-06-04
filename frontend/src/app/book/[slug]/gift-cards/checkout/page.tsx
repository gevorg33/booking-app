import { notFound } from 'next/navigation';
import { getPublicProfileResolved } from '@/lib/get-public-profile-resolved';
import { getPublicGiftCardCatalog } from '@/lib/public-api';
import { GiftCardCheckoutClient } from '@/components/public-booking/gift-card-checkout-client';

function pickParam(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

export default async function GiftCardCheckoutPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ session_id?: string | string[] }>;
}) {
  const { slug } = await params;
  const raw = await searchParams;
  const sessionId = pickParam(raw.session_id);

  const [tenant, catalog] = await Promise.all([getPublicProfileResolved(slug), getPublicGiftCardCatalog(slug)]);

  if (!catalog.purchaseEnabled || !catalog.settings) {
    notFound();
  }

  return (
    <GiftCardCheckoutClient
      slug={slug}
      tenant={tenant}
      catalog={catalog}
      paymentSessionId={sessionId}
    />
  );
}
