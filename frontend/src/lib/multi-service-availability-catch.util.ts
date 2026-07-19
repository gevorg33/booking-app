/** Catch messages for multi-service availability (e2e-bug.108 / e2e-bug.56). Never surface raw backend English. */
export const MULTI_SERVICE_AVAILABILITY_CATCH_I18N_KEYS = {
  loadSlots: 'public.loadAvailableTimesFailed',
  findBlock: 'public.findAvailableBlockFailed',
  /** per_service `/multi/confirm` auto-suggest */
  suggestLines: 'public.suggestMultiServiceLinesFailed',
} as const;

export type MultiServiceAvailabilityCatchKind =
  keyof typeof MULTI_SERVICE_AVAILABILITY_CATCH_I18N_KEYS;

/**
 * Always return the locale-catalog fallback — do not prefer `Error.message`
 * (backend BadRequestException text is hardcoded English).
 */
export function resolveMultiServiceAvailabilityCatchMessage(
  t: (key: string) => string,
  kind: MultiServiceAvailabilityCatchKind,
): string {
  return t(MULTI_SERVICE_AVAILABILITY_CATCH_I18N_KEYS[kind]);
}
