import type { ClinicLabSyncInboundSource } from './clinic-lis.types.js';
import { parseFhirInboundClinicLabSyncObservationRequest } from './clinic-lab-sync-fhir.parser.util.js';
import { parseHl7InboundClinicLabSyncObservationRequest } from './clinic-lab-sync-hl7.parser.util.js';
import type { InboundClinicLabSyncObservationRequestPayload } from './clinic-lab-sync-observation.adapter.util.js';

function parseVendorJsonInboundClinicLabSyncObservationRequest(
  rawPayload: string,
): InboundClinicLabSyncObservationRequestPayload {
  let parsed: unknown;
  try {
    parsed = JSON.parse(rawPayload);
  } catch {
    throw new Error('Vendor JSON payload must be valid JSON');
  }

  const payload =
    parsed &&
    typeof parsed === 'object' &&
    'observationRequest' in (parsed as Record<string, unknown>)
      ? (
          parsed as {
            observationRequest: InboundClinicLabSyncObservationRequestPayload;
          }
        ).observationRequest
      : (parsed as InboundClinicLabSyncObservationRequestPayload);

  if (
    !payload ||
    typeof payload !== 'object' ||
    !Array.isArray(payload.observations) ||
    payload.observations.length === 0
  ) {
    throw new Error(
      'Vendor JSON payload must include observationRequest with observations',
    );
  }

  return payload;
}

export function parseInboundClinicLabSyncPayload(input: {
  source: ClinicLabSyncInboundSource;
  rawPayload: string;
  integrationVendorCode?: string | null;
  labInfoId?: string | null;
}): InboundClinicLabSyncObservationRequestPayload {
  let payload: InboundClinicLabSyncObservationRequestPayload;
  switch (input.source) {
    case 'hl7':
      payload = parseHl7InboundClinicLabSyncObservationRequest(
        input.rawPayload,
      );
      break;
    case 'fhir':
      payload = parseFhirInboundClinicLabSyncObservationRequest(
        input.rawPayload,
      );
      break;
    case 'vendor_json':
      payload = parseVendorJsonInboundClinicLabSyncObservationRequest(
        input.rawPayload,
      );
      break;
    default:
      throw new Error(`Unsupported inbound source: ${input.source as string}`);
  }

  if (input.integrationVendorCode) {
    payload.integrationVendorCode = input.integrationVendorCode;
  }
  if (input.labInfoId) {
    payload.labInfoId = input.labInfoId;
  }
  return payload;
}
