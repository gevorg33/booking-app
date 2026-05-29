import { getPublicProfile, getPublicServices } from '@/lib/public-api';
import { bookPath } from '@/lib/tenant-host';
import { AnyServicesClient } from './any-services-client';

export default async function AnySpecialistServicesPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [tenant, { services }] = await Promise.all([
    getPublicProfile(slug),
    getPublicServices(slug),
  ]);

  return (
    <AnyServicesClient
      slug={slug}
      tenant={tenant}
      services={services}
      backHref={bookPath(slug)}
    />
  );
}
