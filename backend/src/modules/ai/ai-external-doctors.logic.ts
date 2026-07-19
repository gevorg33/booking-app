import type { ExternalDoctorsService } from '../external-doctors/external-doctors.service.js';
import type { CommandResult } from './command-completion.types.js';

export interface ExternalDoctorsLogicDeps {
  externalDoctorsService: Pick<
    ExternalDoctorsService,
    | 'listExternalDoctors'
    | 'createExternalDoctor'
    | 'updateExternalDoctor'
  >;
}

function failure(
  action: string,
  summary: string,
  details: Record<string, unknown> = {},
): CommandResult {
  return { success: false, action, summary, details };
}

function success(
  action: string,
  summary: string,
  details: Record<string, unknown> = {},
): CommandResult {
  return { success: true, action, summary, details };
}

async function resolveExternalDoctorId(
  deps: ExternalDoctorsLogicDeps,
  businessId: string,
  userId: string,
  params: Record<string, any>,
): Promise<{ id: string } | { error: CommandResult }> {
  if (typeof params.doctorId === 'string' && params.doctorId.trim()) {
    return { id: params.doctorId.trim() };
  }
  const name =
    typeof params.doctorName === 'string' ? params.doctorName.trim() : '';
  if (!name) {
    return {
      error: failure(
        'update_external_doctor',
        'Which external doctor should I update? Provide doctorId or doctorName.',
        { clarify: true, missing: ['doctorId', 'doctorName'] },
      ),
    };
  }
  const { items } = await deps.externalDoctorsService.listExternalDoctors(
    businessId,
    userId,
    { q: name, activeOnly: false },
  );
  const needle = name.toLowerCase();
  const match =
    items.find((d) => d.name.toLowerCase() === needle) ??
    items.find((d) => d.name.toLowerCase().includes(needle));
  if (!match) {
    return {
      error: failure(
        'update_external_doctor',
        `No external doctor found matching "${name}".`,
      ),
    };
  }
  return { id: match.id };
}

export async function handleCreateExternalDoctorLogic(
  deps: ExternalDoctorsLogicDeps,
  businessId: string,
  userId: string | undefined,
  params: Record<string, any>,
): Promise<CommandResult> {
  if (!userId) {
    return failure(
      'create_external_doctor',
      'Sign in to add an external doctor to the referral registry.',
      { clarify: true },
    );
  }

  const name = typeof params.name === 'string' ? params.name.trim() : '';
  const street = typeof params.street === 'string' ? params.street.trim() : '';
  const city = typeof params.city === 'string' ? params.city.trim() : '';
  const province =
    typeof params.province === 'string' ? params.province.trim() : '';
  const country =
    typeof params.country === 'string' ? params.country.trim() : '';
  const postalCode =
    typeof params.postalCode === 'string' ? params.postalCode.trim() : '';

  const missing: string[] = [];
  if (!name) missing.push('name');
  if (!street) missing.push('street');
  if (!city) missing.push('city');
  if (!province) missing.push('province');
  if (!country) missing.push('country');
  if (!postalCode) missing.push('postalCode');
  if (missing.length) {
    return failure(
      'create_external_doctor',
      'Provide the doctor\'s name and full address (street, city, province, country, postalCode) to add them to the registry.',
      { clarify: true, missing },
    );
  }

  try {
    const doctor = await deps.externalDoctorsService.createExternalDoctor(
      businessId,
      userId,
      {
        name,
        clinicName:
          typeof params.clinicName === 'string' ? params.clinicName : undefined,
        specialty:
          typeof params.specialty === 'string' ? params.specialty : undefined,
        address: {
          street,
          unit: typeof params.unit === 'string' ? params.unit : undefined,
          city,
          province,
          country,
          postalCode,
        },
        fax: typeof params.fax === 'string' ? params.fax : undefined,
        phone: typeof params.phone === 'string' ? params.phone : undefined,
        email: typeof params.email === 'string' ? params.email : undefined,
      },
    );
    return success(
      'create_external_doctor',
      `Added external doctor "${doctor.name}" to the referral registry.`,
      { doctor },
    );
  } catch (err: any) {
    return failure(
      'create_external_doctor',
      err?.message ?? 'Could not add the external doctor.',
    );
  }
}

export async function handleUpdateExternalDoctorLogic(
  deps: ExternalDoctorsLogicDeps,
  businessId: string,
  userId: string | undefined,
  params: Record<string, any>,
): Promise<CommandResult> {
  if (!userId) {
    return failure(
      'update_external_doctor',
      'Sign in to update an external doctor in the referral registry.',
      { clarify: true },
    );
  }

  const resolved = await resolveExternalDoctorId(
    deps,
    businessId,
    userId,
    params,
  );
  if ('error' in resolved) return resolved.error;

  const patch: Record<string, unknown> = {};
  if (typeof params.name === 'string') patch.name = params.name.trim();
  if (typeof params.clinicName === 'string') patch.clinicName = params.clinicName;
  if (typeof params.specialty === 'string') patch.specialty = params.specialty;
  if (typeof params.fax === 'string') patch.fax = params.fax;
  if (typeof params.phone === 'string') patch.phone = params.phone;
  if (typeof params.email === 'string') patch.email = params.email;
  if (typeof params.isActive === 'boolean') patch.isActive = params.isActive;
  if (
    params.street ||
    params.city ||
    params.province ||
    params.country ||
    params.postalCode
  ) {
    patch.address = {
      street: typeof params.street === 'string' ? params.street : '',
      unit: typeof params.unit === 'string' ? params.unit : undefined,
      city: typeof params.city === 'string' ? params.city : '',
      province: typeof params.province === 'string' ? params.province : '',
      country: typeof params.country === 'string' ? params.country : '',
      postalCode:
        typeof params.postalCode === 'string' ? params.postalCode : '',
    };
  }

  if (Object.keys(patch).length === 0) {
    return failure(
      'update_external_doctor',
      'What should I update for this external doctor? Provide name, clinicName, specialty, fax, phone, email, isActive, or address fields.',
      { clarify: true },
    );
  }

  try {
    const doctor = await deps.externalDoctorsService.updateExternalDoctor(
      businessId,
      userId,
      resolved.id,
      patch as any,
    );
    return success(
      'update_external_doctor',
      `Updated external doctor "${doctor.name}".`,
      { doctor },
    );
  } catch (err: any) {
    return failure(
      'update_external_doctor',
      err?.message ?? 'Could not update the external doctor.',
    );
  }
}

export async function handleListExternalDoctorsLogic(
  deps: ExternalDoctorsLogicDeps,
  businessId: string,
  userId: string | undefined,
  params: Record<string, any>,
): Promise<CommandResult> {
  if (!userId) {
    return failure(
      'list_external_doctors',
      'Sign in to view the external doctors registry.',
      { clarify: true },
    );
  }

  try {
    const result = await deps.externalDoctorsService.listExternalDoctors(
      businessId,
      userId,
      {
        q: typeof params.q === 'string' ? params.q : undefined,
        activeOnly:
          typeof params.activeOnly === 'boolean' ? params.activeOnly : undefined,
        page: typeof params.page === 'number' ? params.page : undefined,
        pageSize:
          typeof params.pageSize === 'number' ? params.pageSize : undefined,
      },
    );
    return success(
      'list_external_doctors',
      `${result.totalItems} external doctor(s) in the referral registry.`,
      { ...result },
    );
  } catch (err: any) {
    return failure(
      'list_external_doctors',
      err?.message ?? 'Could not list external doctors.',
    );
  }
}
