import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Script from 'next/script';
import './globals.css';
import { Providers } from '@/components/providers';
import { getServerLocale } from '@/lib/server-locale';
import { THEME_INIT_SCRIPT } from '@/lib/theme';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'OptiSchedule — AI Scheduling Platform',
  description: 'AI-native scheduling and operational orchestration platform',
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const initialLocale = await getServerLocale();

  return (
    <html lang={initialLocale} suppressHydrationWarning>
      <body
        className={`${inter.className} bg-gray-50 text-gray-900 dark:bg-gray-950 dark:text-gray-100 min-h-screen`}
      >
        <Script id="optischedule-theme-init" strategy="beforeInteractive">
          {THEME_INIT_SCRIPT}
        </Script>
        <Providers initialLocale={initialLocale}>{children}</Providers>
      </body>
    </html>
  );
}
