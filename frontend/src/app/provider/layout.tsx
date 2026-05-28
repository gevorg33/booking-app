import type { Metadata, Viewport } from 'next';
import { ProviderAppShell } from '@/components/provider/provider-app-shell';

export const metadata: Metadata = {
  title: 'OptiSchedule Provider',
  description: 'Mobile app for service providers — appointments, schedule, and alerts',
  manifest: '/provider-manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Provider',
  },
  icons: {
    apple: '/icons/provider-icon.svg',
  },
};

export const viewport: Viewport = {
  themeColor: '#2563eb',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

export default function ProviderLayout({ children }: { children: React.ReactNode }) {
  return <ProviderAppShell>{children}</ProviderAppShell>;
}
