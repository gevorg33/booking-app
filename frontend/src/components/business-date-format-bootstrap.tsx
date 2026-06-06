'use client';

import { useEffect } from 'react';
import {
  bootstrapAuthBusinessDateFormats,
  resolveBootstrapDateFormatPreference,
  type BusinessDateFormat,
  type BusinessDateFormatPreference,
  type BusinessTimeFormat,
} from '@/lib/business-date-format';

export function BusinessDateFormatBootstrap({
  business,
  dateFormat,
  timeFormat,
}: {
  business?: BusinessDateFormatPreference | null;
  dateFormat?: BusinessDateFormat;
  timeFormat?: BusinessTimeFormat;
}) {
  const preference = resolveBootstrapDateFormatPreference({
    business,
    dateFormat,
    timeFormat,
  });

  bootstrapAuthBusinessDateFormats(preference);

  useEffect(() => {
    bootstrapAuthBusinessDateFormats(preference);
  }, [preference?.dateFormat, preference?.timeFormat]);

  return null;
}
