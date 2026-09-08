/** Dashboard classifier rules for clinic catalog onboarding (ai-cmd-clinic-1–4). */
export const CLINIC_SERVICE_CLASSIFIER_RULES = `- configure_clinic_service: MUTATE — set clinic metadata on one catalog service (serviceType=consultation|lab_test|procedure, requiresFasting, preparationNotes). Triggers: mark/set/configure + service name + lab test|consultation|procedure; fasting / no fasting; prep instructions. Updates service.metadata clinic fields — NOT create_service (new catalog row), NOT create_test_order (lab order for a patient visit), NOT update_service_prices (bulk %), and NOT explain_clinic_services (read list).
- explain_clinic_services: READ — summarize clinic catalog: departments (categories), consultation vs lab_test vs procedure counts, which lab tests require fasting. Triggers: explain/show/list + clinic services|catalog|departments|fasting. Optional serviceName filter. NOT configure_clinic_service (mutate metadata), NOT explain_clinic_booking (consumer checkout fields), NOT list_services (general salon catalog), and NOT create_test_order.
- apply_clinic_playbook: MUTATE — shortcut for clinic|polyclinic|beauty_clinic|dental tenants to seed the clinic vertical playbook (departments + lab/consultation/procedure catalog + clinic operating hours schedule template). Triggers: apply/set up/seed/load + clinic playbook|clinic vertical|polyclinic starter. Requires clinic vertical businessType and at least one employee. NOT bulk_create_catalog (ad-hoc category), NOT apply_schedule (named template for one provider), and NOT configure_clinic_service (single service metadata).
- Examples:
  - "Mark CBC as a lab test requiring fasting" → configure_clinic_service, serviceName=CBC, serviceType=lab_test, requiresFasting=true
  - "Set lipid panel prep instructions to fast 12 hours" → configure_clinic_service, serviceName=lipid panel, preparationNotes=fast 12 hours
  - "Explain our clinic services and department counts" → explain_clinic_services
  - "Which lab tests require fasting?" → explain_clinic_services
  - "Apply clinic playbook" → apply_clinic_playbook
  - "Set up polyclinic starter catalog and schedule" → apply_clinic_playbook`;

export const APPLY_CLINIC_PLAYBOOK_PROMPTS = [
  { id: 'apply-clinic-playbook', prompt: 'Apply clinic playbook' },
  {
    id: 'setup-clinic-starter',
    prompt: 'Set up clinic starter catalog and schedule',
  },
  {
    id: 'load-clinic-vertical',
    prompt: 'Load the clinic vertical playbook for our business',
  },
  {
    id: 'seed-clinic-catalog-schedule',
    prompt: 'Seed clinic catalog and clinic operating hours schedule',
  },
  {
    id: 'run-clinic-playbook',
    prompt: 'Run the clinic playbook to add sample services and hours',
  },
  {
    id: 'install-clinic-starter',
    prompt: 'Install clinic starter services and schedule template',
  },
  {
    id: 'use-clinic-vertical-playbook',
    prompt: 'Use the clinic vertical playbook for onboarding',
  },
  {
    id: 'apply-clinic-catalog-hours',
    prompt: 'Apply clinic playbook with catalog and clinic operating hours',
  },
  {
    id: 'setup-clinic-business',
    prompt: 'Set up our clinic with the default clinic playbook',
  },
  {
    id: 'seed-polyclinic-playbook',
    prompt: 'Seed the polyclinic playbook — catalog plus schedule',
  },
  {
    id: 'load-starter-clinic',
    prompt: 'Load starter clinic services and weekly operating schedule',
  },
  {
    id: 'apply-vertical-clinic-playbook',
    prompt: 'Apply vertical clinic playbook for polyclinic',
  },
] as const;

export const EXPLAIN_CLINIC_SERVICES_PROMPTS = [
  {
    id: 'explain-clinic-overview',
    prompt: 'Explain our clinic services and department counts',
  },
  {
    id: 'lab-vs-consultation-counts',
    prompt: 'How many lab tests vs consultations do we have?',
  },
  {
    id: 'fasting-requirements',
    prompt: 'Which services require fasting?',
  },
  {
    id: 'catalog-breakdown',
    prompt: 'Show clinic catalog breakdown by service type',
  },
  {
    id: 'list-departments',
    prompt: 'List departments and service counts',
  },
  {
    id: 'lab-fasting-prep',
    prompt: 'What lab tests require fasting prep?',
  },
  {
    id: 'consultation-procedure-counts',
    prompt: 'Summarize consultation vs procedure counts',
  },
  {
    id: 'service-types-overview',
    prompt: 'Explain clinic service types in our catalog',
  },
  {
    id: 'department-most-services',
    prompt: 'Which department has the most services?',
  },
  {
    id: 'fasting-across-labs',
    prompt: 'Show fasting requirements across lab tests',
  },
  {
    id: 'cbc-settings',
    prompt: 'Explain clinic settings for CBC',
    serviceName: 'CBC',
  },
] as const;

/** Declared so the array is one type, not a union of twelve literal shapes. */
export type ConfigureClinicServicePromptFixture = {
  id: string;
  prompt: string;
  serviceName: string;
  serviceType?: 'consultation' | 'lab_test' | 'procedure';
  requiresFasting?: boolean;
  preparationNotes?: string;
};

export const CONFIGURE_CLINIC_SERVICE_PROMPTS: readonly ConfigureClinicServicePromptFixture[] = [
  {
    id: 'mark-cbc-lab-fasting',
    prompt: 'Mark CBC as a lab test requiring fasting',
    serviceName: 'CBC',
    serviceType: 'lab_test' as const,
    requiresFasting: true,
  },
  {
    id: 'lipid-panel-prep',
    prompt: 'Set lipid panel prep instructions to fast 12 hours',
    serviceName: 'lipid panel',
    preparationNotes: 'fast 12 hours',
  },
  {
    id: 'gp-consultation',
    prompt: 'Mark GP Consultation as a consultation service',
    serviceName: 'GP Consultation',
    serviceType: 'consultation' as const,
  },
  {
    id: 'ecg-procedure',
    prompt: 'Set ECG as a procedure',
    serviceName: 'ECG',
    serviceType: 'procedure' as const,
  },
  {
    id: 'cbc-no-fasting',
    prompt: 'Remove fasting requirement for CBC',
    serviceName: 'CBC',
    requiresFasting: false,
  },
  {
    id: 'lipid-prep-update',
    prompt:
      'Update preparation notes for Lipid Panel to no food 8 hours before',
    serviceName: 'Lipid Panel',
    preparationNotes: 'no food 8 hours before',
  },
  {
    id: 'cbc-lab-config',
    prompt: 'Configure Complete Blood Count as lab test with fasting',
    serviceName: 'Complete Blood Count',
    serviceType: 'lab_test' as const,
    requiresFasting: true,
  },
  {
    id: 'thyroid-lab-no-fast',
    prompt: 'Make thyroid panel a lab test without fasting',
    serviceName: 'thyroid panel',
    serviceType: 'lab_test' as const,
    requiresFasting: false,
  },
  {
    id: 'dermatology-consultation',
    prompt: 'Set dermatology visit as consultation',
    serviceName: 'dermatology visit',
    serviceType: 'consultation' as const,
  },
  {
    id: 'glucose-lab-fasting',
    prompt: 'Mark blood glucose test as lab test requiring fasting',
    serviceName: 'blood glucose test',
    serviceType: 'lab_test' as const,
    requiresFasting: true,
  },
  {
    id: 'configure-lipid-lab',
    prompt: 'Configure Lipid Panel as a lab test',
    serviceName: 'Lipid Panel',
    serviceType: 'lab_test' as const,
  },
  {
    id: 'prep-cbc-instructions',
    prompt: 'Set CBC prep instructions to water only for 8 hours',
    serviceName: 'CBC',
    preparationNotes: 'water only for 8 hours',
  },
] as const;
