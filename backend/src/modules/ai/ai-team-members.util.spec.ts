import { TEAM_MEMBER_SCENARIOS } from './ai-team-members.fixtures.js';
import {
  isTeamMemberIntent,
  isUpdateTeamMemberRolePrompt,
  rescueTeamMemberIntent,
} from './ai-team-members.util.js';

describe('ai-team-members.util (parity-2)', () => {
  it.each(TEAM_MEMBER_SCENARIOS)('scenario $id', ({ prompt, expectedAction }) => {
    expect(isUpdateTeamMemberRolePrompt(prompt)).toBe(true);
    expect(isTeamMemberIntent(expectedAction)).toBe(true);
  });

  it('rescues role update prompts', () => {
    expect(
      rescueTeamMemberIntent('Make Anna a manager on the team', 'unknown'),
    ).toEqual({
      action: 'update_team_member_role',
      rescueReason: 'update_team_member_role',
    });
  });
});
