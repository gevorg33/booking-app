'use client';

import { Share2 } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useI18n } from '@/i18n';
import {
  claimPublicReferralCode,
  getPublicCustomerReferralProgram,
  type PublicBusinessProfile,
  type PublicReferralProgram,
} from '@/lib/public-api';
import { buildReferralInviteUrl, claimPendingReferralAfterSignIn } from '@/lib/public-referral.util';
import { trackAppAnalyticsEvent } from '@/lib/app-analytics';

export function PublicAccountGrowthSection({
  slug,
  tenant,
  customerId,
}: {
  slug: string;
  tenant: Pick<PublicBusinessProfile, 'name'>;
  customerId: string;
}) {
  const { t } = useI18n();
  const [program, setProgram] = useState<PublicReferralProgram | null>(null);

  useEffect(() => {
    if (!customerId) return;
    let cancelled = false;
    void (async () => {
      await claimPendingReferralAfterSignIn(slug, (code) => claimPublicReferralCode(slug, code));
      const view = await getPublicCustomerReferralProgram(slug).catch(() => null);
      if (!cancelled && view) setProgram(view);
    })();
    return () => {
      cancelled = true;
    };
  }, [customerId, slug]);

  const onShare = useCallback(async () => {
    if (!program) return;
    const url =
      program.shareUrl ||
      buildReferralInviteUrl(window.location.origin, slug, program.referralCode);
    const payload = {
      title: tenant.name,
      text: t('public.referralShareText').replace('{businessName}', tenant.name),
      url,
    };
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share(payload);
        trackAppAnalyticsEvent('referral_sent', { referralCode: program.referralCode });
        return;
      } catch {
        /* fall through */
      }
    }
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(`${payload.text}\n${url}`);
    }
    trackAppAnalyticsEvent('referral_sent', { referralCode: program.referralCode });
  }, [program, slug, t, tenant.name]);

  if (!program?.enabled) return null;

  return (
    <div id="account-growth" className="mt-4 bg-white rounded-2xl border border-gray-100 px-5 py-4">
      <p className="text-sm font-medium text-gray-900">{t('public.referralSectionTitle')}</p>
      <p className="text-sm text-gray-600 mt-2">
        {program.referrerRewardSummary
          ? t('public.referralSectionBodyDynamic')
              .replace('{referrerReward}', program.referrerRewardSummary)
              .replace('{refereeBonus}', String(program.refereeBonusPoints))
          : t('public.referralSectionBody')
              .replace('{referrerBonus}', String(program.referrerBonusPoints))
              .replace('{refereeBonus}', String(program.refereeBonusPoints))}
      </p>
      <p className="text-sm text-gray-800 mt-3">
        {t('public.referralYourCode')}: <strong>{program.referralCode}</strong>
      </p>
      {program.conversionsCount > 0 ? (
        <p className="text-xs text-gray-500 mt-1">
          {t('public.referralConversions').replace('{count}', String(program.conversionsCount))}
        </p>
      ) : null}
      <button
        type="button"
        onClick={() => void onShare()}
        className="mt-4 inline-flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-800 hover:bg-gray-50"
      >
        <Share2 className="w-4 h-4" />
        {t('public.referralShareAction')}
      </button>
    </div>
  );
}
