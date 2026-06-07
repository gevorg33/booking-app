export interface ExternalDoctorAddressForm {
  street: string;
  unit: string;
  city: string;
  province: string;
  country: string;
  postalCode: string;
}

export interface ExternalDoctorRecord {
  id: string;
  businessId: string;
  name: string;
  clinicName: string | null;
  specialty: string | null;
  address: string;
  street: string;
  unit: string | null;
  city: string;
  province: string;
  country: string;
  postalCode: string;
  fax: string | null;
  phone: string | null;
  email: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ExternalDoctorListResponse {
  items: ExternalDoctorRecord[];
  totalItems: number;
  page: number;
  pageSize: number;
}

export interface ExternalDoctorFormState {
  name: string;
  clinicName: string;
  specialty: string;
  address: ExternalDoctorAddressForm;
  fax: string;
  phone: string;
  email: string;
  isActive: boolean;
}

export function defaultExternalDoctorForm(
  overrides: Partial<ExternalDoctorFormState> = {},
): ExternalDoctorFormState {
  return {
    name: '',
    clinicName: '',
    specialty: '',
    address: {
      street: '',
      unit: '',
      city: '',
      province: '',
      country: '',
      postalCode: '',
    },
    fax: '',
    phone: '',
    email: '',
    isActive: true,
    ...overrides,
  };
}

export function externalDoctorToForm(
  doctor: ExternalDoctorRecord,
): ExternalDoctorFormState {
  return {
    name: doctor.name,
    clinicName: doctor.clinicName ?? '',
    specialty: doctor.specialty ?? '',
    address: {
      street: doctor.street,
      unit: doctor.unit ?? '',
      city: doctor.city,
      province: doctor.province,
      country: doctor.country,
      postalCode: doctor.postalCode,
    },
    fax: doctor.fax ?? '',
    phone: doctor.phone ?? '',
    email: doctor.email ?? '',
    isActive: doctor.isActive,
  };
}

export function externalDoctorFormToPayload(form: ExternalDoctorFormState) {
  return {
    name: form.name.trim(),
    clinicName: form.clinicName.trim() || null,
    specialty: form.specialty.trim() || null,
    address: {
      street: form.address.street.trim(),
      unit: form.address.unit.trim() || null,
      city: form.address.city.trim(),
      province: form.address.province.trim(),
      country: form.address.country.trim(),
      postalCode: form.address.postalCode.trim(),
    },
    fax: form.fax.trim() || null,
    phone: form.phone.trim() || null,
    email: form.email.trim() || null,
    isActive: form.isActive,
  };
}

export function unwrapExternalDoctorsList(payload: unknown): ExternalDoctorListResponse {
  const root = (payload as { data?: unknown })?.data ?? payload;
  const nested = (root as { data?: unknown })?.data ?? root;
  const list = nested as ExternalDoctorListResponse;
  return {
    items: Array.isArray(list.items) ? list.items : [],
    totalItems: list.totalItems ?? 0,
    page: list.page ?? 1,
    pageSize: list.pageSize ?? 20,
  };
}

export function unwrapExternalDoctorRecord(payload: unknown): ExternalDoctorRecord {
  const root = (payload as { data?: unknown })?.data ?? payload;
  return root as ExternalDoctorRecord;
}
