import { IonSpinner } from '@ionic/react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Ref } from 'react';
import type { ConsumerCopy } from '../lib/consumer-copy.types.js';
import { formatFriendlyNetworkError } from '../lib/consumer-network-ux.util.js';
import { formatWaitlistPreferenceSummary } from '../lib/consumer-waitlist.util.js';
import {
  fetchMyWaitlistStatus,
  joinMyWaitlist,
  leaveMyWaitlist,
} from '../services/public-api.js';
import { ConsumerActionButton } from './ConsumerActionButton.js';

export function ConsumerWaitlistSection({
  slug,
  copy,
  authed,
  sectionRef,
  joinDefaults,
}: {
  slug: string;
  copy: ConsumerCopy;
  authed: boolean;
  sectionRef?: Ref<HTMLElement>;
  /** Prefill when joining from a booking context (service/date/provider). */
  joinDefaults?: {
    serviceId?: string;
    serviceName?: string;
    employeeId?: string;
    employeeName?: string;
    date?: string;
  };
}) {
  const queryClient = useQueryClient();
  const statusQuery = useQuery({
    queryKey: ['customer-waitlist', slug],
    queryFn: () => fetchMyWaitlistStatus(slug),
    enabled: Boolean(slug && authed),
  });

  const joinMutation = useMutation({
    mutationFn: () =>
      joinMyWaitlist(slug, {
        serviceId: joinDefaults?.serviceId,
        serviceName: joinDefaults?.serviceName,
        employeeId: joinDefaults?.employeeId,
        employeeName: joinDefaults?.employeeName,
        date: joinDefaults?.date,
      }),
    onSuccess: (data) => {
      queryClient.setQueryData(['customer-waitlist', slug], data);
    },
  });

  const leaveMutation = useMutation({
    mutationFn: () => leaveMyWaitlist(slug),
    onSuccess: (data) => {
      queryClient.setQueryData(['customer-waitlist', slug], data);
    },
  });

  if (!authed) return null;

  const busy = joinMutation.isPending || leaveMutation.isPending;
  const onWaitlist = statusQuery.data?.onWaitlist === true;
  const summary = formatWaitlistPreferenceSummary(statusQuery.data?.request);
  const actionError = joinMutation.error ?? leaveMutation.error ?? statusQuery.error;
  const errorMessage = actionError
    ? formatFriendlyNetworkError(actionError, copy.networkLoadFailed)
    : null;

  return (
    <section ref={sectionRef} className="salon-card" style={{ marginTop: 16 }} id="account-waitlist">
      <h2 style={{ fontSize: 16, fontWeight: 600 }}>{copy.waitlistSectionTitle}</h2>
      <p style={{ fontSize: 12, color: '#6b7280', marginTop: 8 }}>{copy.waitlistSectionHint}</p>

      {statusQuery.isLoading ? (
        <IonSpinner name="crescent" style={{ marginTop: 12 }} />
      ) : onWaitlist ? (
        <>
          <p style={{ fontSize: 14, fontWeight: 500, marginTop: 12 }}>{copy.waitlistOnList}</p>
          {summary ? (
            <p style={{ fontSize: 12, color: '#4b5563', marginTop: 4 }}>{summary}</p>
          ) : null}
          <ConsumerActionButton
            expand="block"
            fill="outline"
            color="medium"
            style={{ marginTop: 12 }}
            disabled={busy}
            onClick={() => leaveMutation.mutate()}
          >
            {busy && leaveMutation.isPending ? <IonSpinner name="crescent" /> : copy.waitlistLeaveAction}
          </ConsumerActionButton>
        </>
      ) : (
        <>
          <p style={{ fontSize: 14, marginTop: 12 }}>{copy.waitlistNotOnList}</p>
          <ConsumerActionButton
            expand="block"
            style={{ marginTop: 12 }}
            disabled={busy}
            onClick={() => joinMutation.mutate()}
          >
            {busy && joinMutation.isPending ? <IonSpinner name="crescent" /> : copy.waitlistJoinAction}
          </ConsumerActionButton>
        </>
      )}

      {errorMessage ? (
        <p style={{ color: '#b91c1c', fontSize: 12, marginTop: 8 }}>{errorMessage}</p>
      ) : null}
    </section>
  );
}
