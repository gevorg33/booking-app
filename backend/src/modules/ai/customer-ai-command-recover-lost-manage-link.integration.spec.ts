import { RECOVER_LOST_MANAGE_LINK_PROMPTS } from './ai-recover-lost-manage-link.fixtures.js';
import { rescueRecoverLostManageLinkIntent } from './ai-recover-lost-manage-link.util.js';

describe('customer-ai-command recover_lost_manage_link integration (ai-cmd-customer-4.17.3)', () => {
  it.each(
    RECOVER_LOST_MANAGE_LINK_PROMPTS.filter(
      (row) => row.surface === 'customer',
    ),
  )('rescues recover_lost_manage_link for $id', ({ prompt }) => {
    expect(rescueRecoverLostManageLinkIntent(prompt, 'unknown')?.action).toBe(
      'recover_lost_manage_link',
    );
  });
});
