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

export function formToPayload(form: EmployeeFormValues) {
  return {
    name: form.name.trim(),
    email: form.email.trim() || undefined,
    phone: form.phone.trim() || undefined,
    title: form.title.trim() || undefined,
    avatarUrl: form.avatarUrl.trim() || undefined,
    serviceIds: form.serviceIds.length > 0 ? form.serviceIds : undefined,
  };
}
