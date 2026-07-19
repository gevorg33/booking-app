import { IonIcon, IonSpinner, useIonToast } from '@ionic/react';
import { repeatOutline, shareOutline, peopleOutline } from 'ionicons/icons';
import { useQuery } from '@tanstack/react-query';
import { useCallback, useMemo, useState } from 'react';
import { useHistory } from 'react-router-dom';
import type { RefObject } from 'react';
import type { ConsumerCopy } from '../lib/consumer-copy.types.js';
import { formatCopy } from '../lib/copy.js';
import { formatScheduleTime } from '../lib/date-format.js';
import {
  resolveAccountRebookTarget,
  shareReferralInvite,
  trackRebookTap,
} from '../lib/consumer-growth-loops.util.js';
import {
  shareSalonLinkWithReward,
  formatShareRewardToast,
} from '../lib/consumer-share-flow.util.js';
import type { PublicBusinessProfile, PublicCustomerBookingItem } from '../lib/types.js';
import { getStoredCustomerProfile } from '../lib/customer-auth.js';
import { claimShareReward, fetchMyReferralProgram } from '../services/public-api.js';
import { ConsumerActionButton } from './ConsumerActionButton.js';

export function ConsumerAccountGrowthCard({
  slug,
  profile,
  copy,
  bookings,
  loading,
  sectionRef,
}: {
  slug: string;
  profile: PublicBusinessProfile;
  copy: ConsumerCopy;
  bookings: PublicCustomerBookingItem[];
  loading: boolean;
  sectionRef?: RefObject<HTMLDivElement | null>;
}) {
  const history = useHistory();
  const [presentToast] = useIonToast();
  const [busy, setBusy] = useState<'share' | 'refer' | null>(null);
  const customer = getStoredCustomerProfile(slug);

  const referralQuery = useQuery({
    queryKey: ['referral-program', slug],
    queryFn: () => fetchMyReferralProgram(slug),
    enabled: Boolean(customer?.id),
  });

  const rebook = useMemo(
    () => resolveAccountRebookTarget(bookings, slug),
    [bookings, slug],
  );

  const toastShareResult = useCallback(
    async (result: 'shared' | 'copied' | 'unavailable') => {
      if (result === 'copied') {
        await presentToast({ message: copy.growthShareCopied, duration: 2000 });
      } else if (result === 'unavailable') {
        await presentToast({ message: copy.growthShareUnavailable, duration: 2500 });
      }
    },
    [copy.growthShareCopied, copy.growthShareUnavailable, presentToast],
  );

  const onRebook = useCallback(() => {
    if (!rebook) return;
    trackRebookTap(rebook.booking.id, slug, 'account');
    history.push(rebook.path);
  }, [history, rebook, slug]);

  const onShareSalon = useCallback(async () => {
    setBusy('share');
    try {
      const { status, reward } = await shareSalonLinkWithReward({
        slug,
        businessName: profile.name,
        serviceId: rebook?.booking.serviceId,
        serviceName: rebook?.booking.serviceName,
        employeeId: rebook?.booking.employeeId,
        claimReward: customer?.id
          ? () => claimShareReward(slug, 'salon')
          : undefined,
      });
      const rewardMessage = formatShareRewardToast(reward, copy.growthShareRewardEarned);
      if (rewardMessage) {
        await presentToast({ message: rewardMessage, duration: 3000 });
      } else {
        await toastShareResult(status);
      }
    } finally {
      setBusy(null);
    }
  }, [
    copy.growthShareRewardEarned,
    customer?.id,
    presentToast,
    profile.name,
    rebook,
    slug,
    toastShareResult,
  ]);

  const onRefer = useCallback(async () => {
    if (!customer?.id) return;
    setBusy('refer');
    try {
      const program = referralQuery.data ?? (await fetchMyReferralProgram(slug));
      const result = await shareReferralInvite({
        slug,
        customerId: customer.id,
        businessName: profile.name,
        shareTitle: copy.growthReferTitle,
        shareText: program.refereePromoCode
          ? `${copy.growthReferSubtitle} Code: ${program.refereePromoCode}.`
          : copy.growthReferSubtitle,
        shareUrl: program.shareUrl,
      });
      await toastShareResult(result);
    } finally {
      setBusy(null);
    }
  }, [
    copy.growthReferSubtitle,
    copy.growthReferTitle,
    customer?.id,
    profile.name,
    referralQuery.data,
    slug,
    toastShareResult,
  ]);

  if (loading) {
    return (
      <div className="salon-card" style={{ marginTop: 16 }}>
        <IonSpinner />
      </div>
    );
  }

  return (
    <div className="salon-card" style={{ marginTop: 16 }} ref={sectionRef} id="account-growth">
      <h2 style={{ fontWeight: 600, marginBottom: 12 }}>{copy.growthSectionTitle}</h2>

      {referralQuery.data?.enabled ? (
        <div style={{ marginBottom: 16, fontSize: '0.875rem', color: '#4b5563' }}>
          <p style={{ marginBottom: 6 }}>
            {copy.growthReferTitle}: <strong>{referralQuery.data.referralCode}</strong>
          </p>
          <p style={{ margin: 0 }}>
            {formatCopy(copy.growthReferSubtitle, { businessName: profile.name })}
            {referralQuery.data.conversionsCount > 0
              ? ` · ${referralQuery.data.conversionsCount} converted`
              : ''}
          </p>
        </div>
      ) : null}

      {rebook ? (
        <div style={{ marginBottom: 16 }}>
          <p style={{ fontWeight: 600, marginBottom: 4 }}>{copy.growthRebookTitle}</p>
          <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: 8 }}>
            {formatCopy(copy.growthRebookSubtitle, {
              service: rebook.booking.serviceName,
              provider: rebook.booking.employeeName,
              time: formatScheduleTime(rebook.booking.startTime),
            })}
          </p>
          <ConsumerActionButton expand="block" onClick={onRebook}>
            <IonIcon icon={repeatOutline} aria-hidden="true" />
            {copy.growthRebookAction}
          </ConsumerActionButton>
        </div>
      ) : null}

      <ConsumerActionButton
        expand="block"
        fill="outline"
        onClick={() => void onShareSalon()}
        disabled={busy === 'share'}
      >
        <IonIcon icon={shareOutline} aria-hidden="true" />
        {copy.growthShareSalonAction}
      </ConsumerActionButton>

      {customer?.id ? (
        <ConsumerActionButton
          expand="block"
          fill="outline"
          style={{ marginTop: 8 }}
          onClick={() => void onRefer()}
          disabled={busy === 'refer'}
        >
          <IonIcon icon={peopleOutline} aria-hidden="true" />
          {copy.growthReferAction}
        </ConsumerActionButton>
      ) : (
        <p style={{ fontSize: '0.8125rem', color: '#6b7280', marginTop: 8 }}>
          {formatCopy(copy.growthReferSubtitle, { businessName: profile.name })}
        </p>
      )}
    </div>
  );
}
