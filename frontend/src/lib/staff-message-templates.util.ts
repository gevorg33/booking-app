/** prov-exp-6.2 — dashboard editor helpers (mirrors backend util). */

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

export const STAFF_MESSAGE_TEMPLATE_MAX_COUNT = 10;
export const STAFF_MESSAGE_TEMPLATE_LABEL_MAX = 64;
export const STAFF_MESSAGE_TEMPLATE_BODY_MAX = 500;

export const DEFAULT_STAFF_MESSAGE_TEMPLATES: StaffMessageTemplate[] = [
  {
    id: 'running-late',
    label: 'Running late',
    body:
      "Hi {customerName}, I'm running about 10 minutes late for your appointment. Thank you for your patience!",
    enabled: true,
  },
  {
    id: 'confirming-tomorrow',
    label: 'Confirming tomorrow',
    body:
      'Hi {customerName}, confirming your appointment at {businessName} on {appointmentTime}. Reply if you need to change anything.',
    enabled: true,
  },
];

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
  const block = raw?.staffMessageTemplates as Record<string, unknown> | undefined;
  if (!block) return { enabled: false, templates: [] };

  const templates = Array.isArray(block.templates)
    ? block.templates
        .map(normalizeStaffMessageTemplate)
        .filter((template): template is StaffMessageTemplate => template != null)
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

export function createEmptyStaffMessageTemplate(): StaffMessageTemplate {
  const id = slugifyStaffMessageTemplateId(`template-${Date.now()}`);
  return {
    id,
    label: '',
    body: '',
    enabled: true,
  };
}

export function seedDefaultStaffMessageTemplates(): StaffMessageTemplate[] {
  return DEFAULT_STAFF_MESSAGE_TEMPLATES.map((template) => ({ ...template }));
}
