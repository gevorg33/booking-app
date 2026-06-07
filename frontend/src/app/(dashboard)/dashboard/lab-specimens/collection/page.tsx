'use client';

import { ClinicSpecimenQueuePanel } from '@/components/clinic/clinic-specimen-queue-panel';
import { useAuthStore } from '@/lib/store';
import { useI18n } from '@/i18n';
import { isClinicVerticalBusinessType } from '@/lib/clinic-service';

export default function LabSpecimenCollectionPage() {
  const { t } = useI18n();
  const { business } = useAuthStore();
  const businessType =
    (business?.settings?.businessType as string | undefined) ?? undefined;
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
      <ClinicSpecimenQueuePanel view="collection" />
    </div>
  );
}
