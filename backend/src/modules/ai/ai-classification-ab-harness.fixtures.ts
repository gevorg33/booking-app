import type { EntityMemory } from './ai-settings.types.js';
import type { ClassificationSurface } from './ai-classification-engine.types.js';
import { CLASSIFICATION_FEWSHOT_EXAMPLES } from './ai-classification-engine.fixtures.js';

/** acc-3.10 — curated probe prompts scored per appendix A/B variant. */
export interface ClassificationAbProbeCase {
  id: string;
  prompt: string;
  surface: ClassificationSurface;
  expectedAction: string;
  entityMemory?: EntityMemory;
}

export const CLASSIFICATION_AB_EXPERIMENT_ID = 'classification-appendix-v1';

/** Static few-shot seeds (dashboard + public) plus phrasing-memory probe. */
export const CLASSIFICATION_AB_PROBE_CASES: ClassificationAbProbeCase[] = [
  ...CLASSIFICATION_FEWSHOT_EXAMPLES.filter(
    (entry) => entry.surface === 'dashboard' || entry.surface === 'public',
  ).map((entry) => ({
    id: `ab-probe-${entry.id}`,
    prompt: entry.prompt,
    surface: entry.surface,
    expectedAction: entry.action,
  })),
  {
    id: 'ab-probe-dashboard-phrasing-usual',
    prompt: 'Book the usual with Gevorg tomorrow',
    surface: 'dashboard',
    expectedAction: 'create_booking',
    entityMemory: {
      aliases: {
        'the usual': {
          serviceName: 'Face massage',
          employeeName: 'Gevorg',
        },
      },
    },
  },
  {
    id: 'ab-probe-dashboard-reschedule',
    prompt: 'Move Maria appointment from 14:00 to 16:00 tomorrow',
    surface: 'dashboard',
    expectedAction: 'reschedule_booking',
  },
  {
    id: 'ab-probe-dashboard-show-appointments',
    prompt: 'Show appointments for Gevorg tomorrow',
    surface: 'dashboard',
    expectedAction: 'show_appointments',
  },
];
