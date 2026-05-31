import { getPublicPackage, getPublicProfile } from '@/lib/public-api';
import { bookPath } from '@/lib/tenant-host';
import { PackageConfirmClient } from '@/components/public-booking/package-confirm-client';

export default async function PackageConfirmPage({
  params,
}: {
  params: Promise<{ slug: string; packageId: string }>;
}) {
  const { slug, packageId } = await params;
  const [tenant, { package: pkg }] = await Promise.all([
    getPublicProfile(slug),
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
