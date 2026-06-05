import { describe, expect, it } from '@jest/globals';
import {
  advanceWizardStep,
  buildWizardSteps,
  isWizardComplete,
  shouldUseWizardMode,
} from './ai-wizard.util.js';

describe('ai-wizard.util', () => {
  const diff = [
    {
      id: '1',
      action: 'apply_template',
      description: 'Apply template',
      impact: 'Team',
    },
    {
      id: '2',
      action: 'fill_schedule_gaps',
      description: 'Fill gaps',
      impact: 'Slots',
    },
  ];

  it('enables wizard for setup_week_schedule with 2+ steps', () => {
    expect(shouldUseWizardMode('setup_week_schedule', diff)).toBe(true);
    expect(shouldUseWizardMode('optimize_schedule', diff)).toBe(true);
    expect(shouldUseWizardMode('create_booking', diff)).toBe(false);
    expect(shouldUseWizardMode('setup_week_schedule', [diff[0]])).toBe(false);
    expect(shouldUseWizardMode('setup_week_schedule', undefined)).toBe(false);
  });

  it('builds and advances wizard steps', () => {
    const steps = buildWizardSteps(diff);
    expect(steps[0].status).toBe('current');
    expect(steps[1].status).toBe('pending');

    const advanced = advanceWizardStep(steps, 1);
    expect(advanced[0].status).toBe('done');
    expect(advanced[1].status).toBe('current');
    expect(isWizardComplete(0, 2)).toBe(false);
    expect(isWizardComplete(1, 2)).toBe(true);

    const mid = advanceWizardStep(steps, 0);
    expect(mid[0].status).toBe('current');
    expect(mid[1].status).toBe('pending');

    const last = advanceWizardStep(buildWizardSteps(diff), 1);
    expect(last[0].status).toBe('done');
    expect(last[1].status).toBe('current');
  });
});
