/** prov-exp-6.2 — business-configured canned SMS/WhatsApp snippets for provider mobile. */

import {
  buildCustomerSmsLink,
  buildCustomerWhatsAppLink,
  normalizeCustomerPhoneDigits,
} from './provider-customer-contact.util.js';

export interface StaffMessageTemplate {
  id: string;
  label: string;
  body: string;
  enabled: boolean;
}

export interface StaffMessageTemplatesSettings {
  enabled: boolean;
  templates: StaffMessageTemplate[];
}

export interface StaffMessageTemplateContext {
  customerName?: string | null;
  businessName?: string | null;
  appointmentTime?: string | null;
}

export interface ResolvedStaffMessageTemplate {
  id: string;
  label: string;
  body: string;
}

export const STAFF_MESSAGE_TEMPLATE_MAX_COUNT = 10;
export const STAFF_MESSAGE_TEMPLATE_LABEL_MAX = 64;
export const STAFF_MESSAGE_TEMPLATE_BODY_MAX = 500;

export const DEFAULT_STAFF_MESSAGE_TEMPLATES: StaffMessageTemplate[] = [
  {
    id: 'running-late',
    label: 'Running late',
    body: "Hi {customerName}, I'm running about 10 minutes late for your appointment. Thank you for your patience!",
    enabled: true,
  },
  {
    id: 'confirming-tomorrow',
    label: 'Confirming tomorrow',
    body: 'Hi {customerName}, confirming your appointment at {businessName} on {appointmentTime}. Reply if you need to change anything.',
    enabled: true,
  },
];

const PLACEHOLDER_PATTERN = /\{(\w+)\}/g;

export function slugifyStaffMessageTemplateId(label: string): string {
  const slug = label
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);
  return slug || `template-${Date.now().toString(36)}`;
}

export function readStaffMessageTemplatesSettings(
  raw?: Record<string, unknown> | null,
): StaffMessageTemplatesSettings {
  const block = raw?.staffMessageTemplates as
    | Record<string, unknown>
    | undefined;
  if (!block) {
    return { enabled: false, templates: [] };
  }

  const templates = Array.isArray(block.templates)
    ? block.templates
        .map(normalizeStaffMessageTemplate)
        .filter(
          (template): template is StaffMessageTemplate => template != null,
        )
    : [];

  return {
    enabled: block.enabled === true,
    templates,
  };
}

export function normalizeStaffMessageTemplate(
  raw: unknown,
): StaffMessageTemplate | null {
  if (!raw || typeof raw !== 'object') return null;
  const row = raw as Record<string, unknown>;
  const label = typeof row.label === 'string' ? row.label.trim() : '';
  const body = typeof row.body === 'string' ? row.body.trim() : '';
  if (!label || !body) return null;

  const idRaw = typeof row.id === 'string' ? row.id.trim() : '';
  const id = idRaw || slugifyStaffMessageTemplateId(label);

  return {
    id: id.slice(0, 64),
    label: label.slice(0, STAFF_MESSAGE_TEMPLATE_LABEL_MAX),
    body: body.slice(0, STAFF_MESSAGE_TEMPLATE_BODY_MAX),
    enabled: row.enabled !== false,
  };
}

export function normalizeStaffMessageTemplatesSettings(
  input: Partial<StaffMessageTemplatesSettings>,
): StaffMessageTemplatesSettings {
  const templates = (input.templates ?? [])
    .map(normalizeStaffMessageTemplate)
    .filter((template): template is StaffMessageTemplate => template != null)
    .slice(0, STAFF_MESSAGE_TEMPLATE_MAX_COUNT);

  const seen = new Set<string>();
  const deduped: StaffMessageTemplate[] = [];
  for (const template of templates) {
    let id = template.id;
    let suffix = 2;
    while (seen.has(id)) {
      id = `${template.id}-${suffix}`;
      suffix += 1;
    }
    seen.add(id);
    deduped.push({ ...template, id });
  }

  return {
    enabled: input.enabled === true,
    templates: deduped,
  };
}

export function isStaffMessageTemplatesFeatureEnabled(
  settings: StaffMessageTemplatesSettings,
): boolean {
  if (!settings.enabled) return false;
  return listActiveStaffMessageTemplates(settings).length > 0;
}

export function listActiveStaffMessageTemplates(
  settings: StaffMessageTemplatesSettings,
): StaffMessageTemplate[] {
  const source =
    settings.templates.length > 0
      ? settings.templates
      : settings.enabled
        ? DEFAULT_STAFF_MESSAGE_TEMPLATES
        : [];

  return source.filter(
    (template) =>
      template.enabled && template.label.trim() && template.body.trim(),
  );
}

export function resolveStaffMessageTemplateBody(
  body: string,
  context: StaffMessageTemplateContext,
): string {
  const replacements: Record<string, string> = {
    customerName: context.customerName?.trim() || 'there',
    businessName: context.businessName?.trim() || 'our salon',
    appointmentTime: context.appointmentTime?.trim() || 'your scheduled time',
  };

  return body.replace(PLACEHOLDER_PATTERN, (_match, key: string) => {
    return replacements[key] ?? '';
  });
}

export function resolveStaffMessageTemplatesForBooking(
  settings: StaffMessageTemplatesSettings,
  context: StaffMessageTemplateContext,
): ResolvedStaffMessageTemplate[] {
  return listActiveStaffMessageTemplates(settings).map((template) => ({
    id: template.id,
    label: template.label,
    body: resolveStaffMessageTemplateBody(template.body, context),
  }));
}

export function buildCustomerSmsLinkWithBody(
  phone: string,
  body: string,
): string | null {
  const base = buildCustomerSmsLink(phone);
  const trimmedBody = body.trim();
  if (!base || !trimmedBody) return base;
  const separator = base.includes('?') ? '&' : '?';
  return `${base}${separator}body=${encodeURIComponent(trimmedBody)}`;
}

export function buildCustomerWhatsAppLinkWithBody(
  phone: string,
  body: string,
): string | null {
  const digits = normalizeCustomerPhoneDigits(phone);
  const trimmedBody = body.trim();
  if (!digits) return null;
  if (!trimmedBody) return buildCustomerWhatsAppLink(phone);
  return `https://wa.me/${digits}?text=${encodeURIComponent(trimmedBody)}`;
}

export function serializeStaffMessageTemplatesSettings(
  settings: StaffMessageTemplatesSettings,
): Record<string, unknown> {
  return {
    staffMessageTemplates: normalizeStaffMessageTemplatesSettings(settings),
  };
}
