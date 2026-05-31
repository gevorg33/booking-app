export interface EnterpriseTrustSettings {
  legalBusinessName?: string | null;
  registeredAddress?: string | null;
  country?: string | null;
  dpoEmail?: string | null;
  euRepresentative?: string | null;
  privacyPolicyEffectiveDate?: string | null;
  dpaEffectiveDate?: string | null;
  customDataProcessingNotes?: string | null;
}

export const DEFAULT_ENTERPRISE_TRUST_SETTINGS: EnterpriseTrustSettings = {
  legalBusinessName: null,
  registeredAddress: null,
  country: null,
  dpoEmail: null,
  euRepresentative: null,
  privacyPolicyEffectiveDate: null,
  dpaEffectiveDate: null,
  customDataProcessingNotes: null,
};

export function mergeEnterpriseTrustSettings(
  raw?: Record<string, unknown>,
): EnterpriseTrustSettings {
  const partial = (raw ?? {}) as Partial<EnterpriseTrustSettings>;
  return {
    ...DEFAULT_ENTERPRISE_TRUST_SETTINGS,
    ...partial,
    legalBusinessName: partial.legalBusinessName?.trim() || null,
    registeredAddress: partial.registeredAddress?.trim() || null,
    country: partial.country?.trim() || null,
    dpoEmail: partial.dpoEmail?.trim() || null,
    euRepresentative: partial.euRepresentative?.trim() || null,
    customDataProcessingNotes: partial.customDataProcessingNotes?.trim() || null,
  };
}

export interface RenderedTrustDocument {
  id: 'dpa' | 'privacy_policy';
  title: string;
  markdown: string;
  placeholdersFilled: string[];
}

export interface SecurityOnePagerSection {
  id: string;
  title: string;
  bullets: string[];
}

export interface SecurityOnePager {
  title: string;
  lastUpdated: string;
  summary: string;
  sections: SecurityOnePagerSection[];
  contactEmail: string;
}
