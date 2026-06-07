'use client';

import { useQuery } from '@tanstack/react-query';
import { Loader2, Printer, X } from 'lucide-react';
import api from '@/lib/api';
import { useI18n } from '@/i18n';
import {
  buildClinicSpecimenLabelPath,
  buildClinicSpecimenLabelPrintTitle,
  printClinicSpecimenLabel,
  unwrapClinicSpecimenLabel,
} from '@/lib/clinic-specimen-label';
import { ClinicSpecimenLabelSheet } from './clinic-specimen-label-sheet';

const PRINT_ROOT_ID = 'clinic-specimen-label-print-root';

interface ClinicSpecimenLabelPrintModalProps {
  businessId: string;
  businessName?: string | null;
  specimenId: string | null;
  onClose: () => void;
}

export function ClinicSpecimenLabelPrintModal({
  businessId,
  businessName,
  specimenId,
  onClose,
}: ClinicSpecimenLabelPrintModalProps) {
  const { t } = useI18n();

  const { data: label, isLoading, error } = useQuery({
    queryKey: ['clinic-specimen-label', businessId, specimenId],
    queryFn: async () => {
      const { data } = await api.get(
        buildClinicSpecimenLabelPath(businessId, specimenId!),
      );
      return unwrapClinicSpecimenLabel(data);
    },
    enabled: Boolean(businessId && specimenId),
  });

  if (!specimenId) return null;

  const sheetLabels = {
    specimenId: t('clinic.labSpecimens.label.fields.specimenId'),
    customer: t('clinic.labSpecimens.label.fields.customer'),
    test: t('clinic.labSpecimens.label.fields.test'),
    appointment: t('clinic.labSpecimens.label.fields.appointment'),
    department: t('clinic.labSpecimens.label.fields.department'),
    status: t('clinic.labSpecimens.label.fields.status'),
    collected: t('clinic.labSpecimens.label.fields.collected'),
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="card w-full max-w-lg space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">{t('clinic.labSpecimens.label.title')}</h2>
            <p className="text-sm text-gray-500 mt-1">
              {t('clinic.labSpecimens.label.subtitle')}
            </p>
          </div>
          <button type="button" className="btn-secondary p-2" onClick={onClose} aria-label={t('common.close')}>
            <X className="w-4 h-4" />
          </button>
        </div>

        {isLoading ? (
          <div className="flex items-center gap-2 text-sm text-gray-500 py-8 justify-center">
            <Loader2 className="w-4 h-4 animate-spin" />
            {t('common.loading')}
          </div>
        ) : error ? (
          <div className="text-sm text-red-400">{t('clinic.labSpecimens.label.loadError')}</div>
        ) : label ? (
          <>
            <div id={PRINT_ROOT_ID}>
              <ClinicSpecimenLabelSheet
                label={label}
                businessName={businessName}
                labels={sheetLabels}
              />
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" className="btn-secondary" onClick={onClose}>
                {t('common.cancel')}
              </button>
              <button
                type="button"
                className="btn-primary inline-flex items-center gap-2"
                onClick={() => printClinicSpecimenLabel(PRINT_ROOT_ID)}
              >
                <Printer className="w-4 h-4" />
                {t('clinic.labSpecimens.label.print')}
              </button>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
