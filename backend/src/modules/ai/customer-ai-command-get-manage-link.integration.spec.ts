import { GET_MANAGE_LINK_PROMPTS } from './ai-get-manage-link.fixtures.js';
import { rescueGetManageLinkIntent } from './ai-get-manage-link.util.js';

describe('customer-ai-command get_manage_link integration (ai-cmd-customer-4.4.5)', () => {
  it.each(GET_MANAGE_LINK_PROMPTS)(
    'rescues get_manage_link for $id',
    ({ prompt }) => {
      expect(rescueGetManageLinkIntent(prompt, 'unknown')?.action).toBe(
        'get_manage_link',
      );
    },
  );
});
