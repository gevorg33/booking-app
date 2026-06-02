'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { claimPublicGiftCard } from '@/lib/public-api';
import { bookPath } from '@/lib/tenant-host';
import { useI18n } from '@/i18n';

export function PublicGiftCardClaimSection({
  slug,
  onClaimed,
}: {
  slug: string;
  onClaimed?: () => void;
}) {
  const { t } = useI18n();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleClaim(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = code.trim();
    if (!trimmed) return;
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const result = await claimPublicGiftCard(slug, trimmed);
      if (result.cardType === 'package') {
        setSuccess(t('public.giftCards.claimPackageSuccess'));
      } else if (result.cardType === 'subscription') {
        setSuccess(t('public.giftCards.claimSubscriptionSuccess'));
      } else if (result.cardType === 'service') {
        setSuccess(t('public.giftCards.claimServiceSuccess'));
      } else if (result.cardType === 'bundle') {
        setSuccess(t('public.giftCards.claimBundleSuccess'));
      } else {
        setSuccess(t('public.giftCards.claimSuccess'));
      }
      setCode('');
      onClaimed?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('common.errorGeneric'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="rounded-2xl border border-gray-200 bg-gray-50 p-4 space-y-3 mt-8">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">{t('public.giftCards.redeemSectionTitle')}</h2>
        <h3 className="text-sm font-medium text-gray-800 mt-2">{t('public.giftCards.claimTitle')}</h3>
        <p className="text-xs text-gray-600 mt-1">{t('public.giftCards.claimHint')}</p>
        <p className="text-xs text-gray-500 mt-2">
          {t('public.giftCards.claimNotBuying')}{' '}
          <Link href={bookPath(slug, '/gift-cards')} className="text-violet-700 font-medium underline">
            {t('public.giftCards.buyGiftCard')}
          </Link>
        </p>
      </div>
      <form onSubmit={handleClaim} className="flex flex-col sm:flex-row gap-2">
        <input
          type="text"
          className="flex-1 rounded-xl border border-gray-200 px-4 py-2.5 text-gray-900 font-mono text-sm uppercase"
          placeholder={t('public.giftCards.claimPlaceholder')}
          value={code}
          onChange={(e) => setCode(e.target.value)}
          autoComplete="off"
        />
        <button
          type="submit"
          disabled={loading || !code.trim()}
          className="rounded-xl px-4 py-2.5 text-sm font-semibold text-white bg-violet-600 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          {t('public.giftCards.claimSubmit')}
        </button>
      </form>
      {error && <p className="text-xs text-red-600">{error}</p>}
      {success && <p className="text-xs text-green-700">{success}</p>}
    </section>
  );
}
