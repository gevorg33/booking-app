import {
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
} from '@ionic/react';
import { formatTimeDisplay } from '../lib/date-format';
import {
  computeSegmentWidthPercent,
  formatProviderTimelineDurationMinutes,
  formatProviderTimelineNextClientLabel,
  shouldShowProviderTodayTimeline,
  type ProviderTodayTimelineSegment,
  type ProviderTodayTimelineView,
} from '../lib/provider-booking-today-timeline';
import { useI18n } from '../i18n';
import './provider-today-timeline.css';

interface ProviderTodayTimelineProps {
  timeline?: ProviderTodayTimelineView | null;
  onSelectBooking?: (bookingId: string) => void;
}

function renderSegmentLabel(
  segment: ProviderTodayTimelineSegment,
  t: (key: string, params?: Record<string, string | number>) => string,
): string {
  if (segment.kind === 'gap') {
    return t('provider.todayTimelineGap', {
      duration: formatProviderTimelineDurationMinutes(segment.durationMinutes),
    });
  }
  const name = segment.customerName ?? t('provider.todayTimelineUnknownClient');
  return `${formatTimeDisplay(segment.startTime)} · ${name}`;
}

export default function ProviderTodayTimeline({
  timeline,
  onSelectBooking,
}: ProviderTodayTimelineProps) {
  const { t } = useI18n();

  if (!shouldShowProviderTodayTimeline(timeline)) {
    return null;
  }

  const view = timeline!;
  const rangeStart = view.rangeStart!;
  const rangeEnd = view.rangeEnd!;

  return (
    <IonCard className="provider-today-timeline-card">
      <IonCardHeader>
        <IonCardTitle>{t('provider.todayTimelineTitle')}</IonCardTitle>
      </IonCardHeader>
      <IonCardContent>
        {view.nextClient ? (
          <p className="provider-today-timeline-next">
            {formatProviderTimelineNextClientLabel(view.nextClient, t)}
          </p>
        ) : (
          <p className="provider-today-timeline-next provider-today-timeline-next-muted">
            {t('provider.todayTimelineNoMoreClients')}
          </p>
        )}

        <div className="provider-today-timeline-track" aria-hidden="true">
          {view.segments.map((segment, index) => {
            const widthPercent = computeSegmentWidthPercent(
              segment.kind === 'booking' ? segment.startTime : segment.startTime,
              segment.kind === 'booking' ? segment.endTime : segment.endTime,
              rangeStart,
              rangeEnd,
            );
            const label = renderSegmentLabel(segment, t);
            const showInlineLabel =
              segment.kind === 'booking' && widthPercent >= 8;
            const className =
              segment.kind === 'gap'
                ? 'provider-today-timeline-segment provider-today-timeline-gap'
                : `provider-today-timeline-segment provider-today-timeline-booking${
                    view.activeBookingId === segment.bookingId
                      ? ' provider-today-timeline-booking-active'
                      : ''
                  }`;

            return (
              <button
                key={`${segment.kind}-${index}`}
                type="button"
                className={className}
                style={{ width: `${Math.max(widthPercent, 4)}%` }}
                title={renderSegmentLabel(segment, t)}
                disabled={segment.kind !== 'booking'}
                onClick={() => {
                  if (segment.kind === 'booking') {
                    onSelectBooking?.(segment.bookingId);
                  }
                }}
              >
                {showInlineLabel ? (
                  <span className="provider-today-timeline-segment-label">{label}</span>
                ) : null}
              </button>
            );
          })}
          {view.nowMarkerPercent != null ? (
            <span
              className="provider-today-timeline-now-marker"
              style={{ left: `${view.nowMarkerPercent}%` }}
              title={t('provider.todayTimelineNowMarker')}
            />
          ) : null}
        </div>

        <ul className="provider-today-timeline-legend">
          {view.segments
            .filter((segment) => segment.kind === 'gap')
            .map((segment, index) => (
              <li key={`legend-gap-${index}`}>{renderSegmentLabel(segment, t)}</li>
            ))}
        </ul>
      </IonCardContent>
    </IonCard>
  );
}
