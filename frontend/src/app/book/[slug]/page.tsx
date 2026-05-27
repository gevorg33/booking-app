import Link from 'next/link';
import { ChevronRight, Users } from 'lucide-react';
import { getPublicProfile } from '@/lib/public-api';
import { bookPath } from '@/lib/tenant-host';
import { PublicHeader } from '@/components/public-booking/public-header';

export default async function PublicBookingHomePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const tenant = await getPublicProfile(slug);
  const primary = tenant.branding.primaryColor || '#7c3aed';

  return (
    <div>
      <PublicHeader tenant={tenant} />
      <main className="max-w-lg mx-auto px-4 py-6">
      <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm">
        <div className="p-6 pb-4">
          {tenant.branding.tagline && (
            <p className="text-sm text-gray-500 mb-2">{tenant.branding.tagline}</p>
          )}
          {tenant.description && (
            <p className="text-sm text-gray-600">{tenant.description}</p>
          )}
        </div>

        <Link
          href={bookPath(slug, '/professionals')}
          className="flex items-center gap-4 px-6 py-5 border-t border-gray-100 hover:bg-gray-50 transition-colors"
        >
          <div
            className="w-11 h-11 rounded-full flex items-center justify-center shrink-0"
            style={{ backgroundColor: `${primary}18`, color: primary }}
          >
            <Users className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <span className="block font-medium text-gray-900">Choose a specialist</span>
            <span className="block text-sm text-gray-500 mt-0.5">
              Or use the AI assistant to find your service and time
            </span>
          </div>
          <ChevronRight className="w-5 h-5 text-gray-400" />
        </Link>
      </div>
      </main>
    </div>
  );
}
