import type { ConsumerCopy } from './consumer-copy.types.js';
import {
  CONSUMER_DISCOVERY_CHIP_COPY_CATALOG,
  CONSUMER_DISCOVERY_CHIP_IDS,
  type ConsumerDiscoveryChipCopyCatalogRow,
} from './consumer-copy-catalog.js';

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
): ConsumerDiscoveryChip[] {
  return CONSUMER_DISCOVERY_CHIP_COPY_CATALOG.map((row) => ({
    id: row.id,
    label: copy[row.labelKey],
    prompt: copy[row.promptKey],
  }));
}
