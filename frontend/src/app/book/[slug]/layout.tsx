import { notFound } from 'next/navigation';
import { getPublicProfile } from '@/lib/public-api';
import { PublicBookingAssistantHost } from '@/components/public-booking/public-booking-assistant-host';

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
    <div className="min-h-screen bg-[#f5f5f7] text-gray-900">
      <style>{`:root { --tenant-primary: ${primary}; }`}</style>
      {children}
      <PublicBookingAssistantHost slug={slug} tenant={tenant} />
      <footer className="max-w-lg mx-auto px-4 py-8 text-center text-xs text-gray-400">
        Powered by OptiSchedule
      </footer>
    </div>
  );
}
