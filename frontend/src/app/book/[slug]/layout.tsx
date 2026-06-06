import { notFound } from 'next/navigation';
import { getPublicProfileResolved } from '@/lib/get-public-profile-resolved';
import { resolvePublicBookingLocale } from '@/lib/server-public-locale';
import { I18nProvider, type AppLocale } from '@/i18n';

export const dynamic = 'force-dynamic';
import { PublicBookingAssistantHost } from '@/components/public-booking/public-booking-assistant-host';
import { PublicBookingFooter } from '@/components/public-booking/public-booking-footer';
import { PublicBookingShell } from '@/components/public-booking/public-booking-shell';
import { PublicDateFormatBootstrap } from '@/components/public-booking/public-date-format-bootstrap';
import { PublicGrowthWidgetsHost } from '@/components/public-booking/public-growth-widgets-host';
import { CookieConsentBanner } from '@/components/public-booking/cookie-consent-banner';

export default async function PublicBookingLayout({
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
  const primary = tenant.branding.primaryColor || '#7c3aed';

  return (
    <I18nProvider
      initialLocale={visitorLocale}
      localeCookie="public"
      enabledLocales={tenant.enabledLocales as AppLocale[] | undefined}
    >
      <div
        className="min-h-screen bg-[#f5f5f7] text-gray-900 [color-scheme:light]"
        lang={visitorLocale}
      >
        <style>{`:root { --tenant-primary: ${primary}; }`}</style>
        <PublicDateFormatBootstrap tenant={tenant} />
        <PublicBookingShell slug={slug}>{children}</PublicBookingShell>
        <PublicGrowthWidgetsHost tenant={tenant} />
        <PublicBookingAssistantHost slug={slug} tenant={tenant} />
        <PublicBookingFooter />
        <CookieConsentBanner slug={slug} tenant={tenant} />
      </div>
    </I18nProvider>
  );
}
