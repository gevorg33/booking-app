import { getPublicProfile, getPublicServices, getPublicPackages } from '@/lib/public-api';
import { bookPath } from '@/lib/tenant-host';
import { getServerLocale } from '@/lib/server-locale';
import { AnyServicesClient } from './any-services-client';

export default async function AnySpecialistServicesPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const locale = await getServerLocale();
  const [tenant, { services }, { packages }] = await Promise.all([
    getPublicProfile(slug),
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
