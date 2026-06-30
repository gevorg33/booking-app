export const CUSTOMER_PUBLIC_COMPARE_SERVICES_CLASSIFIER_RULES = `- compare_services: READ — side-by-side catalog comparison of two or more named services (price, duration, optional tax badge). Triggers: "Haircut vs blowdry price and duration", compare haircut and blowdry, difference between massage and facial, which is cheaper manicure or pedicure. Set serviceNames to every catalog service the user names (2+). Summarize listed card prices and durations; optional navigate to the services catalog. NOT explain_service_price (single-service price), NOT list_services (catalog browse or budget filters), NOT discover_packages (bundles), and NOT explain_checkout_total (checkout amount math).`;

export type CompareServicesPromptFixture = {
  id: string;
  prompt: string;
  surface: 'customer' | 'public';
  expectedAction: 'compare_services';
  serviceNames: readonly [string, string];
  rescueReason: 'service_compare';
};

export const COMPARE_SERVICES_PROMPTS: readonly CompareServicesPromptFixture[] =
  [
    {
      id: 'haircut-vs-blowdry-customer',
      prompt: 'Haircut vs blowdry price and duration',
      surface: 'customer',
      expectedAction: 'compare_services',
      serviceNames: ['haircut', 'blowdry'],
      rescueReason: 'service_compare',
    },
    {
      id: 'compare-haircut-blowdry-customer',
      prompt: 'Compare haircut and blowdry',
      surface: 'customer',
      expectedAction: 'compare_services',
      serviceNames: ['haircut', 'blowdry'],
      rescueReason: 'service_compare',
    },
    {
      id: 'difference-massage-facial-customer',
      prompt: 'What is the difference between massage and facial?',
      surface: 'customer',
      expectedAction: 'compare_services',
      serviceNames: ['massage', 'facial'],
      rescueReason: 'service_compare',
    },
    {
      id: 'swedish-vs-deep-tissue-customer',
      prompt: 'Swedish massage vs deep tissue price',
      surface: 'customer',
      expectedAction: 'compare_services',
      serviceNames: ['Swedish massage', 'deep tissue'],
      rescueReason: 'service_compare',
    },
    {
      id: 'cheaper-manicure-pedicure-customer',
      prompt: 'Which is cheaper, manicure or pedicure?',
      surface: 'customer',
      expectedAction: 'compare_services',
      serviceNames: ['manicure', 'pedicure'],
      rescueReason: 'service_compare',
    },
    {
      id: 'trim-vs-haircut-duration-customer',
      prompt: 'Trim vs haircut duration',
      surface: 'customer',
      expectedAction: 'compare_services',
      serviceNames: ['trim', 'haircut'],
      rescueReason: 'service_compare',
    },
    {
      id: 'color-highlights-compare-customer',
      prompt: 'Compare color and highlights pricing',
      surface: 'customer',
      expectedAction: 'compare_services',
      serviceNames: ['color', 'highlights'],
      rescueReason: 'service_compare',
    },
    {
      id: 'waxing-versus-facial-customer',
      prompt: 'Waxing versus facial cost',
      surface: 'customer',
      expectedAction: 'compare_services',
      serviceNames: ['waxing', 'facial'],
      rescueReason: 'service_compare',
    },
    {
      id: 'blowdry-color-pricing-customer',
      prompt: 'How do blowdry and color compare on pricing?',
      surface: 'customer',
      expectedAction: 'compare_services',
      serviceNames: ['blowdry', 'color'],
      rescueReason: 'service_compare',
    },
    {
      id: 'spa-day-massage-customer',
      prompt: 'Difference between spa day and massage price and time',
      surface: 'customer',
      expectedAction: 'compare_services',
      serviceNames: ['spa day', 'massage'],
      rescueReason: 'service_compare',
    },
    {
      id: 'manicure-gel-nails-customer',
      prompt: 'Manicure vs gel nails price and time',
      surface: 'customer',
      expectedAction: 'compare_services',
      serviceNames: ['manicure', 'gel nails'],
      rescueReason: 'service_compare',
    },
    {
      id: 'longer-facial-massage-customer',
      prompt: 'Which takes longer, facial or massage?',
      surface: 'customer',
      expectedAction: 'compare_services',
      serviceNames: ['facial', 'massage'],
      rescueReason: 'service_compare',
    },
    {
      id: 'haircut-vs-blowdry-public',
      prompt: 'Haircut vs blowdry price and duration',
      surface: 'public',
      expectedAction: 'compare_services',
      serviceNames: ['haircut', 'blowdry'],
      rescueReason: 'service_compare',
    },
    {
      id: 'compare-haircut-blowdry-public',
      prompt: 'Compare haircut and blowdry',
      surface: 'public',
      expectedAction: 'compare_services',
      serviceNames: ['haircut', 'blowdry'],
      rescueReason: 'service_compare',
    },
    {
      id: 'difference-massage-facial-public',
      prompt: 'What is the difference between massage and facial?',
      surface: 'public',
      expectedAction: 'compare_services',
      serviceNames: ['massage', 'facial'],
      rescueReason: 'service_compare',
    },
    {
      id: 'swedish-vs-deep-tissue-public',
      prompt: 'Swedish massage vs deep tissue price',
      surface: 'public',
      expectedAction: 'compare_services',
      serviceNames: ['Swedish massage', 'deep tissue'],
      rescueReason: 'service_compare',
    },
    {
      id: 'cheaper-manicure-pedicure-public',
      prompt: 'Which is cheaper, manicure or pedicure?',
      surface: 'public',
      expectedAction: 'compare_services',
      serviceNames: ['manicure', 'pedicure'],
      rescueReason: 'service_compare',
    },
    {
      id: 'trim-vs-haircut-duration-public',
      prompt: 'Trim vs haircut duration',
      surface: 'public',
      expectedAction: 'compare_services',
      serviceNames: ['trim', 'haircut'],
      rescueReason: 'service_compare',
    },
    {
      id: 'color-highlights-compare-public',
      prompt: 'Compare color and highlights pricing',
      surface: 'public',
      expectedAction: 'compare_services',
      serviceNames: ['color', 'highlights'],
      rescueReason: 'service_compare',
    },
    {
      id: 'waxing-versus-facial-public',
      prompt: 'Waxing versus facial cost',
      surface: 'public',
      expectedAction: 'compare_services',
      serviceNames: ['waxing', 'facial'],
      rescueReason: 'service_compare',
    },
    {
      id: 'blowdry-color-pricing-public',
      prompt: 'How do blowdry and color compare on pricing?',
      surface: 'public',
      expectedAction: 'compare_services',
      serviceNames: ['blowdry', 'color'],
      rescueReason: 'service_compare',
    },
    {
      id: 'spa-day-massage-public',
      prompt: 'Difference between spa day and massage price and time',
      surface: 'public',
      expectedAction: 'compare_services',
      serviceNames: ['spa day', 'massage'],
      rescueReason: 'service_compare',
    },
    {
      id: 'manicure-gel-nails-public',
      prompt: 'Manicure vs gel nails price and time',
      surface: 'public',
      expectedAction: 'compare_services',
      serviceNames: ['manicure', 'gel nails'],
      rescueReason: 'service_compare',
    },
    {
      id: 'longer-facial-massage-public',
      prompt: 'Which takes longer, facial or massage?',
      surface: 'public',
      expectedAction: 'compare_services',
      serviceNames: ['facial', 'massage'],
      rescueReason: 'service_compare',
    },
  ];

const COMPARE_STOP_WORDS =
  /^(?:the|a|an|on|for|price|prices|pricing|cost|costs|duration|durations|time|times|longer|shorter|cheaper|more|less|expensive|compare|comparison)$/i;

function pruneCompareServiceName(raw: string): string | null {
  let name = raw.trim().replace(/[,.?]+$/, '');
  name = name.replace(/-(?:ը|ն|ի)$/u, '');
  name = name.replace(/\s+տևողություն(?:\s+.*)?$/u, '');
  name = name.replace(
    /\s+(?:price|prices|pricing|cost|costs|duration|durations|time|times|տևողություն|по\s+цене(?:\s+и\s+длительности)?|по\s+длительности|գնով(?:\s+և\s+տևողությամբ)?|տևողությամբ)\b.*$/iu,
    '',
  );
  name = name.trim();
  if (!name || name.length < 2 || COMPARE_STOP_WORDS.test(name)) return null;
  return name;
}

function normalizeCompareExtractedName(name: string): string {
  const trimmed = name.trim();
  if (/^[A-Z][a-z]+$/.test(trimmed)) {
    return trimmed.charAt(0).toLowerCase() + trimmed.slice(1);
  }
  return trimmed;
}

export function extractCompareServiceNamesFromPrompt(prompt: string): string[] {
  const names: string[] = [];
  const quoted = [...prompt.matchAll(/["']([^"']+?)["']/g)].map((match) =>
    match[1].trim(),
  );
  names.push(...quoted);

  const patterns: RegExp[] = [
    /\bdifference\s+between\s+(.+?)\s+and\s+(.+?)(?:\s+(?:price|duration|cost|time)\b|\?|$)/i,
    /\bcompare\s+(.+?)\s+and\s+(.+?)(?:\s+(?:price|duration|cost|pricing)\b|\?|$)/i,
    /\b(.+?)\s+vs\.?\s+(.+?)(?:\s+(?:price|duration|cost|time)\b|\?|$)/i,
    /\b(.+?)\s+versus\s+(.+?)(?:\s+(?:price|duration|cost|time)\b|\?|$)/i,
    /\bwhich\s+is\s+(?:cheaper|more\s+expensive|longer|shorter),?\s+(.+?)\s+or\s+(.+?)\??$/i,
    /\bwhich\s+takes\s+longer,?\s+(.+?)\s+or\s+(.+?)\??$/i,
    /\bhow\s+do\s+(.+?)\s+and\s+(.+?)\s+compare\b/i,
    /сравни\s+(.+?)\s+и\s+(.+?)(?:\s+по\s+|\?|$)/iu,
    /համեմատիր\s+(.+?)\s+և\s+(.+?)(?:\s+գնով|\?|$)/iu,
    /что\s+дешевле[^?]*?([\wа-яё\s-]+?)\s+или\s+([\wа-яё\s-]+)/iu,
    /(?:ավելի\s+էժան|էժան)\s+(.+?)\s+թե\s+(.+?)\??$/iu,
  ];

  for (const pattern of patterns) {
    const match = prompt.match(pattern);
    if (match?.[1] && match?.[2]) {
      const left = pruneCompareServiceName(match[1]);
      const right = pruneCompareServiceName(match[2]);
      if (left) names.push(left);
      if (right) names.push(right);
    }
  }

  const unique: string[] = [];
  for (const name of names) {
    const trimmed = normalizeCompareExtractedName(name);
    if (!trimmed) continue;
    const key = trimmed.toLowerCase();
    if (!unique.some((entry) => entry.toLowerCase() === key)) {
      unique.push(trimmed);
    }
  }
  return unique;
}

function hasCompareCue(prompt: string): boolean {
  return (
    /\b(?:compare|comparison|versus|vs\.?|difference\s+between)\b/i.test(
      prompt,
    ) ||
    /\bwhich\s+is\s+(?:cheaper|more\s+expensive|longer|shorter)\b/i.test(
      prompt,
    ) ||
    /\bwhich\s+takes\s+longer\b/i.test(prompt) ||
    /\bhow\s+do\s+.+\s+and\s+.+\s+compare\b/i.test(prompt) ||
    /(?:համեմատ|сравни|сравнение|сравнить|дешевле|дороже|длительност|էժան)/iu.test(
      prompt,
    )
  );
}

export function isCompareServicesPrompt(prompt: string): boolean {
  if (!hasCompareCue(prompt)) return false;

  if (
    /(?:համեմատ|сравни|сравнение|сравнить)/iu.test(prompt) &&
    (/\band\b/i.test(prompt) ||
      /\bvs\.?\b/i.test(prompt) ||
      /\bversus\b/i.test(prompt) ||
      /\bկամ\b/u.test(prompt) ||
      /\bили\b/iu.test(prompt))
  ) {
    return true;
  }

  if (/что\s+дешевле/iu.test(prompt) && /\bили\b/iu.test(prompt)) {
    return true;
  }

  if (/ավելի\s+էժան/iu.test(prompt) && /թե/u.test(prompt)) {
    return true;
  }

  if (/\bvs\.?\b/i.test(prompt) || /\bversus\b/i.test(prompt)) return true;
  if (/\bdifference\s+between\b/i.test(prompt) && /\band\b/i.test(prompt)) {
    return true;
  }
  if (/\bcompare\b/i.test(prompt) && /\band\b/i.test(prompt)) return true;
  if (
    /\bwhich\s+is\s+(?:cheaper|more\s+expensive|longer|shorter)\b/i.test(
      prompt,
    ) &&
    /\bor\b/i.test(prompt)
  ) {
    return true;
  }
  if (/\bwhich\s+takes\s+longer\b/i.test(prompt) && /\bor\b/i.test(prompt)) {
    return true;
  }
  if (/\bhow\s+do\s+.+\s+and\s+.+\s+compare\b/i.test(prompt)) return true;

  return extractCompareServiceNamesFromPrompt(prompt).length >= 2;
}

export function enrichCompareServicesParamsFromPrompt(
  params: Record<string, unknown>,
  prompt: string,
): Record<string, unknown> {
  const extracted = extractCompareServiceNamesFromPrompt(prompt);
  const existing = Array.isArray(params.serviceNames)
    ? (params.serviceNames as string[])
        .map((entry) => (typeof entry === 'string' ? entry.trim() : ''))
        .filter(Boolean)
    : [];
  const serviceNames = existing.length >= 2 ? existing : extracted;
  return {
    ...params,
    ...(serviceNames.length >= 2 ? { serviceNames } : {}),
  };
}

export function rescueCompareServicesIntent(
  prompt: string,
  action: string,
): { action: 'compare_services'; rescueReason: string } | null {
  if (action === 'compare_services') return null;
  if (!isCompareServicesPrompt(prompt)) return null;
  return { action: 'compare_services', rescueReason: 'service_compare' };
}

export function detectCompareServicesAction(
  prompt: string,
): 'compare_services' | null {
  return rescueCompareServicesIntent(prompt, 'unknown')?.action ?? null;
}
