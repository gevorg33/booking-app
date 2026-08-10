import type { Repository } from 'typeorm';
import type { Customer } from '../customer/entities/customer.entity.js';
import type { CommandResult } from './command-completion.types.js';
import type { PatientClinicalProfilesService } from '../patient-clinical-profiles/patient-clinical-profiles.service.js';
import type { PatientClinicalProfileAccessService } from '../patient-clinical-profiles/shared/patient-clinical-profile-access.service.js';
import type { PatientDocumentsService } from '../patient-clinical-profiles/patient-documents.service.js';
import type { PatientEncountersService } from '../patient-clinical-profiles/patient-encounters.service.js';
import type { PatientStaffNotesService } from '../patient-clinical-profiles/patient-staff-notes.service.js';
import type { PatientStaffNoteAccessService } from '../patient-clinical-profiles/shared/patient-staff-note-access.service.js';
import type { PatientClinicalAlertsService } from '../patient-clinical-profiles/patient-clinical-alerts.service.js';
import {
  isClinicPatientAlertType,
  resolvePatientClinicalCustomer,
} from './ai-patient-clinical-mutations.util.js';

export interface PatientClinicalMutationsLogicDeps {
  customerRepo: Pick<Repository<Customer>, 'find' | 'findOne'>;
  profilesService: Pick<
    PatientClinicalProfilesService,
    'upsertProfileForCustomer'
  >;
  profileAccessService: Pick<
    PatientClinicalProfileAccessService,
    'assertCustomerClinicalProfileAccess'
  >;
  documentsService: Pick<
    PatientDocumentsService,
    'updateDocumentReleaseForCustomer'
  >;
  encountersService: Pick<
    PatientEncountersService,
    'appendAddendum' | 'upsertEncounterForBooking' | 'listEncountersForCustomer'
  >;
  staffNotesService: Pick<
    PatientStaffNotesService,
    'listNotesForCustomer' | 'createNoteForCustomer'
  >;
  staffNoteAccessService: Pick<
    PatientStaffNoteAccessService,
    'assertCustomerStaffNoteAccess'
  >;
  alertsService: Pick<PatientClinicalAlertsService, 'dismissAlert'>;
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

function clarify(
  action: string,
  summary: string,
  missing: string[],
): CommandResult {
  return {
    success: false,
    action,
    summary,
    details: { clarify: true, missing },
  };
}

async function resolveCustomerOrClarify(
  deps: Pick<PatientClinicalMutationsLogicDeps, 'customerRepo'>,
  businessId: string,
  params: Record<string, unknown>,
  action: string,
): Promise<Customer | CommandResult> {
  const customer = await resolvePatientClinicalCustomer(
    deps,
    businessId,
    params,
  );
  if (!customer) {
    return clarify(
      action,
      'Which patient is this for? Provide customerName or customerId.',
      ['customerName', 'customerId'],
    );
  }
  return customer;
}

function isCommandResult(value: unknown): value is CommandResult {
  return (
    typeof value === 'object' &&
    value !== null &&
    'success' in value &&
    'action' in value
  );
}

export async function handleUpdateClinicalProfileLogic(
  deps: PatientClinicalMutationsLogicDeps,
  businessId: string,
  userId: string,
  params: Record<string, any>,
): Promise<CommandResult> {
  const action = 'update_clinical_profile';
  const resolved = await resolveCustomerOrClarify(
    deps,
    businessId,
    params,
    action,
  );
  if (isCommandResult(resolved)) return resolved;
  const customer = resolved;

  const allergies =
    typeof params.allergies === 'string' ? params.allergies : undefined;
  const chronicProblems =
    typeof params.chronicProblems === 'string'
      ? params.chronicProblems
      : undefined;
  const emergencyContactName =
    typeof params.emergencyContactName === 'string'
      ? params.emergencyContactName
      : undefined;
  const emergencyContactPhone =
    typeof params.emergencyContactPhone === 'string'
      ? params.emergencyContactPhone
      : undefined;
  const emergencyContactRelationship =
    typeof params.emergencyContactRelationship === 'string'
      ? params.emergencyContactRelationship
      : undefined;
  const bloodType =
    typeof params.bloodType === 'string' ? params.bloodType : undefined;
  const referringExternalDoctorId =
    typeof params.referringExternalDoctorId === 'string'
      ? params.referringExternalDoctorId
      : undefined;

  if (
    allergies === undefined &&
    chronicProblems === undefined &&
    emergencyContactName === undefined &&
    emergencyContactPhone === undefined &&
    emergencyContactRelationship === undefined &&
    bloodType === undefined &&
    referringExternalDoctorId === undefined
  ) {
    return failure(
      action,
      `What should I update on ${customer.name}'s clinical profile? Provide allergies, chronic problems, emergency contact, blood type, or referring doctor.`,
    );
  }

  const access =
    await deps.profileAccessService.assertCustomerClinicalProfileAccess(
      businessId,
      userId,
      customer.id,
    );
  const updated = await deps.profilesService.upsertProfileForCustomer(
    businessId,
    customer.id,
    access,
    {
      ...(allergies !== undefined ? { allergies } : {}),
      ...(chronicProblems !== undefined ? { chronicProblems } : {}),
      ...(emergencyContactName !== undefined ? { emergencyContactName } : {}),
      ...(emergencyContactPhone !== undefined ? { emergencyContactPhone } : {}),
      ...(emergencyContactRelationship !== undefined
        ? { emergencyContactRelationship }
        : {}),
      ...(bloodType !== undefined ? { bloodType } : {}),
      ...(referringExternalDoctorId !== undefined
        ? { referringExternalDoctorId }
        : {}),
    },
  );

  return success(action, `Updated ${customer.name}'s clinical profile.`, {
    customerId: customer.id,
    profile: updated,
  });
}

export async function handleDismissPatientAlertLogic(
  deps: PatientClinicalMutationsLogicDeps,
  businessId: string,
  userId: string,
  params: Record<string, any>,
): Promise<CommandResult> {
  const action = 'dismiss_patient_alert';
  const resolved = await resolveCustomerOrClarify(
    deps,
    businessId,
    params,
    action,
  );
  if (isCommandResult(resolved)) return resolved;
  const customer = resolved;

  const alertType = params.alertType;
  const sourceId =
    typeof params.sourceId === 'string' && params.sourceId.trim()
      ? params.sourceId.trim()
      : undefined;

  if (!isClinicPatientAlertType(alertType) || !sourceId) {
    return clarify(
      action,
      'Which alert should I dismiss? Provide the alert type and sourceId.',
      ['alertType', 'sourceId'],
    );
  }

  await deps.alertsService.dismissAlert(
    businessId,
    customer.id,
    userId,
    alertType,
    sourceId,
  );

  return success(
    action,
    `Dismissed the ${alertType} alert for ${customer.name}.`,
    {
      customerId: customer.id,
      alertType,
      sourceId,
    },
  );
}

export async function handleReleasePatientDocumentLogic(
  deps: PatientClinicalMutationsLogicDeps,
  businessId: string,
  userId: string,
  params: Record<string, any>,
): Promise<CommandResult> {
  const action = 'release_patient_document';
  const resolved = await resolveCustomerOrClarify(
    deps,
    businessId,
    params,
    action,
  );
  if (isCommandResult(resolved)) return resolved;
  const customer = resolved;

  const documentId =
    typeof params.documentId === 'string' && params.documentId.trim()
      ? params.documentId.trim()
      : undefined;
  if (!documentId) {
    return clarify(action, 'Which document should I release?', ['documentId']);
  }
  const releasedToPatient =
    typeof params.releasedToPatient === 'boolean'
      ? params.releasedToPatient
      : true;

  const access =
    await deps.profileAccessService.assertCustomerClinicalProfileAccess(
      businessId,
      userId,
      customer.id,
    );
  const document = await deps.documentsService.updateDocumentReleaseForCustomer(
    businessId,
    customer.id,
    documentId,
    access,
    releasedToPatient,
  );

  return success(
    action,
    releasedToPatient
      ? `Released "${document.title ?? 'the document'}" to ${customer.name}.`
      : `Revoked patient access to "${document.title ?? 'the document'}".`,
    { customerId: customer.id, document },
  );
}

export async function handleCreateEncounterAddendumLogic(
  deps: PatientClinicalMutationsLogicDeps,
  businessId: string,
  userId: string,
  params: Record<string, any>,
): Promise<CommandResult> {
  const action = 'create_encounter_addendum';
  const resolved = await resolveCustomerOrClarify(
    deps,
    businessId,
    params,
    action,
  );
  if (isCommandResult(resolved)) return resolved;
  const customer = resolved;

  const body =
    typeof params.body === 'string' && params.body.trim()
      ? params.body.trim()
      : undefined;
  if (!body) {
    return clarify(action, 'What should the addendum say?', ['body']);
  }

  const access =
    await deps.profileAccessService.assertCustomerClinicalProfileAccess(
      businessId,
      userId,
      customer.id,
    );

  let encounterId =
    typeof params.encounterId === 'string' && params.encounterId.trim()
      ? params.encounterId.trim()
      : undefined;

  if (!encounterId) {
    const bookingId =
      typeof params.bookingId === 'string' && params.bookingId.trim()
        ? params.bookingId.trim()
        : undefined;
    if (!bookingId) {
      return clarify(
        action,
        'Which encounter is this addendum for? Provide encounterId or bookingId.',
        ['encounterId', 'bookingId'],
      );
    }
    const encounters = await deps.encountersService.listEncountersForCustomer(
      businessId,
      customer.id,
      access,
    );
    const match = encounters.find((entry) => entry.bookingId === bookingId);
    if (!match?.encounterId) {
      return failure(
        action,
        `No visit note was found for that booking yet — add one before appending an addendum.`,
      );
    }
    encounterId = match.encounterId;
  }

  const detail = await deps.encountersService.appendAddendum(
    businessId,
    customer.id,
    encounterId,
    access,
    { body },
  );

  return success(action, `Added an addendum to ${customer.name}'s encounter.`, {
    customerId: customer.id,
    encounter: detail,
  });
}

export async function handleUpdateEncounterByBookingLogic(
  deps: PatientClinicalMutationsLogicDeps,
  businessId: string,
  userId: string,
  params: Record<string, any>,
): Promise<CommandResult> {
  const action = 'update_encounter_by_booking';
  const resolved = await resolveCustomerOrClarify(
    deps,
    businessId,
    params,
    action,
  );
  if (isCommandResult(resolved)) return resolved;
  const customer = resolved;

  const bookingId =
    typeof params.bookingId === 'string' && params.bookingId.trim()
      ? params.bookingId.trim()
      : undefined;
  const visitNote =
    typeof params.visitNote === 'string' && params.visitNote.trim()
      ? params.visitNote.trim()
      : undefined;

  if (!bookingId || !visitNote) {
    return clarify(
      action,
      'Which booking is this visit note for, and what should it say?',
      ['bookingId', 'visitNote'],
    );
  }

  const access =
    await deps.profileAccessService.assertCustomerClinicalProfileAccess(
      businessId,
      userId,
      customer.id,
    );
  const detail = await deps.encountersService.upsertEncounterForBooking(
    businessId,
    customer.id,
    bookingId,
    access,
    { visitNote },
  );

  return success(action, `Saved the visit note for ${customer.name}.`, {
    customerId: customer.id,
    encounter: detail,
  });
}

export async function handleListCustomerStaffNotesLogic(
  deps: PatientClinicalMutationsLogicDeps,
  businessId: string,
  userId: string,
  params: Record<string, any>,
): Promise<CommandResult> {
  const action = 'list_customer_staff_notes';
  const resolved = await resolveCustomerOrClarify(
    deps,
    businessId,
    params,
    action,
  );
  if (isCommandResult(resolved)) return resolved;
  const customer = resolved;

  const access =
    await deps.staffNoteAccessService.assertCustomerStaffNoteAccess(
      businessId,
      userId,
      customer.id,
    );
  const list = await deps.staffNotesService.listNotesForCustomer(
    businessId,
    customer.id,
    access,
  );

  return success(
    action,
    list.notes.length
      ? `${customer.name} has ${list.notes.length} internal staff note${list.notes.length === 1 ? '' : 's'}.`
      : `${customer.name} has no internal staff notes yet.`,
    { customerId: customer.id, notes: list.notes, canCreate: list.canCreate },
  );
}

export async function handleAddCustomerStaffNoteLogic(
  deps: PatientClinicalMutationsLogicDeps,
  businessId: string,
  userId: string,
  params: Record<string, any>,
): Promise<CommandResult> {
  const action = 'add_customer_staff_note';
  const resolved = await resolveCustomerOrClarify(
    deps,
    businessId,
    params,
    action,
  );
  if (isCommandResult(resolved)) return resolved;
  const customer = resolved;

  const body =
    typeof params.body === 'string' && params.body.trim()
      ? params.body.trim()
      : undefined;
  if (!body) {
    return clarify(action, 'What should the staff note say?', ['body']);
  }
  const bookingId =
    typeof params.bookingId === 'string' && params.bookingId.trim()
      ? params.bookingId.trim()
      : undefined;

  const access =
    await deps.staffNoteAccessService.assertCustomerStaffNoteAccess(
      businessId,
      userId,
      customer.id,
    );
  const note = await deps.staffNotesService.createNoteForCustomer(
    businessId,
    customer.id,
    access,
    { body, ...(bookingId ? { bookingId } : {}) },
  );

  return success(action, `Added an internal staff note for ${customer.name}.`, {
    customerId: customer.id,
    note,
  });
}
