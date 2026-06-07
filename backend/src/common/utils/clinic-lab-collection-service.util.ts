export interface ClinicOrderItemCollectionServiceLinkInput {
  type: 'test_type' | 'test_panel';
  testType?: { serviceId?: string | null; isActive?: boolean } | null;
  testPanel?: {
    items?: Array<{
      testType?: { serviceId?: string | null; isActive?: boolean } | null;
    }>;
  } | null;
}

export function collectLinkedCollectionServiceIds(
  items: ClinicOrderItemCollectionServiceLinkInput[],
): string[] {
  const serviceIds = new Set<string>();

  for (const item of items) {
    if (item.type === 'test_type') {
      const serviceId = item.testType?.serviceId;
      if (serviceId && item.testType?.isActive !== false) {
        serviceIds.add(serviceId);
      }
      continue;
    }

    if (item.type === 'test_panel') {
      for (const panelItem of item.testPanel?.items ?? []) {
        const serviceId = panelItem.testType?.serviceId;
        if (serviceId && panelItem.testType?.isActive !== false) {
          serviceIds.add(serviceId);
        }
      }
    }
  }

  return [...serviceIds];
}

export function mergeCollectionServiceCandidateIds(
  linkedServiceIds: string[],
  persistedCollectionServiceId?: string | null,
): string[] {
  const candidateIds = [...linkedServiceIds];
  if (
    persistedCollectionServiceId &&
    !candidateIds.includes(persistedCollectionServiceId)
  ) {
    candidateIds.push(persistedCollectionServiceId);
  }
  return candidateIds;
}
