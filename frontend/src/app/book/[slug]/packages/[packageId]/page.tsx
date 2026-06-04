import { getPublicProfileResolved } from '@/lib/get-public-profile-resolved';
import { getPublicPackage } from '@/lib/public-api';
import { bookPath } from '@/lib/tenant-host';
import { PackageConfirmClient } from '@/components/public-booking/package-confirm-client';

export default async function PackageConfirmPage({
  params,
}: {
  params: Promise<{ slug: string; packageId: string }>;
}) {
  const { slug, packageId } = await params;
  const [tenant, { package: pkg }] = await Promise.all([
    getPublicProfileResolved(slug),
    getPublicPackage(slug, packageId),
  ]);

  return (
    <PackageConfirmClient
      slug={slug}
      tenant={tenant}
      pkg={pkg}
      backHref={bookPath(slug, '/any')}
    />
  );
}
