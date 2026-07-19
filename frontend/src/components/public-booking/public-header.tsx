'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronDown, ChevronLeft, Gift, Loader2, LogIn, User } from 'lucide-react';
import type { PublicBusinessProfile } from '@/lib/public-api';
import { bookPath } from '@/lib/tenant-host';
import { usePublicCustomerAuth } from '@/lib/public-customer-auth';
import { isPublicGoogleSignInCancelled, isPublicGoogleSignInRedirecting } from '@/lib/public-google-auth';
import { useI18n } from '@/i18n';
import { resolvePublicImageUrl } from '@/lib/resolve-public-image-url';

interface PublicHeaderProps {
  tenant: PublicBusinessProfile;
  showBack?: boolean;
  backHref?: string;
}

export function PublicHeader({ tenant, showBack, backHref }: PublicHeaderProps) {
  const { t } = useI18n();
  const { customer, loading, googleEnabled, signInWithGoogle, clearSignInError } =
    usePublicCustomerAuth();
  const primary = tenant.branding.primaryColor || '#7c3aed';
  const logoSrc = resolvePublicImageUrl(tenant.branding.logoUrl);
  const [signingIn, setSigningIn] = useState(false);
  const [logoFailed, setLogoFailed] = useState(false);

  async function handleSignIn() {
    clearSignInError();
    setSigningIn(true);
    try {
      await signInWithGoogle();
    } catch (err) {
      if (!isPublicGoogleSignInCancelled(err) && !isPublicGoogleSignInRedirecting(err)) {
        console.error('Google sign-in failed', err);
      }
    } finally {
      setSigningIn(false);
    }
  }

  const giftCardsNavLabel = t('public.giftCards.nav');

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-100">
      {/* e2e-bug.57 — min-w-0 + overflow so name truncates beside gift-cards/actions */}
      <div className="mx-auto flex min-w-0 max-w-lg items-center gap-2 px-4 py-3 sm:gap-3">
        {showBack && backHref && (
          <Link href={backHref} className="shrink-0 p-1 -ml-1 text-gray-600 hover:text-gray-900">
            <ChevronLeft className="w-5 h-5" />
          </Link>
        )}

        {logoSrc && !logoFailed ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={logoSrc}
            alt={tenant.name}
            className="w-11 h-11 rounded-full object-contain bg-white shrink-0 border border-gray-100"
            onError={() => setLogoFailed(true)}
          />
        ) : (
          <div
            className="w-11 h-11 rounded-full shrink-0 flex items-center justify-center text-white text-xs font-bold"
            style={{ backgroundColor: primary }}
          >
            {tenant.name.slice(0, 2).toUpperCase()}
          </div>
        )}

        <div className="min-w-0 flex-1 overflow-hidden">
          <Link
            href={bookPath(tenant.slug, '/profile')}
            className="flex min-w-0 max-w-full items-center gap-1 font-semibold text-gray-900 hover:opacity-80"
          >
            <span className="min-w-0 truncate">{tenant.name}</span>
            <ChevronDown className="w-4 h-4 shrink-0 text-gray-400" />
          </Link>
          {tenant.address && (
            <p className="text-xs text-gray-500 truncate mt-0.5">{tenant.address}</p>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          {tenant.giftCardsPurchaseEnabled && (
            <Link
              href={bookPath(tenant.slug, '/gift-cards')}
              aria-label={giftCardsNavLabel}
              title={giftCardsNavLabel}
              className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 px-2.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
            >
              <Gift className="w-3.5 h-3.5 shrink-0" />
              {/* Icon-only under sm so the name column can truncate instead of overlapping */}
              <span className="hidden sm:inline">{giftCardsNavLabel}</span>
            </Link>
          )}
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
          ) : customer ? (
            <Link
              href={bookPath(tenant.slug, '/account')}
              className="inline-flex max-w-[7.5rem] items-center gap-1.5 rounded-full border border-gray-200 px-2.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
              title={customer.email ?? customer.name}
            >
              <User className="w-3.5 h-3.5 shrink-0" />
              <span className="min-w-0 truncate">{customer.name.split(' ')[0]}</span>
            </Link>
          ) : googleEnabled ? (
            <button
              type="button"
              onClick={() => void handleSignIn()}
              disabled={signingIn}
              className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 px-2.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              {signingIn ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <LogIn className="w-3.5 h-3.5" />
              )}
              {t('public.signIn')}
            </button>
          ) : null}
        </div>
      </div>
    </header>
  );
}
