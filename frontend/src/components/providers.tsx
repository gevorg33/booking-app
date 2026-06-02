'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';
import { I18nProvider, type AppLocale } from '@/i18n';
import { ThemeProvider } from '@/components/theme-provider';
import { AppDialogHost } from '@/components/app-dialog-host';
import { AppToaster } from '@/components/ui/app-toaster';
import { OperationFeedbackHost } from '@/components/operation-feedback/operation-feedback-host';

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
        <QueryClientProvider client={queryClient}>
          {children}
          <AppToaster />
          <AppDialogHost />
          <OperationFeedbackHost />
        </QueryClientProvider>
      </I18nProvider>
    </ThemeProvider>
  );
}
