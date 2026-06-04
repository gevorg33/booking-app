import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/providers';
import { getServerLocale } from '@/lib/server-locale';
import { getServerTheme } from '@/lib/server-theme';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'OptiSchedule — AI Scheduling Platform',
  description: 'AI-native scheduling and operational orchestration platform',
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [initialLocale, initialTheme] = await Promise.all([getServerLocale(), getServerTheme()]);

  return (
    <html
      lang={initialLocale}
      className={initialTheme === 'dark' ? 'dark' : undefined}
      suppressHydrationWarning
    >
      <body
        className={`${inter.className} bg-gray-50 text-gray-900 dark:bg-gray-950 dark:text-gray-100 min-h-screen`}
      >
        <Providers initialLocale={initialLocale} initialTheme={initialTheme}>
          {children}
        </Providers>
      </body>
    </html>
  );
}
