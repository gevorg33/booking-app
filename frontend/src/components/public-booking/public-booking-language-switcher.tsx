'use client';

import { LanguageSwitcher } from '@/components/language-switcher';

/**
 * Persists locale via LanguageSwitcher, then reloads so server-rendered public pages
 * refetch services (and categories) with the matching ?locale= query.
 */
export function PublicBookingLanguageSwitcher() {
  return (
    <LanguageSwitcher
      variant="light"
      compact
      onChange={() => {
        window.location.reload();
      }}
    />
  );
}
