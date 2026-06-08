export const TEAM_MEMBER_MUTATE_INTENTS = ['update_team_member_role'] as const;

export const TEAM_MEMBER_INTENTS = [...TEAM_MEMBER_MUTATE_INTENTS] as const;

export type TeamMemberIntent = (typeof TEAM_MEMBER_INTENTS)[number];

export function isTeamMemberIntent(action: string): action is TeamMemberIntent {
  return (TEAM_MEMBER_INTENTS as readonly string[]).includes(action);
}

export function isUpdateTeamMemberRolePrompt(prompt: string): boolean {
  const hasVerb = /\b(change|update|set|make|promote|demote)\b/i.test(prompt);
  const hasRoleWord = /\b(role|manager|staff|admin|owner|contributor)\b/i.test(
    prompt,
  );
  const hasTarget =
    /\b(team|member|employee|user)\b/i.test(prompt) ||
    /\brole\s+to\b/i.test(prompt) ||
    /\b(from|to)\s+(staff|manager|admin|contributor|owner)\b/i.test(prompt) ||
    /\b(?:a|as)\s+(staff|manager|admin|contributor|owner)\b/i.test(prompt);
  return hasVerb && hasRoleWord && hasTarget;
}

export function rescueTeamMemberIntent(
  prompt: string,
  action: string,
): { action: TeamMemberIntent; rescueReason: string } | null {
  if (
    isUpdateTeamMemberRolePrompt(prompt) &&
    action !== 'update_team_member_role'
  ) {
    return {
      action: 'update_team_member_role',
      rescueReason: 'update_team_member_role',
    };
  }
  return null;
}
