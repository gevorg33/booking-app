import { getPublicPackage, getPublicProfile } from '@/lib/public-api';
import { bookPath } from '@/lib/tenant-host';
import { PackageCheckoutClient } from '@/components/public-booking/package-checkout-client';

function pickParam(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

export default async function PackageCheckoutPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string; packageId: string }>;
  searchParams: Promise<{ session_id?: string | string[]; paid?: string | string[] }>;
}) {
  const { slug, packageId } = await params;
  const raw = await searchParams;
  const sessionId = pickParam(raw.session_id);

  const [tenant, { package: pkg }] = await Promise.all([
    getPublicProfile(slug),
    getPublicPackage(slug, packageId),
  ]);

  return (
    <PackageCheckoutClient
      slug={slug}
      tenant={tenant}
      pkg={pkg}
      backHref={bookPath(slug, `/packages/${packageId}`)}
      paymentSessionId={sessionId}
    />
  );
}
