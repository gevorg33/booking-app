import Link from 'next/link';
import { getPublicProfile } from '@/lib/public-api';
import { bookPath } from '@/lib/tenant-host';
import { PublicHeader } from '@/components/public-booking/public-header';
import { Mail, MapPin, Phone } from 'lucide-react';

export default async function TenantProfilePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const tenant = await getPublicProfile(slug);
  const primary = tenant.branding.primaryColor || '#7c3aed';

  return (
    <div>
      <PublicHeader tenant={tenant} showBack backHref={bookPath(slug)} />
      <main className="max-w-lg mx-auto px-4 py-6">
        <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm text-center">
          {tenant.branding.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={tenant.branding.logoUrl}
              alt={tenant.name}
              className="w-20 h-20 rounded-full object-cover mx-auto mb-4"
            />
          ) : (
            <div
              className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center text-white text-xl font-bold"
              style={{ backgroundColor: primary }}
            >
              {tenant.name.slice(0, 2).toUpperCase()}
            </div>
          )}
          <h1 className="text-2xl font-bold text-gray-900">{tenant.name}</h1>
          {tenant.branding.tagline && (
            <p className="text-gray-500 mt-1">{tenant.branding.tagline}</p>
          )}
          {tenant.description && (
            <p className="text-gray-600 mt-4 text-sm leading-relaxed">{tenant.description}</p>
          )}

          <div className="mt-6 space-y-3 text-left">
            {tenant.address && (
              <div className="flex items-start gap-3 text-sm text-gray-600">
                <MapPin className="w-4 h-4 mt-0.5 shrink-0 text-gray-400" />
                <span>{tenant.address}</span>
              </div>
            )}
            {tenant.phone && (
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <Phone className="w-4 h-4 shrink-0 text-gray-400" />
                <a href={`tel:${tenant.phone}`} className="hover:text-gray-900">{tenant.phone}</a>
              </div>
            )}
            {tenant.email && (
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <Mail className="w-4 h-4 shrink-0 text-gray-400" />
                <a href={`mailto:${tenant.email}`} className="hover:text-gray-900">{tenant.email}</a>
              </div>
            )}
          </div>

          <Link
            href={bookPath(slug, '/professionals')}
            className="inline-block mt-8 w-full py-3.5 rounded-2xl font-semibold text-white text-center"
            style={{ backgroundColor: primary }}
          >
            Book an appointment
          </Link>
        </div>
      </main>
    </div>
  );
}
