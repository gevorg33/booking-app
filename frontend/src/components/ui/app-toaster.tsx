'use client';

import { useTheme } from '@/components/theme-provider';
import { Toaster } from 'sonner';

export function AppToaster() {
  const { theme } = useTheme();

  return (
    <Toaster
      richColors
      closeButton
      position="bottom-right"
      theme={theme === 'light' ? 'light' : 'dark'}
      toastOptions={{
        classNames: {
          toast:
            'group toast !rounded-xl !border !shadow-lg !text-sm dark:!bg-gray-900 dark:!border-gray-700',
          title: '!text-sm !font-medium',
          description: '!text-sm',
          success: 'dark:!border-green-800',
          error: 'dark:!border-red-800',
        },
      }}
    />
  );
}
