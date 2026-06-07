'use client';

import { useI18n } from '@/i18n';
import {
  getClinicLabStatusBadgeClassName,
  getClinicLabStatusUiMetadata,
  type ClinicLabStatusBadgeKind,
} from '@/lib/clinic-lab-state';

export interface ClinicLabStatusBadgeProps {
  kind: ClinicLabStatusBadgeKind;
  status: string;
  theme?: 'dark' | 'light';
  className?: string;
}

export function ClinicLabStatusBadge({
  kind,
  status,
  theme = 'dark',
  className = '',
}: ClinicLabStatusBadgeProps) {
  const { t } = useI18n();
  const metadata = getClinicLabStatusUiMetadata(kind, status, t);
  const colors = metadata.measurementColors;

  if (colors) {
    return (
      <span
        className={`inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full ${className}`}
        style={{ color: colors.text, backgroundColor: colors.background }}
      >
        {metadata.label}
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full ${getClinicLabStatusBadgeClassName(
        kind,
        status,
        { theme },
      )} ${className}`}
    >
      {metadata.label}
    </span>
  );
}
