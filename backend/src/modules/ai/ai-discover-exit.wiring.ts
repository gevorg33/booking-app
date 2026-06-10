import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { CONSUMER_DISCOVERY_CHIP_FIXTURES } from './ai-consumer-discovery-chips.fixtures.js';

const PUBLIC_ASSISTANT_SERVICE_PATH = join(
  process.cwd(),
  'src/modules/public-booking/public-booking-assistant.service.ts',
);

const CONSUMER_COPY_CATALOG_PATH = join(
  process.cwd(),
  '../consumer-app/src/lib/consumer-copy-catalog.ts',
);

export function readPublicBookingAssistantServiceSource(): string {
  return readFileSync(PUBLIC_ASSISTANT_SERVICE_PATH, 'utf8');
}

export function readConsumerCopyCatalogSource(): string {
  return readFileSync(CONSUMER_COPY_CATALOG_PATH, 'utf8');
}

export function extractPublicHandleCheckAvailabilitySource(
  source = readPublicBookingAssistantServiceSource(),
): string {
  const start = source.indexOf('private async handleCheckAvailability');
  const end = source.indexOf('private async handleRecommendSpecialists', start);
  if (start === -1 || end === -1) {
    throw new Error('handleCheckAvailability block not found in public assistant');
  }
  return source.slice(start, end);
}

export function extractPublicHandleListServicesSource(
  source = readPublicBookingAssistantServiceSource(),
): string {
  const start = source.indexOf('private async handleListServices');
  const end = source.indexOf('async executeDeterministicIntent', start);
  if (start === -1 || end === -1) {
    throw new Error('handleListServices block not found in public assistant');
  }
  return source.slice(start, end);
}

export function extractPublicHandleRecommendSpecialistsSource(
  source = readPublicBookingAssistantServiceSource(),
): string {
  const start = source.indexOf('private async handleRecommendSpecialists');
  const end = source.indexOf('private async handleBookAppointment', start);
  if (start === -1 || end === -1) {
    throw new Error(
      'handleRecommendSpecialists block not found in public assistant',
    );
  }
  return source.slice(start, end);
}

/** Static gate — public list_services ships budget filter + navigate hints (budget-1.4 / 1.6). */
export function assertPublicListServicesBudgetWiring(
  source = readPublicBookingAssistantServiceSource(),
): void {
  const block = extractPublicHandleListServicesSource(source);
  expect(block).toContain('composePublicListServicesBudgetResponse');
  expect(block).toContain('composePublicListServicesRankResponse');
  expect(block).toContain('params.maxPrice');
  expect(block).toContain('navigate: composed.navigate');
  expect(block).toContain('Services within your budget');
}

/** Static gate — public recommend_specialists ships budget service-id filter (budget-1.5). */
export function assertPublicRecommendSpecialistsBudgetWiring(
  source = readPublicBookingAssistantServiceSource(),
): void {
  const block = extractPublicHandleRecommendSpecialistsSource(source);
  expect(block).toContain('applyBudgetFilterForRecommendSpecialists');
  expect(block).toContain('budgetRecommend.noMatchSummary');
  expect(block).toContain('params.maxPrice');
}

/** Static gate — public handler ships avail-1.5 timeOfDay filter + OR window loop (discover-exit-2). */
export function assertPublicCheckAvailabilityAvail15Wiring(
  source = readPublicBookingAssistantServiceSource(),
): void {
  const block = extractPublicHandleCheckAvailabilitySource(source);
  expect(block).toContain('filterPublicProviderSlotsByTimeOfDay');
  expect(block).toContain('shouldGroupPublicAvailabilityByWindow');
  expect(block).toContain('composePublicAvailabilityCheckSummary');
  expect(block).toContain('for (const window of availabilityWindows)');
  expect(block).toContain('window.timeOfDay');
  expect(block).toContain('buildPublicAvailabilityWindowLabelForCheck');
}

/** Static gate — consumer copy catalog documents discover chips (discover-exit-4). */
export function assertConsumerDiscoveryChipsCopyCatalog(
  catalogSource = readConsumerCopyCatalogSource(),
): void {
  expect(catalogSource).toContain('CONSUMER_DISCOVERY_CHIP_COPY_CATALOG');
  expect(catalogSource).toContain('discover-1.4 / discover-exit-4');

  for (const chip of CONSUMER_DISCOVERY_CHIP_FIXTURES) {
    expect(catalogSource).toContain(chip.id);
    expect(catalogSource).toContain(chip.fixtureId);
    expect(catalogSource).toContain(chip.prompt);
    expect(catalogSource).toContain(chip.label);
  }

  expect(catalogSource).toContain("promptKey: 'assistantDiscoverPromptUnder50'");
  expect(catalogSource).toContain("promptKey: 'assistantDiscoverPromptPremium'");
  expect(catalogSource).toContain(
    "promptKey: 'assistantDiscoverPromptEveningWeekend'",
  );
}
