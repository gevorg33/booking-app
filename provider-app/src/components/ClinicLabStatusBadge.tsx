import {
  IonBadge,
  IonText,
} from '@ionic/react';
import { useI18n } from '../i18n';
import {
  getClinicLabStatusUiMetadata,
  type ClinicLabStatusBadgeKind,
} from '@booking-lib/clinic-lab-state';

const ION_BADGE_COLOR: Record<
  ReturnType<typeof getClinicLabStatusUiMetadata>['badgeTone'],
  string
> = {
  neutral: 'medium',
  info: 'tertiary',
  progress: 'primary',
  success: 'success',
  warning: 'warning',
  danger: 'danger',
  review: 'secondary',
};

export interface ClinicLabStatusBadgeProps {
  kind: ClinicLabStatusBadgeKind;
  status: string;
  className?: string;
}

export function ClinicLabStatusBadge({
  kind,
  status,
  className = '',
}: ClinicLabStatusBadgeProps) {
  const { t } = useI18n();
  const metadata = getClinicLabStatusUiMetadata(kind, status, t);
  const colors = metadata.measurementColors;

  if (colors) {
    return (
      <span
        className={`clinic-lab-status-badge ${className}`}
        style={{
          color: colors.text,
          backgroundColor: colors.background,
          borderRadius: '9999px',
          padding: '2px 8px',
          fontSize: '12px',
          fontWeight: 600,
        }}
      >
        {metadata.label}
      </span>
    );
  }

  return (
    <IonBadge
      color={ION_BADGE_COLOR[metadata.badgeTone]}
      className={`clinic-lab-status-badge ${className}`}
    >
      {metadata.label}
    </IonBadge>
  );
}

export function ClinicLabStatusBadgeCaption({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <IonText color="medium">
      <span
        style={{
          fontSize: '10px',
          textTransform: 'uppercase',
          letterSpacing: '0.04em',
        }}
      >
        {children}
      </span>
    </IonText>
  );
}
