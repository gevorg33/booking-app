export type ServiceSlotProviderOption = { id: string };

/** Keep or reset specialist after slot-scoped providers load. */
export function resolveBookPageSpecialistEmployeeId(
  slotProviders: ServiceSlotProviderOption[],
  currentEmployeeId: string,
): string {
  if (slotProviders.length === 0) return '';
  if (slotProviders.length === 1) return slotProviders[0]!.id;
  if (currentEmployeeId && slotProviders.some((provider) => provider.id === currentEmployeeId)) {
    return currentEmployeeId;
  }
  return '';
}

export function shouldShowBookPageSpecialistPicker(slotProviderCount: number): boolean {
  return slotProviderCount > 1;
}
