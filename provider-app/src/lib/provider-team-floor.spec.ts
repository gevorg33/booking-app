import { describe, expect, it } from 'vitest';
import {
  formatTeamFloorChipLabel,
  formatTeamFloorStatusSummary,
  teamFloorChipColor,
} from './provider-team-floor';

describe('provider-team-floor (prov-exp-4.1)', () => {
  const t = (key: string, params?: Record<string, string | number>) => {
    if (key === 'provider.teamFloorWaiting') return 'Waiting';
    if (key === 'provider.teamFloorInService') return 'In service';
    if (key === 'provider.teamFloorDone') return 'Done';
    if (key === 'provider.teamFloorNoShow') return 'No show';
    if (key === 'provider.teamFloorStatusCount') {
      return `${params?.count} ${params?.status}`;
    }
    return key;
  };

  it('maps chip colors and labels', () => {
    expect(teamFloorChipColor('in_service')).toBe('success');
    expect(formatTeamFloorChipLabel('waiting', t)).toBe('Waiting');
  });

  it('formats status summary counts', () => {
    expect(
      formatTeamFloorStatusSummary(
        { waiting: 2, in_service: 1, done: 0, no_show: 0 },
        t,
      ),
    ).toBe('2 Waiting · 1 In service');
  });
});
