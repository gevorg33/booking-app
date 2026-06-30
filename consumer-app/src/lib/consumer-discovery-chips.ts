import type { ConsumerCopy } from './consumer-copy.types.js';
import {
  CONSUMER_DISCOVERY_CHIP_COPY_CATALOG,
  CONSUMER_DISCOVERY_CHIP_IDS,
  type ConsumerDiscoveryChipCopyCatalogRow,
} from './consumer-copy-catalog.js';
import {
  interpolateAssistantTemplate,
  pickAssistantExampleVars,
  type AssistantExampleTenantInput,
} from './assistant-example-tenant.util.js';

export { CONSUMER_DISCOVERY_CHIP_IDS };

export type ConsumerDiscoveryChipId =
  ConsumerDiscoveryChipCopyCatalogRow['id'];

export type ConsumerDiscoveryChip = {
  id: ConsumerDiscoveryChipId;
  label: string;
  prompt: string;
};

/** One-tap discover chips — label in UI, full fixture prompt sent to assistant. */
export function getConsumerDiscoveryChips(
  copy: ConsumerCopy,
  tenant?: AssistantExampleTenantInput | null,
): ConsumerDiscoveryChip[] {
  const vars = pickAssistantExampleVars(tenant, {
    provider: copy.assistantFallbackProvider,
    service: copy.assistantFallbackService,
    service2: copy.assistantFallbackService,
    serviceCategory: copy.assistantFallbackServiceCategory,
  });
  return CONSUMER_DISCOVERY_CHIP_COPY_CATALOG.map((row) => {
    const promptTemplate = copy[row.promptKey];
    return {
      id: row.id,
      label: copy[row.labelKey],
      prompt:
        row.id === 'discover-chip-evening-weekend-en'
          ? interpolateAssistantTemplate(promptTemplate, { service: vars.service })
          : promptTemplate,
    };
  });
}
