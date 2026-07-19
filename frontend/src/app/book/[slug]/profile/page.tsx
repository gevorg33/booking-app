import Link from 'next/link';
import { getPublicProfileResolved } from '@/lib/get-public-profile-resolved';
import { getPublicGiftCardCatalog } from '@/lib/public-api';
import { bookPath } from '@/lib/tenant-host';
import { PublicHeader } from '@/components/public-booking/public-header';
import { Clock, Globe, Mail, MapPin, Phone } from 'lucide-react';
import { getMessages, translate } from '@/i18n';
import { resolvePublicBookingLocale } from '@/lib/server-public-locale';
import { resolvePublicImageUrl } from '@/lib/resolve-public-image-url';

function socialHref(url: string) {
  if (!url) return '#';
  return url.startsWith('http') ? url : `https://${url}`;
}

export default async function TenantProfilePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const tenant = await getPublicProfileResolved(slug);
  let giftCardsEnabled = false;
  try {
    const catalog = await getPublicGiftCardCatalog(slug);
    giftCardsEnabled = catalog.purchaseEnabled;
  } catch {
    giftCardsEnabled = false;
  }
  const primary = tenant.branding.primaryColor || '#7c3aed';
  const logoSrc = resolvePublicImageUrl(tenant.branding.logoUrl);
  const locale = await resolvePublicBookingLocale(tenant.locale);
  const messages = getMessages(locale);
  const t = (key: string) => translate(messages, key);
  const social = tenant.social ?? {};
  const socialEntries = [
    { label: 'Website', url: social.website },
    { label: 'Instagram', url: social.instagram },
    { label: 'Facebook', url: social.facebook },
    { label: 'X', url: social.x },
    { label: 'TikTok', url: social.tiktok },
    { label: 'LinkedIn', url: social.linkedin },
    { label: 'YouTube', url: social.youtube },
  ].filter((item) => item.url);

  return (
    <div>
      <PublicHeader tenant={tenant} showBack backHref={bookPath(slug)} />
      <main className="max-w-lg mx-auto px-4 py-6 space-y-4">
        <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm text-center">
          {logoSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={logoSrc}
              alt={tenant.name}
              className="w-20 h-20 rounded-full object-contain bg-white mx-auto mb-4 border border-gray-100"
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
            <p className="text-gray-600 mt-4 text-sm leading-relaxed text-left">{tenant.description}</p>
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
            {tenant.openingHours?.summaryLines?.length ? (
              <div className="mt-2 text-sm text-gray-600">
                <div className="flex items-center gap-3 mb-1.5">
                  <Clock className="w-4 h-4 shrink-0 text-gray-400" />
                  <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                    {t('public.hours')}
                  </span>
                </div>
                <ul className="space-y-0.5 pl-7">
                  {tenant.openingHours.summaryLines.map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>

          {socialEntries.length > 0 && (
            <div className="mt-6 text-left">
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">{t('public.followUs')}</p>
              <div className="flex flex-wrap gap-2">
                {socialEntries.map((item) => (
                  <a
                    key={item.label}
                    href={socialHref(item.url!)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm bg-gray-50 text-gray-700 border border-gray-200 hover:border-gray-300"
                  >
                    <Globe className="w-3.5 h-3.5" />
                    {item.label}
                  </a>
                ))}
              </div>
            </div>
          )}

          <Link
            href={bookPath(slug, '/professionals')}
            className="inline-block mt-8 w-full py-3.5 rounded-2xl font-semibold text-white text-center"
            style={{ backgroundColor: primary }}
          >
            {t('public.bookAppointment')}
          </Link>
          {giftCardsEnabled && (
            <Link
              href={bookPath(slug, '/gift-cards')}
              className="inline-block mt-3 w-full py-3.5 rounded-2xl font-semibold text-center border-2"
              style={{ borderColor: primary, color: primary }}
            >
              {t('public.giftCards.buyGiftCard')}
            </Link>
          )}
        </div>

        {tenant.location?.mapEmbedHtml && (
          <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm">
            <div className="px-4 py-3 border-b border-gray-100">
              <p className="text-sm font-medium text-gray-900">{t('public.location')}</p>
            </div>
            <div
              className="w-full [&>iframe]:w-full [&>iframe]:min-h-[300px] [&>iframe]:border-0"
              dangerouslySetInnerHTML={{ __html: tenant.location.mapEmbedHtml }}
            />
          </div>
        )}
      </main>
    </div>
  );
}
