import {
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonLabel,
  IonSegment,
  IonSegmentButton,
  IonSpinner,
  IonText,
  IonToggle,
} from '@ionic/react';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { useAuthStore } from '../services/auth-store';
import { useI18n } from '../i18n';
import { useBusinessCurrency } from '../lib/use-business-currency';
import { isMobileManagerRole } from '../lib/provider-access';
import {
  fetchProviderMyStats,
  formatScheduledHoursLabel,
  formatStatsPeriodLabel,
  formatUtilizationPercent,
  type ProviderMyStatsPeriod,
  type ProviderMyStatsScope,
} from '../lib/provider-my-stats';
import { renderStarRating } from '../lib/provider-profile';

function StatTile({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="salon-card" style={{ padding: 12, minHeight: 88 }}>
      <p className="booking-meta" style={{ margin: 0 }}>
        {label}
      </p>
      <p style={{ margin: '6px 0 0', fontSize: 22, fontWeight: 700 }}>{value}</p>
      {hint ? (
        <p className="booking-meta" style={{ margin: '4px 0 0' }}>
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export function ProviderMyStatsSection() {
  const { t } = useI18n();
  const { business } = useAuthStore();
  const { formatMoney } = useBusinessCurrency();
  const isManager = isMobileManagerRole(business?.membershipRole);
  const [period, setPeriod] = useState<ProviderMyStatsPeriod>('week');
  const [scope, setScope] = useState<ProviderMyStatsScope>('mine');

  const statsQuery = useQuery({
    queryKey: ['provider-my-stats', business?.id, period, scope],
    queryFn: () =>
      fetchProviderMyStats(business!.id, {
        period,
        scope: isManager && scope === 'team' ? 'team' : 'mine',
      }),
    enabled: !!business?.id,
  });

  const stats = statsQuery.data;
  const effectiveScope =
    isManager && scope === 'team' && stats?.canTeamRollup ? 'team' : 'mine';

  return (
    <IonCard>
      <IonCardHeader>
        <IonCardTitle>{t('provider.myStatsTitle')}</IonCardTitle>
      </IonCardHeader>
      <IonCardContent>
        <IonSegment
          value={period}
          onIonChange={(event) =>
            setPeriod((event.detail.value as ProviderMyStatsPeriod) ?? 'week')
          }
        >
          <IonSegmentButton value="week">
            <IonLabel>{t('provider.myStatsThisWeek')}</IonLabel>
          </IonSegmentButton>
          <IonSegmentButton value="month">
            <IonLabel>{t('provider.myStatsThisMonth')}</IonLabel>
          </IonSegmentButton>
        </IonSegment>

        {isManager ? (
          <IonItemLikeToggle
            checked={scope === 'team'}
            label={t('provider.myStatsTeamRollup')}
            onToggle={(checked) => setScope(checked ? 'team' : 'mine')}
          />
        ) : null}

        {statsQuery.isLoading ? (
          <IonSpinner className="ion-margin-top" />
        ) : statsQuery.isError ? (
          <IonText color="danger">
            <p className="booking-meta">{t('provider.myStatsLoadFailed')}</p>
          </IonText>
        ) : !stats ? null : (
          <>
            <p className="booking-meta" style={{ marginTop: 12 }}>
              {formatStatsPeriodLabel(stats.period, {
                week: t('provider.myStatsThisWeek'),
                month: t('provider.myStatsThisMonth'),
              })}
              {effectiveScope === 'team'
                ? ` · ${t('provider.myStatsTeamScope')}`
                : ''}
            </p>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                gap: 12,
                marginTop: 12,
              }}
            >
              <StatTile
                label={t('provider.myStatsCompletedBookings')}
                value={String(stats.completedBookings)}
              />
              <StatTile
                label={t('provider.myStatsPaidRevenue')}
                value={formatMoney(stats.paidRevenue, stats.currency)}
              />
              <StatTile
                label={t('provider.myStatsUtilization')}
                value={formatUtilizationPercent(stats.utilizationPercent)}
                hint={formatScheduledHoursLabel(
                  stats.scheduledMinutes,
                  t('provider.myStatsScheduledHours'),
                )}
              />
              <StatTile
                label={t('provider.myStatsAverageReview')}
                value={
                  stats.averageReviewScore != null
                    ? `${renderStarRating(stats.averageReviewScore)} ${stats.averageReviewScore.toFixed(1)}`
                    : '—'
                }
                hint={t('provider.myStatsNewReviews', {
                  count: stats.newReviewsCount,
                })}
              />
            </div>

            {stats.tipsEnabled ? (
              <div style={{ marginTop: 16 }}>
                <p className="booking-meta" style={{ margin: '0 0 8px' }}>
                  {t('provider.myStatsTipsSection')}
                </p>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                    gap: 12,
                  }}
                >
                  <StatTile
                    label={t('provider.myStatsTipTotal')}
                    value={formatMoney(stats.tipTotal ?? 0, stats.currency)}
                  />
                  <StatTile
                    label={t('provider.myStatsTippedVisits')}
                    value={String(stats.tippedVisitCount ?? 0)}
                  />
                </div>
              </div>
            ) : null}
          </>
        )}
      </IonCardContent>
    </IonCard>
  );
}

function IonItemLikeToggle({
  checked,
  label,
  onToggle,
}: {
  checked: boolean;
  label: string;
  onToggle: (checked: boolean) => void;
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 12,
        gap: 12,
      }}
    >
      <span>{label}</span>
      <IonToggle
        checked={checked}
        onIonChange={(event) => onToggle(event.detail.checked)}
      />
    </div>
  );
}
