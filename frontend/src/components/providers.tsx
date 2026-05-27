'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';
import { I18nProvider, type AppLocale } from '@/i18n';
import { ThemeProvider } from '@/components/theme-provider';

export function Providers({
  children,
  initialLocale = 'en',
}: {
  children: ReactNode;
  initialLocale?: AppLocale;
}) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 30_000, retry: 1 },
        },
      }),
  );

  return (
    <ThemeProvider>
      <I18nProvider initialLocale={initialLocale}>
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      </I18nProvider>
    </ThemeProvider>
  );
}
