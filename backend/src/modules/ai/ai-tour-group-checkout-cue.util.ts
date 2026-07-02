const CAPACITY_GATE_CUE = new RegExp(
  String.raw`\b(?:book|reserve)\s+if\s+(?:enough|there\s+are\s+enough)\s+(?:seats?|spots?)\b|\b(?:only\s+)?if\s+(?:enough|there\s+are\s+enough)\s+(?:seats?|spots?)\b|\bwhen\s+(?:seats?|spots?)\s+(?:are\s+)?available\b|\bif\s+capacity\s+allows?\b|\bwhen\s+capacity\s+allows?\b|\bbook\s+only\s+if\b|\b(?:reserve|book)\s+when\s+(?:seats?|spots?)\b|(?:եթե|միայն\s+եթե).{0,20}(?:տեղ|բավական)|(?:если|только\s+если).{0,20}(?:мест|хватит)`,
  'iu',
);

export function hasTourGroupCheckoutCapacityGateCue(prompt: string): boolean {
  return CAPACITY_GATE_CUE.test(prompt);
}
