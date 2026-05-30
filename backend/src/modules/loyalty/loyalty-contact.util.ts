import { phoneDigits } from '../../common/utils/phone-country.util.js';

export function normalizeLoyaltyEmail(email?: string | null): string | null {
  if (!email) return null;
  const normalized = email.trim().toLowerCase();
  return normalized.length > 0 ? normalized : null;
}

export function normalizeLoyaltyPhone(phone?: string | null): string | null {
  if (!phone) return null;
  const digits = phoneDigits(phone.trim());
  return digits.length >= 10 ? digits : null;
}

export function collectContactCandidates(input: {
  customerEmail?: string | null;
  customerPhone?: string | null;
  metadata?: Record<string, unknown> | null;
}): { emails: string[]; phones: string[] } {
  const emails = new Set<string>();
  const phones = new Set<string>();

  const addEmail = (value?: string | null) => {
    const normalized = normalizeLoyaltyEmail(value);
    if (normalized) emails.add(normalized);
  };
  const addPhone = (value?: string | null) => {
    const normalized = normalizeLoyaltyPhone(value);
    if (normalized) phones.add(normalized);
  };

  addEmail(input.customerEmail);
  addPhone(input.customerPhone);

  const metadata = input.metadata ?? {};
  addEmail(typeof metadata.customerEmail === 'string' ? metadata.customerEmail : null);
  addPhone(typeof metadata.customerPhone === 'string' ? metadata.customerPhone : null);

  const guest = metadata.guest;
  if (guest && typeof guest === 'object') {
    const guestObj = guest as Record<string, unknown>;
    addEmail(typeof guestObj.email === 'string' ? guestObj.email : null);
    addPhone(typeof guestObj.phone === 'string' ? guestObj.phone : null);
  }

  const customer = metadata.customer;
  if (customer && typeof customer === 'object') {
    const customerObj = customer as Record<string, unknown>;
    addEmail(typeof customerObj.email === 'string' ? customerObj.email : null);
    addPhone(typeof customerObj.phone === 'string' ? customerObj.phone : null);
  }

  return { emails: [...emails], phones: [...phones] };
}
