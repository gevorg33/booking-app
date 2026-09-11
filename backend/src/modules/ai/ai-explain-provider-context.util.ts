export function isExplainProviderContextPrompt(prompt: string): boolean {
  const lower = prompt.toLowerCase();
  return (
    /\bwhat\s+can\s+i\s+see\b/.test(lower) ||
    /\bam\s+i\s+in\s+team\s+view\b/.test(lower) ||
    /\bwhat'?s\s+my\s+role\b/.test(lower) ||
    (/\bteam\s+view\s+or\b/.test(lower) && /\bown\s+view\b/.test(lower)) ||
    /\b(current|this)\s+(provider\s+)?session\s+(details|context)\b/.test(lower)
  );
}

export function rescueExplainProviderContextIntent(
  prompt: string,
  action: string,
): { action: 'explain_provider_context'; rescueReason: string } | null {
  if (action === 'explain_provider_context') return null;
  if (!isExplainProviderContextPrompt(prompt)) return null;
  return {
    action: 'explain_provider_context',
    rescueReason: 'explain_provider_context',
  };
}
