'use client';

import { PublicCustomerAuthProvider } from '@/lib/public-customer-auth';
import type { ReactNode } from 'react';

export function PublicBookingShell({ slug, children }: { slug: string; children: ReactNode }) {
  return <PublicCustomerAuthProvider slug={slug}>{children}</PublicCustomerAuthProvider>;
}
