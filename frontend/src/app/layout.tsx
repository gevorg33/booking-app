import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/providers';
import { ThemeInitScript } from '@/components/theme-init-script';
import { getServerLocale } from '@/lib/server-locale';

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
        <ThemeInitScript />
        <Providers initialLocale={initialLocale}>{children}</Providers>
      </body>
    </html>
  );
}
