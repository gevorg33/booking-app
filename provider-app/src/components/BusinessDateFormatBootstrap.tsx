import { useEffect } from 'react';
import { readAuthBusinessDateFormats } from '../lib/business-date-format';
import { useAuthStore } from '../services/auth-store';

/** Ensures auth business date/time formats are available after login or persisted session. */
export function BusinessDateFormatBootstrap() {
  const business = useAuthStore((s) => s.business);

  useEffect(() => {
    readAuthBusinessDateFormats(business);
  }, [business?.dateFormat, business?.timeFormat, business?.id]);

  return null;
}
