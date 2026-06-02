import { notFound } from 'next/navigation';
import { getPublicProfile } from '@/lib/public-api';
import { PublicBookingAssistantHost } from '@/components/public-booking/public-booking-assistant-host';
import { PublicLocaleBootstrap } from '@/components/public-booking/public-locale-bootstrap';
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
    tenant = await getPublicProfile(slug);
  } catch {
    notFound();
  }

  const primary = tenant.branding.primaryColor || '#7c3aed';

  return (
    <div className="min-h-screen bg-[#f5f5f7] text-gray-900 [color-scheme:light]">
      <style>{`:root { --tenant-primary: ${primary}; }`}</style>
      <PublicLocaleBootstrap businessLocale={tenant.locale} />
      <PublicBookingShell slug={slug}>{children}</PublicBookingShell>
      <PublicGrowthWidgetsHost tenant={tenant} />
      <PublicBookingAssistantHost slug={slug} tenant={tenant} />
      <PublicBookingFooter />
    </div>
  );
}
