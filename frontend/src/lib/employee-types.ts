export interface EmployeeRecord {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  userId?: string | null;
  serviceIds?: string[];
  metadata?: {
    title?: string;
    role?: string;
    avatarUrl?: string;
  };
  isActive?: boolean;
}

export interface EmployeeFormValues {
  name: string;
  email: string;
  phone: string;
  title: string;
  avatarUrl: string;
  serviceIds: string[];
}

export const emptyEmployeeForm = (): EmployeeFormValues => ({
  name: '',
  email: '',
  phone: '',
  title: '',
  avatarUrl: '',
  serviceIds: [],
});

export function employeeTitle(employee: Pick<EmployeeRecord, 'metadata'>): string {
  return employee.metadata?.title || employee.metadata?.role || '';
}

export function employeeAvatarUrl(employee: Pick<EmployeeRecord, 'metadata'>): string | null {
  return employee.metadata?.avatarUrl || null;
}

export function employeeToForm(employee: EmployeeRecord): EmployeeFormValues {
  return {
    name: employee.name ?? '',
    email: employee.email ?? '',
    phone: employee.phone ?? '',
    title: employeeTitle(employee),
    avatarUrl: employeeAvatarUrl(employee) ?? '',
    serviceIds: employee.serviceIds ?? [],
  };
}

import { formatPhoneForApi, isValidPhone } from '@/lib/phone-format';

export function formToPayload(form: EmployeeFormValues) {
  const phoneRaw = form.phone.trim();
  let phone: string | undefined;
  if (phoneRaw) {
    if (!isValidPhone(phoneRaw)) {
      throw new Error('INVALID_PHONE');
    }
    phone = formatPhoneForApi(phoneRaw);
  }

  return {
    name: form.name.trim(),
    email: form.email.trim() || undefined,
    phone,
    title: form.title.trim() || undefined,
    avatarUrl: form.avatarUrl.trim() || undefined,
    serviceIds: form.serviceIds.length > 0 ? form.serviceIds : undefined,
  };
}
