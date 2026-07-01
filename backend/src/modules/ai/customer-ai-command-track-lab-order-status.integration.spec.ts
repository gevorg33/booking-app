import {
  TRACK_LAB_ORDER_STATUS_PROMPTS,
  TRACK_LAB_ORDER_STATUS_RESCUE_SCENARIOS,
} from './ai-track-lab-order-status.fixtures.js';
import { TRACK_LAB_ORDER_STATUS_MULTILINGUAL_SCENARIOS } from './ai-track-lab-order-status-multilingual.fixtures.js';
import { rescueTrackLabOrderStatusIntent } from './ai-track-lab-order-status.util.js';

describe('customer-ai-command track_lab_order_status integration (ai-cmd-customer-4.7.2)', () => {
  it.each(TRACK_LAB_ORDER_STATUS_PROMPTS.map((row) => [row.id, row] as const))(
    'rescues track_lab_order_status for $id',
    (_id, row) => {
      expect(
        rescueTrackLabOrderStatusIntent(row.prompt, 'unknown')?.action,
      ).toBe('track_lab_order_status');
    },
  );

  it.each(
    TRACK_LAB_ORDER_STATUS_MULTILINGUAL_SCENARIOS.map(
      (row) => [row.id, row] as const,
    ),
  )('rescues multilingual track_lab_order_status for $id', (_id, row) => {
    expect(rescueTrackLabOrderStatusIntent(row.prompt, 'unknown')?.action).toBe(
      'track_lab_order_status',
    );
  });

  it.each(
    TRACK_LAB_ORDER_STATUS_RESCUE_SCENARIOS.map(
      (row) => [row.id, row] as const,
    ),
  )('rescues misclassified track_lab_order_status for $id', (_id, row) => {
    expect(
      rescueTrackLabOrderStatusIntent(row.prompt, row.misclassifiedAction)
        ?.action,
    ).toBe('track_lab_order_status');
  });
});
