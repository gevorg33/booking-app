import { notFound } from 'next/navigation';
import { I18nProvider, type AppLocale } from '@/i18n';
import { getPublicProfileResolved } from '@/lib/get-public-profile-resolved';;
import { PublicDateFormatBootstrap } from '@/components/public-booking/public-date-format-bootstrap';
import { resolvePublicBookingLocale } from '@/lib/server-public-locale';

export const dynamic = 'force-dynamic';

export default async function EmbedLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  let tenant;
  try {
    tenant = await getPublicProfileResolved(slug);
  } catch {
    notFound();
  }

  const visitorLocale = await resolvePublicBookingLocale({
    defaultLocale: tenant.defaultLocale ?? tenant.locale,
    enabledLocales: tenant.enabledLocales,
    locale: tenant.locale,
  });

  return (
    <I18nProvider
      initialLocale={visitorLocale}
      localeCookie="public"
      enabledLocales={tenant.enabledLocales as AppLocale[] | undefined}
    >
      <div className="min-h-screen bg-white" lang={visitorLocale}>
        <PublicDateFormatBootstrap tenant={tenant} />
        {children}
      </div>
    </I18nProvider>
  );
}
