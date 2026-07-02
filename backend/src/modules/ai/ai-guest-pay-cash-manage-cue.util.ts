export function isGuestPayCashManagePastBookingPrompt(prompt: string): boolean {
  return (
    /\b(?:i|we|already)\s+(?:have\s+)?booked\b/i.test(prompt) ||
    /\bbooked\s+as\s+(?:a\s+)?guest\b/i.test(prompt)
  );
}

export function hasGuestPayCashManageGuestCue(prompt: string): boolean {
  return (
    /\bbook(?:ing)?\s+as\s+(?:a\s+)?guest\b/i.test(prompt) ||
    /\bbook\s+without\s+(?:an?\s+)?account\b/i.test(prompt) ||
    /\bbook\s+without\s+(?:creating|signing\s+in)\b/i.test(prompt) ||
    /\bguest\s+(?:checkout\s+and\s+)?book\b/i.test(prompt) ||
    /\bcomplete\s+(?:a\s+)?guest\s+booking\b/i.test(prompt) ||
    (/\b(?:guest|without\s+(?:an?\s+)?account)\b/i.test(prompt) &&
      /\b(?:book|schedule|reserve|complete)\b/i.test(prompt))
  );
}

export function hasGuestPayCashManageCashCue(prompt: string): boolean {
  if (
    /\b(skip|without|bypass|avoid|instead|rather\s+than|no\s+online|don't\s+pay\s+online)\b/i.test(
      prompt,
    ) &&
    /\b(online|stripe|card)\b/i.test(prompt)
  ) {
    return false;
  }
  return (
    /\b(?:pay\s+(?:in\s+)?cash|cash\s+(?:payment\s+)?at\s+(?:the\s+|my\s+)?(?:visit|appointment)|pay\s+at\s+(?:the\s+)?venue|pay\s+cash|pay\s+at\s+visit)\b/i.test(
      prompt,
    ) ||
    (/\b(?:i(?:'ll|\s+will)|choose|select)\b/i.test(prompt) &&
      /\b(?:pay\s+(?:in\s+)?cash|pay\s+at\s+(?:the\s+)?venue)\b/i.test(prompt))
  );
}

export function hasGuestPayCashManageLinkCue(prompt: string): boolean {
  return (
    (/\b(?:manage|booking|self[\s-]?service|appointment)\s+link\b/i.test(
      prompt,
    ) &&
      /\b(?:email|send|text|sms|resend|get|uxarkel|ссылк|hghum)\b/i.test(
        prompt,
      )) ||
    /\bemail\s+(?:me\s+)?(?:the\s+)?(?:manage|booking)\s+link\b/i.test(prompt)
  );
}

export function isGuestPayCashManageCompoundCandidate(prompt: string): boolean {
  const text = prompt.trim();
  if (text.length < 24) return false;
  if (isGuestPayCashManagePastBookingPrompt(text)) return false;
  if (
    /\blist\s+my\s+appointments?\b/i.test(text) &&
    hasGuestPayCashManageLinkCue(text)
  ) {
    return false;
  }
  if (!hasGuestPayCashManageGuestCue(text)) return false;
  if (!hasGuestPayCashManageCashCue(text)) return false;
  if (!hasGuestPayCashManageLinkCue(text)) return false;
  return true;
}
