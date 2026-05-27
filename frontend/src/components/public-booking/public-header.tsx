'use client';

import Link from 'next/link';
import { ChevronDown, ChevronLeft } from 'lucide-react';
import type { PublicBusinessProfile } from '@/lib/public-api';
import { bookPath } from '@/lib/tenant-host';

interface PublicHeaderProps {
  tenant: PublicBusinessProfile;
  showBack?: boolean;
  backHref?: string;
}

export function PublicHeader({ tenant, showBack, backHref }: PublicHeaderProps) {
  const primary = tenant.branding.primaryColor || '#7c3aed';

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-100">
      <div className="max-w-lg mx-auto px-4 py-3 flex items-start gap-3">
        {showBack && backHref && (
          <Link href={backHref} className="mt-2 p-1 -ml-1 text-gray-600 hover:text-gray-900">
            <ChevronLeft className="w-5 h-5" />
          </Link>
        )}

        {tenant.branding.logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={tenant.branding.logoUrl}
            alt={tenant.name}
            className="w-11 h-11 rounded-full object-cover shrink-0"
          />
        ) : (
          <div
            className="w-11 h-11 rounded-full shrink-0 flex items-center justify-center text-white text-xs font-bold"
            style={{ backgroundColor: primary }}
          >
            {tenant.name.slice(0, 2).toUpperCase()}
          </div>
        )}

        <div className="min-w-0 flex-1">
          <Link
            href={bookPath(tenant.slug, '/profile')}
            className="inline-flex items-center gap-1 font-semibold text-gray-900 hover:opacity-80"
          >
            <span className="truncate">{tenant.name}</span>
            <ChevronDown className="w-4 h-4 shrink-0 text-gray-400" />
          </Link>
          {tenant.address && (
            <p className="text-xs text-gray-500 truncate mt-0.5">{tenant.address}</p>
          )}
        </div>
      </div>
    </header>
  );
}
