const RESULTS_NOUN =
  /\b(?:lab|test)\s+results?\b|\bmy\s+results\b|\b(?:CBC|lipid(?:\s+panel)?)\b/i;

const RESULTS_READY_CUE =
  /\b(?:released|ready|are\s+out|available|in\s+my\s+account)\b|թողարկված|выпущен|готов/i;

export function hasResultsThenRebookResultsCue(prompt: string): boolean {
  if (/^results?\s+(?:released|ready|are\s+out)\b/i.test(prompt.trim())) {
    return true;
  }
  if (RESULTS_READY_CUE.test(prompt) && RESULTS_NOUN.test(prompt)) {
    return true;
  }
  if (/\bresults?\s+(?:released|ready|are\s+out)\b/i.test(prompt)) {
    return true;
  }
  if (
    /\b(?:released|ready)\b.*\b(?:results?|CBC|lipid)\b/i.test(prompt) ||
    /\b(?:results?|CBC|lipid)\b.*\b(?:released|ready)\b/i.test(prompt)
  ) {
    return true;
  }
  if (
    /\b(?:explain|what\s+does)\b/i.test(prompt) &&
    RESULTS_NOUN.test(prompt) &&
    /\b(?:released|pending|reviewed|ready)\b/i.test(prompt)
  ) {
    return true;
  }
  return false;
}

export function hasResultsThenRebookFollowUpCue(prompt: string): boolean {
  if (/\bfollow[-\s]?up\b/i.test(prompt)) return true;
  if (/\b(?:rebook|repeat)\b.*\b(?:last|same)\b/i.test(prompt)) return true;
  if (
    /\b(?:book|schedule)\b.*\b(?:same|last|again|like\s+last)\b/i.test(prompt)
  ) {
    return true;
  }
  if (
    /\b(?:same|like\s+last)\b.*\b(?:time|visit|appointment|booking|service)\b/i.test(
      prompt,
    )
  ) {
    return true;
  }
  if (/\bbook\s+the\s+same\s+as\s+last\b/i.test(prompt)) return true;
  if (/\brebook\s+my\s+last\b/i.test(prompt)) return true;
  if (
    /\b(?:same\s+service|same\s+appointment)\b.*\b(?:last|again)\b/i.test(
      prompt,
    )
  ) {
    return true;
  }
  return false;
}
