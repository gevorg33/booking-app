export const EXTERNAL_DOCTORS_MUTATE_INTENTS = [
  'create_external_doctor',
  'update_external_doctor',
] as const;

export const EXTERNAL_DOCTORS_READ_INTENTS = ['list_external_doctors'] as const;

export const EXTERNAL_DOCTORS_INTENTS = [
  ...EXTERNAL_DOCTORS_MUTATE_INTENTS,
  ...EXTERNAL_DOCTORS_READ_INTENTS,
] as const;

export type ExternalDoctorsIntent = (typeof EXTERNAL_DOCTORS_INTENTS)[number];
