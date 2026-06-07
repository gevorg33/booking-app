export interface ClinicSpecimenLabelData {
  specimenId: string;
  specimenIdentifier: string;
  barcodeValue: string;
  customerName: string | null;
  orderDisplayNames: string | null;
  bookingStartTime: string | null;
  status: string;
  department: string | null;
  collectedAt: string | null;
}

export const CLINIC_SPECIMEN_BARCODE_OPTIONS = {
  bcid: 'code128',
  scale: 2,
  height: 12,
  includetext: true,
  textxalign: 'center' as const,
};

export function unwrapClinicSpecimenLabel(data: unknown): ClinicSpecimenLabelData {
  const payload = (data as { data?: unknown })?.data ?? data;
  const nested = (payload as { data?: unknown })?.data ?? payload;
  return nested as ClinicSpecimenLabelData;
}

export function buildClinicSpecimenLabelPath(
  businessId: string,
  specimenId: string,
): string {
  return `/businesses/${businessId}/clinic-test-results/specimens/${specimenId}/label`;
}

export function buildClinicSpecimenLabelPrintTitle(
  label: Pick<ClinicSpecimenLabelData, 'orderDisplayNames' | 'specimenIdentifier'>,
  fallback: string,
): string {
  const testName = label.orderDisplayNames?.trim();
  if (testName) return `${testName} · ${label.specimenIdentifier}`;
  return `${fallback} · ${label.specimenIdentifier}`;
}

export function printClinicSpecimenLabel(elementId: string): void {
  const node = document.getElementById(elementId);
  if (!node || typeof window === 'undefined') return;

  const printWindow = window.open('', '_blank', 'noopener,noreferrer,width=480,height=640');
  if (!printWindow) return;

  printWindow.document.write(`
    <!doctype html>
    <html>
      <head>
        <title>Specimen label</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 0; padding: 12px; color: #111; }
          .clinic-specimen-label-sheet { width: 3.5in; min-height: 2in; }
        </style>
      </head>
      <body>${node.innerHTML}</body>
    </html>
  `);
  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
  printWindow.close();
}
