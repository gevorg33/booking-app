import { IonButton, IonIcon, IonSpinner, useIonToast } from '@ionic/react';
import { repeatOutline, shareOutline, peopleOutline } from 'ionicons/icons';
import { useQuery } from '@tanstack/react-query';
import { useCallback, useMemo, useState } from 'react';
import { useHistory } from 'react-router-dom';
import type { ConsumerCopy } from '../lib/consumer-copy.types.js';
import { formatCopy } from '../lib/copy.js';
import { formatScheduleTime } from '../lib/date-format.js';
import {
  resolveAccountRebookTarget,
  shareReferralInvite,
  shareSalonLink,
  trackRebookTap,
} from '../lib/consumer-growth-loops.util.js';
import type { PublicBusinessProfile, PublicCustomerBookingItem } from '../lib/types.js';
import { getStoredCustomerProfile } from '../lib/customer-auth.js';
import { fetchMyReferralProgram } from '../services/public-api.js';

export function ConsumerAccountGrowthCard({
  slug,
  profile,
  copy,
  bookings,
  loading,
}: {
  slug: string;
  profile: PublicBusinessProfile;
  copy: ConsumerCopy;
  bookings: PublicCustomerBookingItem[];
  loading: boolean;
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
    trackRebookTap(rebook.booking.id, slug);
    history.push(rebook.path);
  }, [history, rebook, slug]);

  const onShareSalon = useCallback(async () => {
    setBusy('share');
    try {
      const result = await shareSalonLink({
        slug,
        businessName: profile.name,
        serviceId: rebook?.booking.serviceId,
        serviceName: rebook?.booking.serviceName,
        employeeId: rebook?.booking.employeeId,
      });
      await toastShareResult(result);
    } finally {
      setBusy(null);
    }
  }, [profile.name, rebook, slug, toastShareResult]);

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
    <div className="salon-card" style={{ marginTop: 16 }}>
      <h2 style={{ fontWeight: 600, marginBottom: 12 }}>{copy.growthSectionTitle}</h2>

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
          <IonButton expand="block" onClick={onRebook}>
            <IonIcon slot="start" icon={repeatOutline} />
            {copy.growthRebookAction}
          </IonButton>
        </div>
      ) : null}

      <IonButton expand="block" fill="outline" onClick={() => void onShareSalon()} disabled={busy === 'share'}>
        <IonIcon slot="start" icon={shareOutline} />
        {copy.growthShareSalonAction}
      </IonButton>

      {customer?.id ? (
        <IonButton
          expand="block"
          fill="outline"
          style={{ marginTop: 8 }}
          onClick={() => void onRefer()}
          disabled={busy === 'refer'}
        >
          <IonIcon slot="start" icon={peopleOutline} />
          {copy.growthReferAction}
        </IonButton>
      ) : (
        <p style={{ fontSize: '0.8125rem', color: '#6b7280', marginTop: 8 }}>
          {formatCopy(copy.growthReferSubtitle, { businessName: profile.name })}
        </p>
      )}
    </div>
  );
}
