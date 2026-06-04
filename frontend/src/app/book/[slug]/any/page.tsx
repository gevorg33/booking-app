import { getPublicProfileResolved } from '@/lib/get-public-profile-resolved';
import { getPublicServices, getPublicPackages } from '@/lib/public-api';
import { bookPath } from '@/lib/tenant-host';
import { resolvePublicBookingLocale } from '@/lib/server-public-locale';
import { AnyServicesClient } from './any-services-client';

export default async function AnySpecialistServicesPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const tenant = await getPublicProfileResolved(slug);
  const locale = await resolvePublicBookingLocale(tenant.locale);
  const [{ services }, { packages }] = await Promise.all([
    getPublicServices(slug, { locale }),
    getPublicPackages(slug).catch(() => ({ packages: [] })),
  ]);

  return (
    <AnyServicesClient
      slug={slug}
      tenant={tenant}
      services={services}
      packages={packages}
      backHref={bookPath(slug)}
    />
  );
}
