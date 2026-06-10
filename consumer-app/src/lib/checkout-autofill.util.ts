import type { GuestCheckoutContact } from './guest-booking.util.js';
import { normalizeGuestContact } from './guest-booking.util.js';
import type { PublicCustomerProfile } from './types.js';

const CONTACT_KEY_PREFIX = 'consumer_checkout_contact_';

export interface CheckoutContactSources {
  profile?: PublicCustomerProfile | null;
  draft?: Partial<GuestCheckoutContact> | null;
  remembered?: Partial<GuestCheckoutContact> | null;
}

export function rememberedCheckoutContactKey(slug: string): string {
  return `${CONTACT_KEY_PREFIX}${slug.trim().toLowerCase()}`;
}

export function loadRememberedCheckoutContact(slug: string): GuestCheckoutContact | null {
  if (typeof localStorage === 'undefined' || !slug.trim()) return null;
  try {
    const raw = localStorage.getItem(rememberedCheckoutContactKey(slug));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<GuestCheckoutContact>;
    const normalized = normalizeGuestContact(parsed);
    if (!normalized.name && !normalized.email && !normalized.phone) return null;
    return normalized;
  } catch {
    return null;
  }
}

export function saveRememberedCheckoutContact(
  slug: string,
  contact: GuestCheckoutContact,
): void {
  if (typeof localStorage === 'undefined' || !slug.trim()) return;
  const normalized = normalizeGuestContact(contact);
  if (!normalized.name) return;
  localStorage.setItem(rememberedCheckoutContactKey(slug), JSON.stringify(normalized));
}

export function resolveCheckoutContactPrefill(
  sources: CheckoutContactSources,
): GuestCheckoutContact {
  const pick = (field: keyof GuestCheckoutContact): string => {
    const fromProfile =
      field === 'name'
        ? sources.profile?.name
        : field === 'email'
          ? sources.profile?.email ?? undefined
          : sources.profile?.phone ?? undefined;
    if (fromProfile?.trim()) return fromProfile.trim();

    const fromDraft = sources.draft?.[field];
    if (fromDraft?.trim()) return fromDraft.trim();

    const fromRemembered = sources.remembered?.[field];
    if (fromRemembered?.trim()) return fromRemembered.trim();

    return '';
  };

  return normalizeGuestContact({
    name: pick('name'),
    email: pick('email'),
    phone: pick('phone'),
  });
}

/** Collapse contact fields only when values look fully entered (not after one keystroke). */
export function shouldCompactCheckoutContact(contact: GuestCheckoutContact): boolean {
  const name = contact.name.trim();
  if (name.length < 2) return false;
  const email = contact.email.trim();
  const phoneDigits = contact.phone.replace(/\D/g, '');
  const emailLooksComplete = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  return emailLooksComplete || phoneDigits.length >= 8;
}

export function guestContactFieldAttrs(field: 'name' | 'email' | 'phone'): {
  name: string;
  id: string;
  autocomplete: 'name' | 'email' | 'tel' | 'off';
  inputMode: 'text' | 'email' | 'tel';
  enterKeyHint: 'next' | 'done';
} {
  switch (field) {
    case 'name':
      return {
        name: 'name',
        id: 'checkout-name',
        autocomplete: 'name',
        inputMode: 'text',
        enterKeyHint: 'next',
      };
    case 'email':
      return {
        name: 'email',
        id: 'checkout-email',
        autocomplete: 'email',
        inputMode: 'email',
        enterKeyHint: 'next',
      };
    case 'phone':
      return {
        name: 'tel',
        id: 'checkout-phone',
        autocomplete: 'tel',
        inputMode: 'tel',
        enterKeyHint: 'done',
      };
    default:
      return {
        name: 'off',
        id: 'checkout-off',
        autocomplete: 'off',
        inputMode: 'text',
        enterKeyHint: 'done',
      };
  }
}
