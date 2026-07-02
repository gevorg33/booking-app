import {
  UPDATE_MY_PROFILE_PROMPTS,
  UPDATE_MY_PROFILE_RESCUE_SCENARIOS,
} from './ai-update-my-profile.fixtures.js';
import { UPDATE_MY_PROFILE_MULTILINGUAL_SCENARIOS } from './ai-update-my-profile-multilingual.fixtures.js';
import { rescueUpdateMyProfileIntent } from './ai-update-my-profile.util.js';
import { rescueCustomerCrmIntent } from './ai-customer-crm.util.js';

describe('customer-ai-command update_my_profile integration (ai-cmd-customer-4.5.6)', () => {
  it.each(UPDATE_MY_PROFILE_PROMPTS.map((row) => [row.id, row] as const))(
    'rescues update_my_profile for $id',
    (_id, row) => {
      expect(rescueUpdateMyProfileIntent(row.prompt, 'unknown')?.action).toBe(
        'update_my_profile',
      );
      expect(rescueCustomerCrmIntent(row.prompt, 'unknown')?.action).toBe(
        'update_my_profile',
      );
    },
  );

  it.each(
    UPDATE_MY_PROFILE_MULTILINGUAL_SCENARIOS.map(
      (row) => [row.id, row] as const,
    ),
  )('rescues multilingual update_my_profile for $id', (_id, row) => {
    expect(rescueCustomerCrmIntent(row.prompt, 'unknown')?.action).toBe(
      'update_my_profile',
    );
  });

  it.each(
    UPDATE_MY_PROFILE_RESCUE_SCENARIOS.map((row) => [row.id, row] as const),
  )('rescues misclassified update_my_profile for $id', (_id, row) => {
    expect(
      rescueCustomerCrmIntent(row.prompt, row.misclassifiedAction)?.action,
    ).toBe('update_my_profile');
  });
});
