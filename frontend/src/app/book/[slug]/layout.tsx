import { notFound } from 'next/navigation';
import { getPublicProfileResolved } from '@/lib/get-public-profile-resolved';
import { resolvePublicBookingLocale } from '@/lib/server-public-locale';
import { I18nProvider } from '@/i18n';

export const dynamic = 'force-dynamic';
import { PublicBookingAssistantHost } from '@/components/public-booking/public-booking-assistant-host';
import { PublicBookingFooter } from '@/components/public-booking/public-booking-footer';
import { PublicBookingShell } from '@/components/public-booking/public-booking-shell';
import { PublicGrowthWidgetsHost } from '@/components/public-booking/public-growth-widgets-host';

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

  const visitorLocale = await resolvePublicBookingLocale(tenant.locale);
  const primary = tenant.branding.primaryColor || '#7c3aed';

  return (
    <I18nProvider initialLocale={visitorLocale} localeCookie="public">
      <div
        className="min-h-screen bg-[#f5f5f7] text-gray-900 [color-scheme:light]"
        lang={visitorLocale}
      >
        <style>{`:root { --tenant-primary: ${primary}; }`}</style>
        <PublicBookingShell slug={slug}>{children}</PublicBookingShell>
        <PublicGrowthWidgetsHost tenant={tenant} />
        <PublicBookingAssistantHost slug={slug} tenant={tenant} />
        <PublicBookingFooter />
      </div>
    </I18nProvider>
  );
}
