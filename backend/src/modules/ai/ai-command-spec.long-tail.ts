/**
 * AI-ROADMAP Phase 1 - the long tail: eleven small modules ported together.
 *
 * 47 registry entries across `provider-exp-3`, `onboarding`,
 * `patient-clinical-profiles`, `provider-client-context`, `agent-ops`,
 * `clinic-questionnaires`, `provider-push-setup`, `clinic-pre-visit-intake`,
 * `locations`, `business-profile` and `provider-earnings`. 17 reads, 30
 * mutations.
 *
 * Two things checked before writing, both changing what got declared:
 *
 * - `send_client_message` looked like a write filed as a read. It is not: the
 *   handler builds an `openLink` for the provider to tap and sends nothing.
 *   `mutating: false` is correct, and it is specced T0.
 * - `undo_latest_agent_task` is the registry's only undo-shaped command. It has
 *   **never appeared in the trace corpus** - which is consistent with the
 *   Phase 9 note that `undo-within-1-min` could not be implemented for lack of
 *   any undo signal to mine.
 *
 * The clinical commands are T2 on PHI grounds, and two of them are `none` for a
 * reason specific to medicine rather than to money: a clinical record is
 * append-only, and a released document has reached the patient.
 */
import type { CommandSpec } from './ai-command-spec.types.js';

export const LONG_TAIL_COMMAND_SPECS: readonly CommandSpec[] = [
  {
    id: 'provider.explain_client_intake',
    aliases: ['explain_client_intake'],
    domain: 'provider',
    surfaces: ['provider'],
    tiers: { provider: ['client', 'staff', 'manager', 'owner'] },
    risk: 'T0',
    description: 'Explain what a client submitted on their intake form.',
    variables: {},
    examples: [
      'what did this client put on their intake',
      'show me their intake answers',
    ],
    confirm: 'never',
    handler: 'AiProviderClientContextService',
  },
  {
    id: 'provider.list_client_staff_notes',
    aliases: ['list_client_staff_notes'],
    domain: 'provider',
    surfaces: ['provider'],
    tiers: { provider: ['client', 'staff', 'manager', 'owner'] },
    risk: 'T0',
    description: 'List internal staff notes recorded against a client.',
    variables: {},
    examples: ['what notes are on this client', 'show staff notes for Gevorg'],
    confirm: 'never',
    handler: 'AiProviderClientContextService',
  },
  {
    id: 'provider.show_client_history',
    aliases: ['show_client_history'],
    domain: 'provider',
    surfaces: ['provider'],
    tiers: { provider: ['client', 'staff', 'manager', 'owner'] },
    risk: 'T0',
    description: 'Show a client visit history with this provider.',
    variables: {},
    examples: ['what has this client had before', 'show me their history'],
    confirm: 'never',
    handler: 'AiProviderClientContextService',
  },
  {
    id: 'provider.summarize_client',
    aliases: ['summarize_client'],
    domain: 'provider',
    surfaces: ['provider'],
    tiers: { provider: ['client', 'staff', 'manager', 'owner'] },
    risk: 'T0',
    description:
      'Summarise what a provider should know about a client before their visit.',
    variables: {},
    examples: ['brief me on my next client', 'summarise this customer'],
    confirm: 'never',
    handler: 'AiProviderClientContextService',
  },
  {
    id: 'provider.explain_message_templates',
    aliases: ['explain_message_templates'],
    domain: 'provider',
    surfaces: ['provider'],
    tiers: { provider: ['client', 'staff', 'manager', 'owner'] },
    risk: 'T0',
    description:
      'List the canned client message templates that are configured.',
    variables: {},
    examples: ['what message templates do we have', 'list my canned messages'],
    confirm: 'never',
    handler: 'AiProviderExp3Service',
  },
  {
    id: 'provider.send_client_message',
    aliases: ['send_client_message'],
    domain: 'provider',
    surfaces: ['provider'],
    tiers: { provider: ['client', 'staff', 'manager', 'owner'] },
    risk: 'T0',
    description:
      'Build a pre-filled SMS or WhatsApp link to message a client. Does not send: it returns a link for the provider to open.',
    variables: {},
    examples: [
      'message this client that I am running late',
      'send a reminder to my 3pm',
    ],
    confirm: 'never',
    handler: 'AiProviderExp3Service',
  },
  {
    id: 'provider.summarize_my_appointments',
    aliases: ['summarize_my_appointments'],
    domain: 'provider',
    surfaces: ['provider'],
    tiers: { provider: ['client', 'staff', 'manager', 'owner'] },
    risk: 'T0',
    description:
      'Summarise the appointments belonging to the requesting provider.',
    variables: {},
    examples: ['what is my day like', 'summarise my appointments'],
    confirm: 'never',
    handler: 'AiProviderEarningsService',
  },
  {
    id: 'provider.summarize_my_revenue',
    aliases: ['summarize_my_revenue'],
    domain: 'provider',
    surfaces: ['provider'],
    tiers: { provider: ['client', 'staff', 'manager', 'owner'] },
    risk: 'T0',
    description: 'Report the revenue earned by the requesting provider.',
    variables: {},
    examples: ['how much have I earned', 'my revenue this month'],
    confirm: 'never',
    handler: 'AiProviderEarningsService',
  },
  {
    id: 'provider.explain_push_setup',
    aliases: ['explain_push_setup'],
    domain: 'provider',
    surfaces: ['provider'],
    tiers: { provider: ['client', 'staff', 'manager', 'owner'] },
    risk: 'T0',
    description: 'Explain how to turn on push notifications.',
    variables: {},
    examples: ['how do I get notifications', 'explain push setup'],
    confirm: 'never',
    handler: 'AiProviderPushSetupService',
  },
  {
    id: 'provider.explain_push_registration_status',
    aliases: ['explain_push_registration_status'],
    domain: 'provider',
    surfaces: ['provider', 'customer'],
    tiers: {
      provider: ['client', 'staff', 'manager', 'owner'],
      customer: ['client'],
    },
    risk: 'T0',
    description:
      'Report whether push notifications are registered on this device.',
    variables: {},
    examples: ['are my notifications on', 'push registration status'],
    confirm: 'never',
    handler: 'AiProviderPushSetupService',
  },
  {
    id: 'onboarding.explain_status',
    aliases: ['explain_onboarding_status'],
    domain: 'business',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['staff', 'manager', 'owner'] },
    risk: 'T0',
    description: 'Report how far business setup has progressed.',
    variables: {},
    examples: ['how far along is setup', 'what is left to onboard'],
    confirm: 'never',
    handler: 'AiOnboardingService',
  },
  {
    id: 'onboarding.recommend_catalog',
    aliases: ['recommend_catalog'],
    domain: 'business',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['staff', 'manager', 'owner'] },
    risk: 'T0',
    description: 'Suggest a starting catalogue for the business type.',
    variables: {},
    examples: [
      'what services should I offer',
      'recommend a catalogue for a salon',
    ],
    confirm: 'never',
    handler: 'AiOnboardingService',
  },
  {
    id: 'clinical.explain_patient_chart',
    aliases: ['explain_patient_chart'],
    domain: 'clinic',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['staff', 'manager', 'owner'] },
    risk: 'T0',
    description: 'Explain what is recorded on a patient chart.',
    variables: {},
    examples: ['what is on this patient chart', 'explain the chart for Gevorg'],
    confirm: 'never',
    handler: 'AiClinicPatientChartService',
  },
  {
    id: 'clinical.list_customer_staff_notes',
    aliases: ['list_customer_staff_notes'],
    domain: 'clinic',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['staff', 'manager', 'owner'] },
    risk: 'T0',
    description: 'List internal staff notes recorded against a customer.',
    variables: {},
    examples: ['what notes are on this customer', 'list staff notes'],
    confirm: 'never',
    handler: 'AiPatientClinicalMutationsService',
  },
  {
    id: 'agent.list_tasks',
    aliases: ['list_agent_tasks'],
    domain: 'operations',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['manager', 'owner'] },
    risk: 'T0',
    description: 'List the automated agent tasks and their status.',
    variables: {},
    examples: ['what has the agent been doing', 'list agent tasks'],
    confirm: 'never',
    handler: 'AiAgentOpsService',
  },
  {
    id: 'business.dashboard_overview',
    aliases: ['get_dashboard_overview'],
    domain: 'business',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['manager', 'owner'] },
    risk: 'T0',
    description: 'Summarise the current state of the business.',
    variables: {},
    examples: ['how are we doing', 'give me the dashboard overview'],
    confirm: 'never',
    handler: 'AiBusinessProfileService',
  },
  {
    id: 'provider.add_client_note',
    aliases: ['add_client_note'],
    domain: 'provider',
    surfaces: ['provider'],
    tiers: { provider: ['client', 'staff', 'manager', 'owner'] },
    risk: 'T1',
    description: 'Record an internal note against a client.',
    variables: {},
    examples: [
      'note that this client prefers mornings',
      'add a note to their file',
    ],
    confirm: 'if-ambiguous',
    // First declared as its own inverse, which is nonsense: adding a note does
    // not undo adding a note. Checked the registry per e2e-bug.375 — there is no
    // delete-note command at all, for either note type.
    compensation: {
      kind: 'manual',
      reason:
        'No delete-note command exists in the registry; a note must be removed by hand.',
    },
    handler: 'AiProviderClientContextService',
  },
  {
    id: 'provider.add_retail_to_booking',
    aliases: ['add_retail_to_booking'],
    domain: 'provider',
    surfaces: ['provider'],
    tiers: { provider: ['client', 'staff', 'manager', 'owner'] },
    risk: 'T2',
    description:
      'Add a retail product to a booking, changing what the client pays.',
    variables: {
      // Three layers: `extractRetailProductName` (`productName` |
      // `serviceName`), then `resolveProviderBooking`, then
      // `handleAddRetailSaleToBookingLogic` for the quantity.
      //
      // The booking is *not* a parameter — `resolveProviderBooking` finds the
      // provider's own active booking from `sessionEmployeeId`, which is
      // session-injected. That is why this command is safe without a
      // `bookingId` and why one is not declared.
      productName: {
        type: 'string',
        description:
          'Product to add. Falls back to a product named in the message; the handler reports `missing: [productName]` when neither resolves.',
        required: false,
        resolver: 'none',
      },
      quantity: {
        type: 'number',
        description:
          'How many. Defaults to 1, and is floored at 1 — this cannot be used to subtract.',
        required: false,
        resolver: 'none',
      },
    },
    examples: [
      'add a shampoo to this booking',
      'sell them the conditioner too',
    ],
    confirm: 'always',
    compensation: {
      kind: 'inverse',
      command: 'provider.remove_retail_from_booking',
      captures: ['bookingId', 'previousRetailLines'],
    },
    handler: 'AiProviderExp3Service',
  },
  {
    id: 'provider.remove_retail_from_booking',
    aliases: ['remove_retail_from_booking'],
    domain: 'provider',
    surfaces: ['provider'],
    tiers: { provider: ['client', 'staff', 'manager', 'owner'] },
    risk: 'T2',
    description: 'Remove a retail product from a booking.',
    variables: {
      // Mirror of the add twin, minus the quantity: removal takes the whole
      // line rather than a count. Booking resolution is session-based here
      // too, so no `bookingId`.
      productName: {
        type: 'string',
        description:
          'Product to take off the booking. Falls back to a product named in the message.',
        required: false,
        resolver: 'none',
      },
    },
    examples: ['take the shampoo off this booking', 'remove that product'],
    confirm: 'always',
    compensation: {
      kind: 'inverse',
      command: 'provider.add_retail_to_booking',
      captures: ['bookingId', 'previousRetailLines'],
    },
    handler: 'AiProviderExp3Service',
  },
  {
    id: 'provider.block_my_time',
    aliases: ['block_my_time'],
    domain: 'provider',
    surfaces: ['provider'],
    tiers: { provider: ['client', 'staff', 'manager', 'owner'] },
    risk: 'T1',
    description: 'Block out time in the provider own calendar.',
    variables: {},
    examples: ['block me out from 2 to 4', 'I am unavailable this afternoon'],
    confirm: 'if-ambiguous',
    // Converted from `manual` in §66. §60 declared this `manual` with the target
    // named — `delete_schedule_block` was in the registry but not yet specced,
    // so conformance would have rejected an inverse pointing at it. The
    // `ai-command` slice specced it, and naming the target rather than writing
    // a vague "no inverse exists" is what made this a lookup instead of a
    // rediscovery.
    compensation: {
      kind: 'inverse',
      command: 'operations.delete_schedule_block',
      captures: ['blockId'],
    },
    handler: 'AiProviderExp3Service',
  },
  {
    id: 'provider.extend_my_block',
    aliases: ['extend_my_block'],
    domain: 'provider',
    surfaces: ['provider'],
    tiers: { provider: ['client', 'staff', 'manager', 'owner'] },
    risk: 'T1',
    description: 'Extend a block the provider already placed.',
    variables: {},
    examples: ['extend my block by an hour', 'make that block longer'],
    confirm: 'if-ambiguous',
    compensation: {
      kind: 'inverse',
      command: 'provider.extend_my_block',
      captures: ['blockId', 'previousEnd'],
    },
    handler: 'AiProviderExp3Service',
  },
  {
    id: 'provider.notify_client_ready',
    aliases: ['notify_client_ready'],
    domain: 'provider',
    surfaces: ['provider'],
    tiers: { provider: ['client', 'staff', 'manager', 'owner'] },
    risk: 'T1',
    description: 'Tell a client their provider is ready for them.',
    variables: {},
    examples: ['let my next client know I am ready', 'tell them to come in'],
    confirm: 'if-ambiguous',
    compensation: {
      kind: 'none',
      reason: 'The message has been sent to the client; it cannot be unsent.',
    },
    handler: 'AiProviderExp3Service',
  },
  {
    id: 'provider.request_time_off',
    aliases: ['request_time_off'],
    domain: 'provider',
    surfaces: ['provider'],
    tiers: { provider: ['client', 'staff', 'manager', 'owner'] },
    risk: 'T1',
    description: 'Request time off for approval.',
    variables: {},
    examples: ['I need next friday off', 'request leave for the 20th'],
    confirm: 'always',
    compensation: {
      kind: 'manual',
      reason:
        'The request has entered the approval queue; withdrawing it is a separate action.',
    },
    handler: 'AiProviderExp3Service',
  },
  {
    id: 'provider.enable_push_notifications',
    aliases: ['enable_push_notifications'],
    domain: 'provider',
    surfaces: ['provider', 'customer'],
    tiers: {
      provider: ['client', 'staff', 'manager', 'owner'],
      customer: ['client'],
    },
    risk: 'T1',
    description: 'Turn on push notifications for this device.',
    variables: {},
    examples: ['turn on notifications', 'enable push alerts'],
    confirm: 'never',
    compensation: {
      kind: 'inverse',
      command: 'provider.enable_push_notifications',
      captures: ['previousEnabled'],
    },
    handler: 'AiProviderPushSetupService',
  },
  {
    id: 'onboarding.apply_catalog',
    aliases: ['apply_onboarding_catalog'],
    domain: 'business',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['manager', 'owner'] },
    risk: 'T3',
    description:
      'Create a whole starting catalogue from an onboarding template.',
    variables: {
      // tech-debt C2 — `handleApplyOnboardingCatalogLogic` reads exactly one
      // param. Absent, it calls `recommendCatalog(businessId)` and applies
      // whatever that returns, which is the normal path: "set up my catalog"
      // carries no list.
      categories: {
        type: 'object[]',
        description:
          'Categories and their services to create. Omit to apply the catalog the system recommends for this business.',
        required: false,
        resolver: 'none',
      },
    },
    examples: [
      'set up my catalogue from the template',
      'apply the salon catalogue',
    ],
    confirm: 'always',
    compensation: {
      kind: 'manual',
      reason:
        'Creates many categories and services at once; unwinding needs the created ids.',
    },
    handler: 'AiOnboardingService',
  },
  {
    id: 'onboarding.apply_playbook',
    aliases: ['apply_onboarding_playbook'],
    domain: 'business',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['manager', 'owner'] },
    risk: 'T3',
    description: 'Apply a whole onboarding playbook to the business.',
    variables: {},
    examples: ['set us up as a barbershop', 'apply the clinic playbook'],
    confirm: 'always',
    compensation: {
      kind: 'manual',
      reason:
        'Applies many settings at once across several areas; unwinding needs per-setting pre-state.',
    },
    handler: 'AiOnboardingService',
  },
  {
    id: 'onboarding.apply_schedule',
    aliases: ['apply_onboarding_schedule'],
    domain: 'business',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['manager', 'owner'] },
    risk: 'T3',
    description: 'Create opening hours and provider schedules from a template.',
    variables: {},
    examples: ['set up our opening hours', 'apply the standard schedule'],
    confirm: 'always',
    compensation: {
      kind: 'manual',
      reason:
        'Creates schedules for multiple providers; unwinding needs per-provider pre-state.',
    },
    handler: 'AiOnboardingService',
  },
  {
    id: 'onboarding.complete',
    aliases: ['complete_onboarding'],
    domain: 'business',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['manager', 'owner'] },
    risk: 'T1',
    description: 'Mark business setup as finished.',
    variables: {},
    examples: ['we are done setting up', 'finish onboarding'],
    confirm: 'if-ambiguous',
    compensation: {
      kind: 'inverse',
      command: 'onboarding.complete',
      captures: ['previousStatus'],
    },
    handler: 'AiOnboardingService',
  },
  {
    id: 'onboarding.skip_schedule',
    aliases: ['skip_onboarding_schedule'],
    domain: 'business',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['manager', 'owner'] },
    risk: 'T1',
    description: 'Skip the schedule step of onboarding.',
    variables: {},
    examples: ['skip the schedule setup', 'I will do hours later'],
    confirm: 'never',
    compensation: {
      kind: 'inverse',
      command: 'onboarding.skip_schedule',
      captures: ['previousStatus'],
    },
    handler: 'AiOnboardingService',
  },
  {
    id: 'onboarding.set_business_type',
    aliases: ['set_business_type'],
    domain: 'business',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['manager', 'owner'] },
    risk: 'T1',
    description:
      'Set what kind of business this is, which drives the defaults offered.',
    variables: {},
    examples: ['we are a barbershop', 'set our business type to clinic'],
    confirm: 'if-ambiguous',
    compensation: {
      kind: 'inverse',
      command: 'onboarding.set_business_type',
      captures: ['previousType'],
    },
    handler: 'AiOnboardingService',
  },
  {
    id: 'clinical.add_customer_staff_note',
    aliases: ['add_customer_staff_note'],
    domain: 'clinic',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['staff', 'manager', 'owner'] },
    risk: 'T2',
    description: 'Record an internal staff note against a customer record.',
    variables: {
      // `handleAddCustomerStaffNoteLogic`. The note text is free-form and is
      // stored verbatim, so a note attached to the wrong patient is a
      // disclosure, not a typo — hence both identifiers.
      customerName: {
        type: 'string',
        description: 'Patient the note is filed against.',
        required: false,
        resolver: 'customer',
      },
      customerId: {
        type: 'string',
        description:
          'Exact patient. Takes precedence over the name, which is a substring match.',
        required: false,
        resolver: 'customer',
      },
      body: {
        type: 'string',
        description:
          'Text of the note. Without it the command asks rather than filing an empty note.',
        required: false,
        resolver: 'none',
      },
      bookingId: {
        type: 'string',
        description: 'Attach the note to a particular visit.',
        required: false,
        resolver: 'appointment',
      },
    },
    examples: [
      'note that this patient is allergic to latex',
      'add a staff note',
    ],
    confirm: 'always',
    // Same error and same finding as `provider.add_client_note`. Caught by §58's
    // capture rule, which fires on a T2 inverse that captures no prior state —
    // here because there was no prior state to capture and the inverse was wrong.
    compensation: {
      kind: 'manual',
      reason:
        'No delete-note command exists in the registry; a staff note must be removed by hand.',
    },
    handler: 'AiPatientClinicalMutationsService',
  },
  {
    id: 'clinical.create_encounter_addendum',
    aliases: ['create_encounter_addendum'],
    domain: 'clinic',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['staff', 'manager', 'owner'] },
    risk: 'T2',
    description: 'Add an addendum to a clinical encounter record.',
    variables: {
      // `handleCreateEncounterAddendumLogic`. An addendum is append-only —
      // the encounter it lands on cannot be corrected by editing, only by
      // adding another addendum — so both the patient and the encounter have
      // to be named precisely.
      customerName: {
        type: 'string',
        description: 'Patient whose encounter is being amended.',
        required: false,
        resolver: 'customer',
      },
      customerId: {
        type: 'string',
        description:
          'Exact patient. Takes precedence over the name, which is a substring match.',
        required: false,
        resolver: 'customer',
      },
      encounterId: {
        type: 'string',
        description: 'Encounter to amend.',
        required: false,
        resolver: 'none',
      },
      bookingId: {
        type: 'string',
        description:
          'Identify the encounter by its visit instead of by encounter id.',
        required: false,
        resolver: 'appointment',
      },
      body: {
        type: 'string',
        description:
          'Text of the addendum. Without it the command asks rather than filing an empty one.',
        required: false,
        resolver: 'none',
      },
    },
    examples: ['add an addendum to that encounter', 'append to the visit note'],
    confirm: 'always',
    compensation: {
      kind: 'none',
      reason:
        'A clinical record is append-only by design; an addendum is part of the medical record once written.',
    },
    handler: 'AiPatientClinicalMutationsService',
  },
  {
    id: 'clinical.release_patient_document',
    aliases: ['release_patient_document'],
    domain: 'clinic',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['staff', 'manager', 'owner'] },
    risk: 'T2',
    description: 'Release a clinical document to the patient.',
    variables: {
      // `handleReleasePatientDocumentLogic`. This is the disclosure step —
      // it makes a clinical document visible to the patient — so `documentId`
      // decides what is disclosed and the patient fields decide to whom.
      customerName: {
        type: 'string',
        description: 'Patient the document belongs to.',
        required: false,
        resolver: 'customer',
      },
      customerId: {
        type: 'string',
        description:
          'Exact patient. Takes precedence over the name, which is a substring match.',
        required: false,
        resolver: 'customer',
      },
      documentId: {
        type: 'string',
        description:
          'Document to release. Without it the command asks rather than releasing anything.',
        required: false,
        resolver: 'none',
      },
      releasedToPatient: {
        type: 'boolean',
        description:
          'Whether the document becomes visible to the patient. Set false to withdraw a release.',
        required: false,
        resolver: 'none',
      },
    },
    examples: ['release the lab report to the patient', 'share these results'],
    confirm: 'always',
    compensation: {
      kind: 'none',
      reason:
        'The document has been released to the patient and cannot be recalled.',
    },
    handler: 'AiPatientClinicalMutationsService',
  },
  {
    id: 'clinical.update_clinical_profile',
    aliases: ['update_clinical_profile'],
    domain: 'clinic',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['staff', 'manager', 'owner'] },
    risk: 'T2',
    description: 'Change a patient clinical profile.',
    variables: {
      // `handleUpdateClinicalProfileLogic`. Every command in this handler
      // resolves the patient first through `resolvePatientClinicalCustomer`,
      // which prefers `customerId` and otherwise matches the name
      // exact-then-substring — see e2e-bug.443 for the cap on that search.
      // On a clinical record the id is the difference between updating a
      // patient's allergies and updating someone else's.
      customerName: {
        type: 'string',
        description: 'Patient whose profile to change.',
        required: false,
        resolver: 'customer',
      },
      customerId: {
        type: 'string',
        description:
          'Exact patient. Takes precedence over the name, which is a substring match — supply it whenever a name could match more than one patient.',
        required: false,
        resolver: 'customer',
      },
      allergies: {
        type: 'string',
        description: 'Recorded allergies. Replaces the stored value.',
        required: false,
        resolver: 'none',
      },
      chronicProblems: {
        type: 'string',
        description: 'Recorded chronic conditions. Replaces the stored value.',
        required: false,
        resolver: 'none',
      },
      bloodType: {
        type: 'string',
        description: 'Recorded blood type.',
        required: false,
        resolver: 'none',
      },
      emergencyContactName: {
        type: 'string',
        description: 'Emergency contact name.',
        required: false,
        resolver: 'none',
      },
      emergencyContactPhone: {
        type: 'string',
        description: 'Emergency contact phone number.',
        required: false,
        resolver: 'none',
      },
      emergencyContactRelationship: {
        type: 'string',
        description: 'How the emergency contact is related to the patient.',
        required: false,
        resolver: 'none',
      },
      referringExternalDoctorId: {
        type: 'string',
        description: 'External doctor who referred the patient.',
        required: false,
        resolver: 'none',
      },
    },
    examples: ['update this patient allergies', 'change their clinical notes'],
    confirm: 'always',
    compensation: {
      kind: 'inverse',
      command: 'clinical.update_clinical_profile',
      captures: ['patientId', 'previousValues'],
    },
    handler: 'AiPatientClinicalMutationsService',
  },
  {
    id: 'clinical.update_encounter_by_booking',
    aliases: ['update_encounter_by_booking'],
    domain: 'clinic',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['staff', 'manager', 'owner'] },
    risk: 'T2',
    description: 'Update the clinical encounter attached to a booking.',
    variables: {
      // `handleUpdateEncounterByBookingLogic`. It reports
      // `missing: ['bookingId', 'visitNote']` when either is absent, with no
      // prompt fallback for either — but the patient is resolved first, so a
      // prompt naming no patient fails earlier with a different message. All
      // three stay optional for the reason the whole backlog uses: the
      // handler asks rather than refusing.
      customerName: {
        type: 'string',
        description: 'Patient the visit belongs to.',
        required: false,
        resolver: 'customer',
      },
      customerId: {
        type: 'string',
        description:
          'Exact patient. Takes precedence over the name, which is a substring match.',
        required: false,
        resolver: 'customer',
      },
      bookingId: {
        type: 'string',
        description: 'Visit whose encounter is being written.',
        required: false,
        resolver: 'appointment',
      },
      visitNote: {
        type: 'string',
        description: 'Clinical note recorded against the visit.',
        required: false,
        resolver: 'none',
      },
    },
    examples: ['update the encounter for that visit', 'change the visit notes'],
    confirm: 'always',
    compensation: {
      kind: 'inverse',
      command: 'clinical.update_encounter_by_booking',
      captures: ['encounterId', 'previousValues'],
    },
    handler: 'AiPatientClinicalMutationsService',
  },
  {
    id: 'clinical.assign_pre_visit_intake',
    aliases: ['assign_pre_visit_intake_to_booking'],
    domain: 'clinic',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['staff', 'manager', 'owner'] },
    risk: 'T1',
    description: 'Attach a pre-visit intake form to a booking.',
    variables: {},
    examples: [
      'send an intake form for that booking',
      'assign the pre visit questionnaire',
    ],
    confirm: 'if-ambiguous',
    compensation: {
      kind: 'manual',
      reason:
        'The patient may already have been asked to complete it; withdrawing needs a notification.',
    },
    handler: 'AiClinicPreVisitIntakeService',
  },
  {
    id: 'clinical.staff_submit_intake_answers',
    aliases: ['staff_submit_intake_answers'],
    domain: 'clinic',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['staff', 'manager', 'owner'] },
    risk: 'T2',
    description: 'Record intake answers on a patient behalf.',
    variables: {
      // `handleStaffSubmitIntakeAnswersLogic`. Staff answering *for* a
      // patient, so the three fields together say which visit, which question
      // and what was answered — none is optional in practice even though none
      // is `required` by this backlog's criterion.
      bookingId: {
        type: 'string',
        description: 'Visit whose intake is being filled in.',
        required: false,
        resolver: 'appointment',
      },
      questionId: {
        type: 'string',
        description: 'Intake question being answered.',
        required: false,
        resolver: 'none',
      },
      values: {
        type: 'string[]',
        description: 'The answer, as one or more selected values.',
        required: false,
        resolver: 'none',
      },
    },
    examples: [
      'fill in the intake for this patient',
      'record their intake answers',
    ],
    confirm: 'always',
    compensation: {
      kind: 'inverse',
      command: 'clinical.staff_submit_intake_answers',
      captures: ['intakeId', 'previousAnswers'],
    },
    handler: 'AiClinicPreVisitIntakeService',
  },
  {
    id: 'clinical.create_questionnaire',
    aliases: ['create_questionnaire'],
    domain: 'clinic',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['manager', 'owner'] },
    risk: 'T1',
    description: 'Create a clinical questionnaire.',
    variables: {},
    examples: ['create an intake questionnaire', 'add a new patient form'],
    confirm: 'if-ambiguous',
    compensation: {
      kind: 'manual',
      reason:
        'A questionnaire may already have been published and answered; removing one needs a response check.',
    },
    handler: 'AiClinicQuestionnaireService',
  },
  {
    id: 'clinical.publish_questionnaire',
    aliases: ['publish_questionnaire'],
    domain: 'clinic',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['manager', 'owner'] },
    risk: 'T1',
    description: 'Publish a questionnaire so patients receive it.',
    variables: {},
    examples: ['publish the intake form', 'make that questionnaire live'],
    confirm: 'always',
    compensation: {
      kind: 'manual',
      reason:
        'Patients may already have received and answered it; unpublishing does not retract those.',
    },
    handler: 'AiClinicQuestionnaireService',
  },
  {
    id: 'clinical.update_questionnaire',
    aliases: ['update_questionnaire'],
    domain: 'clinic',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['manager', 'owner'] },
    risk: 'T1',
    description: 'Change a clinical questionnaire.',
    variables: {},
    examples: [
      'change a question on the intake form',
      'update the questionnaire',
    ],
    confirm: 'if-ambiguous',
    compensation: {
      kind: 'inverse',
      command: 'clinical.update_questionnaire',
      captures: ['questionnaireId', 'previousValues'],
    },
    handler: 'AiClinicQuestionnaireService',
  },
  {
    id: 'agent.approve_task',
    aliases: ['approve_agent_task'],
    domain: 'operations',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['manager', 'owner'] },
    risk: 'T2',
    description: 'Approve a queued automated agent task so it runs.',
    variables: {
      // `handleApproveAgentTaskLogic`. Approval is the gate in front of
      // whatever the queued task does, so this id selects an arbitrary amount
      // of downstream effect — the one variable is the whole blast radius.
      taskId: {
        type: 'string',
        description: 'Queued task to approve and run.',
        required: false,
        resolver: 'none',
      },
    },
    examples: ['approve that agent task', 'let the agent go ahead'],
    confirm: 'always',
    compensation: {
      kind: 'none',
      reason:
        'Approval releases the task to run; whatever it did is undone through its own commands, not this one.',
    },
    handler: 'AiAgentOpsService',
  },
  {
    id: 'agent.retry_step',
    aliases: ['retry_agent_step'],
    domain: 'operations',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['manager', 'owner'] },
    risk: 'T2',
    description: 'Retry a failed step of an automated agent task.',
    variables: {
      // `handleRetryAgentStepLogic`. Both ids matter: the task selects the run
      // and the step selects what re-executes within it.
      taskId: {
        type: 'string',
        description: 'Task the failed step belongs to.',
        required: false,
        resolver: 'none',
      },
      stepId: {
        type: 'string',
        description: 'Step to re-run.',
        required: false,
        resolver: 'none',
      },
    },
    examples: ['retry that failed step', 'try the agent step again'],
    confirm: 'always',
    compensation: {
      kind: 'none',
      reason:
        'A retry re-runs the underlying command; undoing it means undoing that command.',
    },
    handler: 'AiAgentOpsService',
  },
  {
    id: 'agent.rebook_all_from_task',
    aliases: ['rebook_all_from_agent_task'],
    domain: 'operations',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['manager', 'owner'] },
    risk: 'T3',
    description:
      'Rebook every affected customer from an agent task in one action.',
    variables: {
      // `handleRebookAllFromAgentTaskLogic` reads exactly one param.
      taskId: {
        type: 'string',
        description: 'Agent task whose cancelled bookings are being rebooked.',
        required: false,
        resolver: 'none',
      },
    },
    examples: [
      'rebook everyone from that task',
      'rebook all the affected customers',
    ],
    confirm: 'always',
    compensation: {
      kind: 'manual',
      reason:
        'Creates many bookings at once and notifies each customer; unwinding needs the created ids.',
    },
    handler: 'AiAgentOpsService',
  },
  {
    id: 'agent.undo_latest_task',
    aliases: ['undo_latest_agent_task'],
    domain: 'operations',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['manager', 'owner'] },
    risk: 'T3',
    description: 'Undo the most recent automated agent task.',
    variables: {},
    examples: ['undo what the agent just did', 'revert the last agent task'],
    confirm: 'always',
    compensation: {
      kind: 'none',
      reason:
        'This command IS the undo. There is no undo of an undo; re-running the task is a new action.',
    },
    handler: 'AiAgentOpsService',
  },
  {
    id: 'business.update_profile',
    aliases: ['update_business_profile'],
    domain: 'business',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['manager', 'owner'] },
    risk: 'T1',
    description: 'Change the business profile details.',
    variables: {},
    examples: ['change our business phone number', 'update our address'],
    confirm: 'always',
    compensation: {
      kind: 'inverse',
      command: 'business.update_profile',
      captures: ['previousValues'],
    },
    handler: 'AiBusinessProfileService',
  },
  {
    id: 'locations.create',
    aliases: ['create_location'],
    domain: 'business',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['staff', 'manager', 'owner'] },
    risk: 'T1',
    description: 'Add a location the business operates from.',
    variables: {},
    examples: ['add a second branch', 'create a location called Downtown'],
    confirm: 'if-ambiguous',
    compensation: {
      kind: 'manual',
      reason:
        'Bookings and staff may already have been assigned to the location; removing one needs a dependency check.',
    },
    handler: 'AiLocationsService',
  },
  {
    id: 'locations.update',
    aliases: ['update_location'],
    domain: 'business',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['staff', 'manager', 'owner'] },
    risk: 'T1',
    description: 'Change the details of a location.',
    variables: {},
    examples: ['rename the downtown branch', 'change the branch address'],
    confirm: 'if-ambiguous',
    compensation: {
      kind: 'inverse',
      command: 'locations.update',
      captures: ['locationId', 'previousValues'],
    },
    handler: 'AiLocationsService',
  },
] as const;
