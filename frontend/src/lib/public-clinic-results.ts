export interface PublicCustomerReleasedClinicMeasurement {
  id: string;
  name: string;
  value: string | null;
  unit: string | null;
  referenceRange: string | null;
  measurementFlag: string | null;
}

export interface PublicCustomerReleasedClinicResult {
  id: string;
  orderId: string | null;
  bookingId: string | null;
  status: string;
  testName: string | null;
  measurementFlag: string | null;
  releasedAt: string | null;
  measurements: PublicCustomerReleasedClinicMeasurement[];
}

export function formatReleasedClinicMeasurementValue(
  measurement: Pick<PublicCustomerReleasedClinicMeasurement, 'value' | 'unit'>,
): string | null {
  const value = measurement.value?.trim();
  if (!value) return null;
  const unit = measurement.unit?.trim();
  return unit ? `${value} ${unit}` : value;
}

export function normalizePublicClinicResultsPayload(
  payload: unknown,
): PublicCustomerReleasedClinicResult[] {
  const rows = extractPublicClinicResultsArray(payload);
  return rows.map(normalizePublicClinicResultRow);
}

function extractPublicClinicResultsArray(payload: unknown): unknown[] {
  if (Array.isArray(payload)) return payload;
  const data = (payload as { data?: unknown })?.data ?? payload;
  if (Array.isArray(data)) return data;
  const nested = (data as { data?: unknown })?.data;
  return Array.isArray(nested) ? nested : [];
}

function normalizePublicClinicResultRow(
  row: unknown,
): PublicCustomerReleasedClinicResult {
  const source = row as Partial<PublicCustomerReleasedClinicResult>;
  return {
    id: String(source.id ?? ''),
    orderId: source.orderId ?? null,
    bookingId: source.bookingId ?? null,
    status: String(source.status ?? ''),
    testName: source.testName ?? null,
    measurementFlag: source.measurementFlag ?? null,
    releasedAt: source.releasedAt ?? null,
    measurements: Array.isArray(source.measurements)
      ? source.measurements.map(normalizePublicClinicMeasurementRow)
      : [],
  };
}

function normalizePublicClinicMeasurementRow(
  row: unknown,
): PublicCustomerReleasedClinicMeasurement {
  const source = row as Partial<PublicCustomerReleasedClinicMeasurement>;
  return {
    id: String(source.id ?? ''),
    name: String(source.name ?? 'Measurement'),
    value: source.value ?? null,
    unit: source.unit ?? null,
    referenceRange: source.referenceRange ?? null,
    measurementFlag: source.measurementFlag ?? null,
  };
}

export function isReleasedClinicResultStatus(status: string): boolean {
  return status === 'Released';
}

export function hasReleasedClinicResultMeasurements(
  result: Pick<PublicCustomerReleasedClinicResult, 'measurements'>,
): boolean {
  return result.measurements.length > 0;
}
