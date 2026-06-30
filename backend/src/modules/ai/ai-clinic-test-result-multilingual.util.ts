/** Shared HY/RU clinic test result unit-test helpers (enter/release + ext). */

export function assertClinicTestResultParamsPartial(
  parsed: Record<string, unknown> | null | undefined,
  paramsPartial?: Record<string, unknown>,
): void {
  if (!paramsPartial || Object.keys(paramsPartial).length === 0) {
    return;
  }
  expect(parsed).not.toBeNull();
  for (const [key, value] of Object.entries(paramsPartial)) {
    expect(parsed?.[key]).toBe(value);
  }
}
