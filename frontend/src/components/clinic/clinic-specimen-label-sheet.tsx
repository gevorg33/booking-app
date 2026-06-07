'use client';

import type { ClinicSpecimenLabelData } from '@/lib/clinic-specimen-label';
import { ClinicSpecimenBarcode } from './clinic-specimen-barcode';
import { formatDateDisplay } from '@/lib/date-format';

interface ClinicSpecimenLabelSheetProps {
  label: ClinicSpecimenLabelData;
  businessName?: string | null;
  labels: {
    specimenId: string;
    customer: string;
    test: string;
    appointment: string;
    department: string;
    status: string;
    collected: string;
  };
}

export function ClinicSpecimenLabelSheet({
  label,
  businessName,
  labels,
}: ClinicSpecimenLabelSheetProps) {
  return (
    <div className="clinic-specimen-label-sheet border border-gray-300 rounded-md bg-white text-black p-3 w-[3.5in] min-h-[2in]">
      {businessName ? (
        <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-700">
          {businessName}
        </div>
      ) : null}
      <div className="mt-1 text-sm font-semibold">{label.customerName ?? '—'}</div>
      <div className="text-xs text-gray-700">
        {label.orderDisplayNames ?? labels.test}
      </div>
      <div className="mt-1 grid grid-cols-2 gap-x-2 gap-y-1 text-[11px] text-gray-700">
        <div>
          <span className="font-medium">{labels.appointment}: </span>
          {label.bookingStartTime
            ? formatDateDisplay(new Date(label.bookingStartTime))
            : '—'}
        </div>
        <div>
          <span className="font-medium">{labels.department}: </span>
          {label.department ?? '—'}
        </div>
        <div>
          <span className="font-medium">{labels.status}: </span>
          {label.status}
        </div>
        {label.collectedAt ? (
          <div>
            <span className="font-medium">{labels.collected}: </span>
            {formatDateDisplay(new Date(label.collectedAt))}
          </div>
        ) : null}
      </div>
      <div className="mt-2 flex flex-col items-center">
        <ClinicSpecimenBarcode value={label.barcodeValue} />
        <div className="text-[11px] font-mono mt-1">{label.specimenIdentifier}</div>
        <div className="text-[10px] text-gray-500">{labels.specimenId}: {label.specimenId}</div>
      </div>
    </div>
  );
}
