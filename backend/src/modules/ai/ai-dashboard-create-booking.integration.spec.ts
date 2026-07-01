import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const AI_COMMAND_SOURCE = readFileSync(
  join(__dirname, 'ai-command.service.ts'),
  'utf8',
);

describe('dashboard create_booking OR + budget/rank wiring (ai-cmd-ext-1.4)', () => {
  it('enriches discovery params on dashboard classify', () => {
    expect(AI_COMMAND_SOURCE).toContain('enrichDiscoveryParamsFromPrompt(');
  });

  it('resolves budget/rank service before booking', () => {
    expect(AI_COMMAND_SOURCE).toContain('resolveDashboardCreateBookingService');
    expect(AI_COMMAND_SOURCE).toContain('enrichDashboardCreateBookingParams');
  });

  it('scans OR availability windows for bookingFirstAvailable', () => {
    expect(AI_COMMAND_SOURCE).toContain(
      'findDashboardFirstAvailableAcrossWindows',
    );
    expect(AI_COMMAND_SOURCE).toContain('findFirstAvailableBookingSlotOnDay');
    expect(AI_COMMAND_SOURCE).toContain(
      'shouldScanExplicitAvailabilityWindows',
    );
    expect(AI_COMMAND_SOURCE).toContain('pickCreateBookingFirstAvailable');
  });

  it('plan preview path shares budget/rank + OR first-available helpers', () => {
    expect(AI_COMMAND_SOURCE).toContain('resolveCreateBookingServiceForParams');
    expect(AI_COMMAND_SOURCE).toMatch(
      /buildCreateBookingPlanOnly[\s\S]*?resolveCreateBookingServiceForParams/,
    );
    expect(AI_COMMAND_SOURCE).toMatch(
      /buildCreateBookingPlanOnly[\s\S]*?pickCreateBookingFirstAvailable/,
    );
  });
});

describe('dashboard lookup_service_assignment budget/rank (ai-cmd-ext-1.5)', () => {
  it('resolves filtered service for team-wide lookup', () => {
    expect(AI_COMMAND_SOURCE).toContain('resolveLookupAssignmentService');
    expect(AI_COMMAND_SOURCE).toContain(
      'enrichDashboardLookupAssignmentParams',
    );
  });
});
