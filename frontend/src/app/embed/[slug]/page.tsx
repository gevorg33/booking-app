import Link from 'next/link';
import { Calendar } from 'lucide-react';
import { getPublicProfileResolved } from '@/lib/get-public-profile-resolved';;
import { bookPath } from '@/lib/tenant-host';
import { getMessages, translate } from '@/i18n';
import { resolvePublicBookingLocale } from '@/lib/server-public-locale';

export default async function EmbedBookingPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const tenant = await getPublicProfileResolved(slug);
  const primary = tenant.branding.primaryColor || '#2563eb';
  const locale = await resolvePublicBookingLocale(tenant.locale);
  const messages = getMessages(locale);
  const t = (key: string) => translate(messages, key);
  const servicesUrl = bookPath(slug, '/services');

  return (
    <div className="min-h-[320px] flex flex-col items-center justify-center p-6 text-center bg-white">
      {tenant.branding.logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={tenant.branding.logoUrl}
          alt={tenant.name}
          className="h-12 w-auto object-contain mb-4"
        />
      ) : (
        <h1 className="text-xl font-bold mb-2 text-gray-900">{tenant.name}</h1>
      )}
      {tenant.branding.tagline && (
        <p className="text-sm text-gray-500 mb-6 max-w-xs">{tenant.branding.tagline}</p>
      )}
      <Link
        href={servicesUrl}
        target="_top"
        className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-white font-medium transition-opacity hover:opacity-90"
        style={{ backgroundColor: primary }}
      >
        <Calendar className="w-5 h-5" />
        {t('embed.bookNow')}
      </Link>
      <p className="text-[10px] text-gray-400 mt-6">{t('common.poweredBy')}</p>
    </div>
  );
}
