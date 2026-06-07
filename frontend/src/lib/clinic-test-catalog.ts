export interface ClinicTestTypeRecord {
  id: string;
  businessId: string;
  code: string;
  title: string;
  abbreviation?: string | null;
  description?: string | null;
  unit?: string | null;
  price: number;
  requiresFasting: boolean;
  preparationNotes?: string | null;
  serviceId?: string | null;
  department?: string | null;
  isActive: boolean;
}

export interface ClinicTestPanelRecord {
  id: string;
  businessId: string;
  code: string;
  title: string;
  abbreviation?: string | null;
  description?: string | null;
  price: number;
  isActive: boolean;
  items: Array<{
    id: string;
    testTypeId: string;
    sortOrder: number;
    testType?: { id: string; title: string; code: string };
  }>;
}

export interface ClinicTestTypeFormState {
  title: string;
  code: string;
  abbreviation: string;
  description: string;
  unit: string;
  price: string;
  requiresFasting: boolean;
  preparationNotes: string;
  serviceId: string;
}

export interface ClinicTestPanelFormState {
  title: string;
  code: string;
  abbreviation: string;
  description: string;
  price: string;
  testTypeIds: string[];
}

export function defaultClinicTestTypeForm(): ClinicTestTypeFormState {
  return {
    title: '',
    code: '',
    abbreviation: '',
    description: '',
    unit: '',
    price: '0',
    requiresFasting: false,
    preparationNotes: '',
    serviceId: '',
  };
}

export function defaultClinicTestPanelForm(): ClinicTestPanelFormState {
  return {
    title: '',
    code: '',
    abbreviation: '',
    description: '',
    price: '0',
    testTypeIds: [],
  };
}

export function clinicTestTypeFormToPayload(form: ClinicTestTypeFormState) {
  return {
    title: form.title.trim(),
    code: form.code.trim() || undefined,
    abbreviation: form.abbreviation.trim() || undefined,
    description: form.description.trim() || undefined,
    unit: form.unit.trim() || undefined,
    price: Number(form.price || 0),
    requiresFasting: form.requiresFasting,
    preparationNotes: form.preparationNotes.trim() || undefined,
    serviceId: form.serviceId || null,
  };
}

export function clinicTestPanelFormToPayload(form: ClinicTestPanelFormState) {
  return {
    title: form.title.trim(),
    code: form.code.trim() || undefined,
    abbreviation: form.abbreviation.trim() || undefined,
    description: form.description.trim() || undefined,
    price: Number(form.price || 0),
  };
}

export function clinicTestTypeToForm(
  record: ClinicTestTypeRecord,
): ClinicTestTypeFormState {
  return {
    title: record.title,
    code: record.code,
    abbreviation: record.abbreviation ?? '',
    description: record.description ?? '',
    unit: record.unit ?? '',
    price: String(record.price ?? 0),
    requiresFasting: record.requiresFasting,
    preparationNotes: record.preparationNotes ?? '',
    serviceId: record.serviceId ?? '',
  };
}

export function clinicTestPanelToForm(
  record: ClinicTestPanelRecord,
): ClinicTestPanelFormState {
  return {
    title: record.title,
    code: record.code,
    abbreviation: record.abbreviation ?? '',
    description: record.description ?? '',
    price: String(record.price ?? 0),
    testTypeIds: record.items.map((item) => item.testTypeId),
  };
}
