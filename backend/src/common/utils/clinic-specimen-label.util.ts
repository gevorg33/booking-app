const SPECIMEN_IDENTIFIER_PATTERN = /^[A-Z0-9-]{6,32}$/;

export interface ClinicSpecimenLabelView {
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

/** Stable Code128 payload for specimen tube labels. */
export function buildClinicSpecimenBarcodeValue(
  specimenIdentifier: string,
): string {
  return specimenIdentifier.trim().toUpperCase();
}

/** Human-readable specimen ID printed under the barcode. */
export function generateClinicSpecimenIdentifier(specimenId: string): string {
  const compact = specimenId.replace(/-/g, '').toUpperCase();
  return `SP-${compact.slice(0, 12)}`;
}

export function isValidClinicSpecimenIdentifier(value: string): boolean {
  return SPECIMEN_IDENTIFIER_PATTERN.test(value.trim());
}

export function ensureClinicSpecimenIdentifier(
  specimenId: string,
  existing?: string | null,
): string {
  const trimmed = existing?.trim();
  if (trimmed && isValidClinicSpecimenIdentifier(trimmed)) {
    return trimmed.toUpperCase();
  }
  return generateClinicSpecimenIdentifier(specimenId);
}

export function mapClinicSpecimenLabelView(input: {
  specimenId: string;
  specimenIdentifier: string;
  status: string;
  customerName?: string | null;
  orderDisplayNames?: string | null;
  bookingStartTime?: Date | null;
  department?: string | null;
  collectedAt?: Date | null;
}): ClinicSpecimenLabelView {
  const specimenIdentifier = ensureClinicSpecimenIdentifier(
    input.specimenId,
    input.specimenIdentifier,
  );

  return {
    specimenId: input.specimenId,
    specimenIdentifier,
    barcodeValue: buildClinicSpecimenBarcodeValue(specimenIdentifier),
    customerName: input.customerName?.trim() || null,
    orderDisplayNames: input.orderDisplayNames?.trim() || null,
    bookingStartTime: input.bookingStartTime?.toISOString() ?? null,
    status: input.status,
    department: input.department?.trim() || null,
    collectedAt: input.collectedAt?.toISOString() ?? null,
  };
}
