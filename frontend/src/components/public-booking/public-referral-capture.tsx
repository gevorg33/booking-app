'use client';

import { useEffect } from 'react';
import { captureReferralFromSearch } from '@/lib/public-referral.util';

export function PublicReferralCapture({ slug }: { slug: string }) {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    captureReferralFromSearch(window.location.search, slug);
  }, [slug]);

  return null;
}
