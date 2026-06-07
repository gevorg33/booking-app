import type { ExternalDoctor } from './entities/external-doctor.entity.js';
import { formatExternalDoctorAddress } from '../../common/utils/external-doctor-address.util.js';

export interface ExternalDoctorView {
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
  items: ExternalDoctorView[];
  totalItems: number;
  page: number;
  pageSize: number;
}

export const EXTERNAL_DOCTOR_LIST_DEFAULT_PAGE_SIZE = 20;

export function mapExternalDoctorView(
  doctor: ExternalDoctor,
): ExternalDoctorView {
  return {
    id: doctor.id,
    businessId: doctor.businessId,
    name: doctor.name,
    clinicName: doctor.clinicName ?? null,
    specialty: doctor.specialty ?? null,
    address: formatExternalDoctorAddress({
      street: doctor.street,
      unit: doctor.unit,
      city: doctor.city,
      province: doctor.province,
      country: doctor.country,
      postalCode: doctor.postalCode,
    }),
    street: doctor.street,
    unit: doctor.unit ?? null,
    city: doctor.city,
    province: doctor.province,
    country: doctor.country,
    postalCode: doctor.postalCode,
    fax: doctor.faxNumber ?? null,
    phone: doctor.phone ?? null,
    email: doctor.email ?? null,
    isActive: doctor.isActive,
    createdAt: doctor.createdAt.toISOString(),
    updatedAt: doctor.updatedAt.toISOString(),
  };
}

export function mapExternalDoctorSummary(
  doctor: Pick<
    ExternalDoctor,
    | 'id'
    | 'name'
    | 'clinicName'
    | 'street'
    | 'city'
    | 'province'
    | 'country'
    | 'postalCode'
    | 'faxNumber'
  > & { unit?: string | null },
): Pick<ExternalDoctorView, 'id' | 'name' | 'clinicName' | 'address' | 'fax'> {
  return {
    id: doctor.id,
    name: doctor.name,
    clinicName: doctor.clinicName ?? null,
    address: formatExternalDoctorAddress({
      street: doctor.street,
      unit: doctor.unit,
      city: doctor.city,
      province: doctor.province,
      country: doctor.country,
      postalCode: doctor.postalCode,
    }),
    fax: doctor.faxNumber ?? null,
  };
}
