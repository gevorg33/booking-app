import { extractServiceNameFromPrompt } from './ai-payments.util.js';

export function hasCancelPackageRebookSinglePackageCue(
  prompt: string,
): boolean {
  const packageContext =
    /\b(?:package\s+visit|spa\s+day|package\s+appointment|package\s+bundle)\b/i.test(
      prompt,
    ) ||
    (/\bpackage\b/i.test(prompt) &&
      /\b(?:visit|appointment)\b/i.test(prompt)) ||
    /\bvisit\s+\d+\b/i.test(prompt);

  const cancelIntent =
    (/\b(?:cancel|skip)\b/i.test(prompt) &&
      !/\b(?:cancel\s+policy|cancellation\s+policy|explain|rules?|policy|terms?)\b/i.test(
        prompt,
      )) ||
    (/(?:չեղարկ|չեղարկել|բաց\s+թող)/i.test(prompt) &&
      /(?:package|visit|spa)/i.test(prompt)) ||
    (/(?:отмен|отменить|отмени|пропуст)/i.test(prompt) &&
      /(?:пакет|визит|spa)/i.test(prompt));

  return packageContext && cancelIntent;
}

export function hasCancelPackageRebookSingleBookCue(prompt: string): boolean {
  if (!/\b(?:book|schedule|reserve|get)\b/i.test(prompt)) return false;
  if (
    /\b(?:nearest|soonest|next\s+available|first\s+available|earliest|asap)\b/i.test(
      prompt,
    ) &&
    !/\binstead\b/i.test(prompt)
  ) {
    return false;
  }
  return (
    /\binstead\b/i.test(prompt) ||
    /\bsingle\s+(?:service|appointment|visit|booking)\b/i.test(prompt) ||
    /\b(?:rather|not\s+the\s+package)\b/i.test(prompt) ||
    /\bbook\s+(?:a|an|the)\s+[a-z]/i.test(prompt)
  );
}

export function extractBookSingleServiceFromPrompt(
  prompt: string,
): string | null {
  const insteadMatch = prompt.match(
    /\b(?:book|schedule|reserve)\s+(?:a|an|the)\s+([a-z][\w\s'-]{2,30}?)\s+instead\b/i,
  );
  if (insteadMatch?.[1]) {
    const name = insteadMatch[1].trim().replace(/[,.]$/, '');
    if (name && !/^(the|a|an|package|visit|slot)$/i.test(name)) {
      return name;
    }
  }
  const bookInstead = prompt.match(
    /\bbook\s+([a-z][\w\s'-]{2,30}?)\s+instead\b/i,
  );
  if (bookInstead?.[1]) {
    const name = bookInstead[1].trim().replace(/[,.]$/, '');
    if (name && !/^(the|a|an|package|visit|slot|single)$/i.test(name)) {
      return name;
    }
  }
  return extractServiceNameFromPrompt(prompt);
}

export function isCancelPackageRebookSingleCompoundCandidate(
  prompt: string,
): boolean {
  const text = prompt.trim();
  if (text.length < 24) return false;
  if (!hasCancelPackageRebookSinglePackageCue(text)) return false;
  if (!hasCancelPackageRebookSingleBookCue(text)) return false;
  return true;
}
