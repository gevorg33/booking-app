'use client';

import { ClinicSpecimenQueuePanel } from '@/components/clinic/clinic-specimen-queue-panel';
import { useI18n } from '@/i18n';
import { isClinicVerticalBusinessType } from '@/lib/clinic-service';
import { useDashboardBusinessType } from '@/lib/use-dashboard-business-type';

export default function LabSpecimenTrackingPage() {
  const { t } = useI18n();
  const businessType = useDashboardBusinessType();
  const showPage = isClinicVerticalBusinessType(businessType);

  if (!showPage) {
    return (
      <div className="max-w-5xl mx-auto p-6">
        <div className="card text-sm text-gray-500">{t('clinic.labState.gate.disabledReason')}</div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <ClinicSpecimenQueuePanel view="tracking" />
    </div>
  );
}
