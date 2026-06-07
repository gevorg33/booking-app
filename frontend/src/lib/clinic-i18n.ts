import type { MessageTree } from '@/i18n/types';
import en from '@/i18n/messages/en';
import hy from '@/i18n/messages/hy';
import ru from '@/i18n/messages/ru';

export type ClinicLocaleCatalog = 'en' | 'hy' | 'ru';

const CATALOGS: Record<ClinicLocaleCatalog, MessageTree> = { en, hy, ru };

export function flattenMessageTree(tree: MessageTree, prefix = ''): string[] {
  const out: string[] = [];
  for (const [key, value] of Object.entries(tree)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      out.push(...flattenMessageTree(value as MessageTree, path));
    } else {
      out.push(path);
    }
  }
  return out;
}

export function listClinicI18nKeys(locale: ClinicLocaleCatalog = 'en'): string[] {
  const clinic = CATALOGS[locale].clinic as MessageTree;
  return flattenMessageTree(clinic, 'clinic').sort();
}

/** All `clinic.labState.*` keys (badges, gate, tab copy) from the EN catalog. */
export function listClinicLabStateI18nKeys(): string[] {
  const labState = (en.clinic as MessageTree).labState as MessageTree;
  return flattenMessageTree(labState, 'clinic.labState').sort();
}

/** All `clinicTestCatalog.*` keys (Services → Lab catalog tab) from the EN catalog. */
export function listClinicTestCatalogI18nKeys(): string[] {
  return flattenMessageTree(en.clinicTestCatalog as MessageTree, 'clinicTestCatalog').sort();
}

const CLINIC_CATALOG_ADMIN_EXTRA_KEYS = [
  'clinic.admin.enableClinic',
  'clinic.admin.serviceType',
  'clinic.admin.requiresFasting',
  'clinic.admin.preparationNotes',
  'clinic.serviceType.consultation',
  'clinic.serviceType.lab_test',
  'clinic.serviceType.procedure',
  'clinic.fastingRequired',
] as const;

/** Lab catalog tab plus service-form fasting/prep labels. */
export function listClinicCatalogAdminI18nKeys(): string[] {
  return [...new Set([...listClinicTestCatalogI18nKeys(), ...CLINIC_CATALOG_ADMIN_EXTRA_KEYS])].sort();
}

export function clinicTestCatalogLocaleParityReport(): {
  enCount: number;
  missingByLocale: Record<Exclude<ClinicLocaleCatalog, 'en'>, string[]>;
  extraByLocale: Record<Exclude<ClinicLocaleCatalog, 'en'>, string[]>;
} {
  const enKeys = new Set(listClinicTestCatalogI18nKeys());
  const hyKeys = flattenMessageTree(hy.clinicTestCatalog as MessageTree, 'clinicTestCatalog');
  const ruKeys = flattenMessageTree(ru.clinicTestCatalog as MessageTree, 'clinicTestCatalog');
  return {
    enCount: enKeys.size,
    missingByLocale: {
      hy: [...enKeys].filter((key) => !hyKeys.includes(key)),
      ru: [...enKeys].filter((key) => !ruKeys.includes(key)),
    },
    extraByLocale: {
      hy: hyKeys.filter((key) => !enKeys.has(key)),
      ru: ruKeys.filter((key) => !enKeys.has(key)),
    },
  };
}

/** Booking detail Orders tab, lab queue page, and related push/staff-book copy. */
export function listClinicLabOrdersQueueDashboardI18nKeys(): string[] {
  const clinic = en.clinic as MessageTree;
  const labState = clinic.labState as MessageTree;
  const ordersTab = flattenMessageTree(
    labState.ordersTab as MessageTree,
    'clinic.labState.ordersTab',
  );
  const labQueue = flattenMessageTree(clinic.labQueue as MessageTree, 'clinic.labQueue');
  const labBookingRequest = flattenMessageTree(
    clinic.labBookingRequest as MessageTree,
    'clinic.labBookingRequest',
  );
  return [
    ...new Set([...ordersTab, ...labQueue, ...labBookingRequest, 'nav.labQueue']),
  ].sort();
}

/** Specimen collection/tracking views, label print, and status badges. */
export function listClinicLabSpecimensPanelI18nKeys(): string[] {
  return flattenMessageTree(
    (en.clinic as MessageTree).labSpecimens as MessageTree,
    'clinic.labSpecimens',
  ).sort();
}

/** Barcode print sheet — specimen label modal and print actions. */
export function listClinicSpecimenLabelI18nKeys(): string[] {
  return flattenMessageTree(
    ((en.clinic as MessageTree).labSpecimens as MessageTree).label as MessageTree,
    'clinic.labSpecimens.label',
  ).sort();
}

export function clinicSpecimenLabelLocaleParityReport(): {
  enCount: number;
  missingByLocale: Record<Exclude<ClinicLocaleCatalog, 'en'>, string[]>;
  extraByLocale: Record<Exclude<ClinicLocaleCatalog, 'en'>, string[]>;
} {
  const enKeys = new Set(listClinicSpecimenLabelI18nKeys());
  const hyKeys = flattenMessageTree(
    ((hy.clinic as MessageTree).labSpecimens as MessageTree).label as MessageTree,
    'clinic.labSpecimens.label',
  );
  const ruKeys = flattenMessageTree(
    ((ru.clinic as MessageTree).labSpecimens as MessageTree).label as MessageTree,
    'clinic.labSpecimens.label',
  );
  return {
    enCount: enKeys.size,
    missingByLocale: {
      hy: [...enKeys].filter((key) => !hyKeys.includes(key)),
      ru: [...enKeys].filter((key) => !ruKeys.includes(key)),
    },
    extraByLocale: {
      hy: hyKeys.filter((key) => !enKeys.has(key)),
      ru: ruKeys.filter((key) => !enKeys.has(key)),
    },
  };
}

const CLINIC_LAB_SPECIMENS_SHARED_KEYS = [
  'nav.labSpecimens',
  'clinic.labQueue.filters.department',
  'clinic.labQueue.filters.allDepartments',
  'clinic.labQueue.filters.from',
  'clinic.labQueue.filters.to',
  'clinic.labQueue.openBooking',
  'clinic.labState.ordersTab.unnamedOrder',
] as const;

export function listClinicLabSpecimensDashboardI18nKeys(): string[] {
  const specimenStatuses = flattenMessageTree(
    ((en.clinic as MessageTree).labState as MessageTree).specimen as MessageTree,
    'clinic.labState.specimen',
  );
  return [
    ...new Set([
      ...listClinicLabSpecimensPanelI18nKeys(),
      ...specimenStatuses,
      ...CLINIC_LAB_SPECIMENS_SHARED_KEYS,
    ]),
  ].sort();
}

export function clinicLabSpecimensLocaleParityReport(): {
  enCount: number;
  missingByLocale: Record<Exclude<ClinicLocaleCatalog, 'en'>, string[]>;
  extraByLocale: Record<Exclude<ClinicLocaleCatalog, 'en'>, string[]>;
} {
  const enKeys = new Set(listClinicLabSpecimensPanelI18nKeys());
  const hyKeys = flattenMessageTree(
    (hy.clinic as MessageTree).labSpecimens as MessageTree,
    'clinic.labSpecimens',
  );
  const ruKeys = flattenMessageTree(
    (ru.clinic as MessageTree).labSpecimens as MessageTree,
    'clinic.labSpecimens',
  );
  return {
    enCount: enKeys.size,
    missingByLocale: {
      hy: [...enKeys].filter((key) => !hyKeys.includes(key)),
      ru: [...enKeys].filter((key) => !ruKeys.includes(key)),
    },
    extraByLocale: {
      hy: hyKeys.filter((key) => !enKeys.has(key)),
      ru: ruKeys.filter((key) => !enKeys.has(key)),
    },
  };
}

/** Dashboard booking Results tab, workflow actions, and change-history labels. */
export function listClinicLabResultsPanelI18nKeys(): string[] {
  return flattenMessageTree(
    (en.clinic as MessageTree).labResults as MessageTree,
    'clinic.labResults',
  ).sort();
}

export function listPublicMyResultsI18nKeys(): string[] {
  return flattenMessageTree(
    (en.public as MessageTree).myResults as MessageTree,
    'public.myResults',
  ).sort();
}

const CLINIC_LAB_RESULTS_SHARED_KEYS = [
  'clinic.labState.resultsTab.title',
  'clinic.labState.resultsTab.tabLabel',
  'clinic.labState.resultsTab.empty',
  'clinic.labState.resultsTab.order',
  'clinic.labState.resultsTab.result',
  'clinic.labState.resultsTab.specimen',
  'clinic.labState.resultsTab.measurement',
  'clinic.labState.resultsTab.unnamedResult',
] as const;

export function listClinicLabResultsDashboardI18nKeys(): string[] {
  const labState = (en.clinic as MessageTree).labState as MessageTree;
  const resultStatuses = flattenMessageTree(
    labState.result as MessageTree,
    'clinic.labState.result',
  );
  const orderStatuses = flattenMessageTree(
    labState.order as MessageTree,
    'clinic.labState.order',
  );
  const specimenStatuses = flattenMessageTree(
    labState.specimen as MessageTree,
    'clinic.labState.specimen',
  );
  const measurementFlags = flattenMessageTree(
    labState.measurement as MessageTree,
    'clinic.labState.measurement',
  );
  return [
    ...new Set([
      ...listClinicLabResultsPanelI18nKeys(),
      ...CLINIC_LAB_RESULTS_SHARED_KEYS,
      ...resultStatuses,
      ...orderStatuses,
      ...specimenStatuses,
      ...measurementFlags,
    ]),
  ].sort();
}

export function clinicLabResultsLocaleParityReport(): {
  enCount: number;
  missingByLocale: Record<Exclude<ClinicLocaleCatalog, 'en'>, string[]>;
  extraByLocale: Record<Exclude<ClinicLocaleCatalog, 'en'>, string[]>;
} {
  const enKeys = new Set(listClinicLabResultsPanelI18nKeys());
  const hyKeys = flattenMessageTree(
    (hy.clinic as MessageTree).labResults as MessageTree,
    'clinic.labResults',
  );
  const ruKeys = flattenMessageTree(
    (ru.clinic as MessageTree).labResults as MessageTree,
    'clinic.labResults',
  );
  return {
    enCount: enKeys.size,
    missingByLocale: {
      hy: [...enKeys].filter((key) => !hyKeys.includes(key)),
      ru: [...enKeys].filter((key) => !ruKeys.includes(key)),
    },
    extraByLocale: {
      hy: hyKeys.filter((key) => !enKeys.has(key)),
      ru: ruKeys.filter((key) => !enKeys.has(key)),
    },
  };
}

export function publicMyResultsLocaleParityReport(): {
  enCount: number;
  missingByLocale: Record<Exclude<ClinicLocaleCatalog, 'en'>, string[]>;
  extraByLocale: Record<Exclude<ClinicLocaleCatalog, 'en'>, string[]>;
} {
  const enKeys = new Set(listPublicMyResultsI18nKeys());
  const hyKeys = flattenMessageTree(
    (hy.public as MessageTree).myResults as MessageTree,
    'public.myResults',
  );
  const ruKeys = flattenMessageTree(
    (ru.public as MessageTree).myResults as MessageTree,
    'public.myResults',
  );
  return {
    enCount: enKeys.size,
    missingByLocale: {
      hy: [...enKeys].filter((key) => !hyKeys.includes(key)),
      ru: [...enKeys].filter((key) => !ruKeys.includes(key)),
    },
    extraByLocale: {
      hy: hyKeys.filter((key) => !enKeys.has(key)),
      ru: ruKeys.filter((key) => !enKeys.has(key)),
    },
  };
}

export function clinicLabOrdersQueueLocaleParityReport(): {
  enCount: number;
  missingByLocale: Record<Exclude<ClinicLocaleCatalog, 'en'>, string[]>;
  extraByLocale: Record<Exclude<ClinicLocaleCatalog, 'en'>, string[]>;
} {
  const enKeys = new Set(listClinicLabOrdersQueueDashboardI18nKeys());
  const hyKeys = new Set([
    ...flattenMessageTree(
      (hy.clinic as MessageTree).labState as MessageTree,
      'clinic.labState',
    ).filter((key) => key.startsWith('clinic.labState.ordersTab.')),
    ...flattenMessageTree((hy.clinic as MessageTree).labQueue as MessageTree, 'clinic.labQueue'),
    ...flattenMessageTree(
      (hy.clinic as MessageTree).labBookingRequest as MessageTree,
      'clinic.labBookingRequest',
    ),
    'nav.labQueue',
  ]);
  const ruKeys = new Set([
    ...flattenMessageTree(
      (ru.clinic as MessageTree).labState as MessageTree,
      'clinic.labState',
    ).filter((key) => key.startsWith('clinic.labState.ordersTab.')),
    ...flattenMessageTree((ru.clinic as MessageTree).labQueue as MessageTree, 'clinic.labQueue'),
    ...flattenMessageTree(
      (ru.clinic as MessageTree).labBookingRequest as MessageTree,
      'clinic.labBookingRequest',
    ),
    'nav.labQueue',
  ]);
  return {
    enCount: enKeys.size,
    missingByLocale: {
      hy: [...enKeys].filter((key) => !hyKeys.has(key)),
      ru: [...enKeys].filter((key) => !ruKeys.has(key)),
    },
    extraByLocale: {
      hy: [...hyKeys].filter((key) => !enKeys.has(key)),
      ru: [...ruKeys].filter((key) => !enKeys.has(key)),
    },
  };
}

/** Dashboard patient chart — demographics, clinical profile, encounters, staff notes, documents. */
export function listClinicPatientChartI18nKeys(): string[] {
  return flattenMessageTree(
    (en.clinic as MessageTree).patientChart as MessageTree,
    'clinic.patientChart',
  ).sort();
}

/** Services → Referring doctors registry (external doctors). */
export function listExternalDoctorsI18nKeys(): string[] {
  return flattenMessageTree(en.externalDoctors as MessageTree, 'externalDoctors').sort();
}

/** LIS admin — lab registry, machines, and specimen assignments. */
export function listClinicLisRegistryI18nKeys(): string[] {
  return flattenMessageTree(
    (en.clinicLis as MessageTree).registry as MessageTree,
    'clinicLis.registry',
  ).sort();
}

/** LIS admin — sync observation requests, inbound queue, and status badges. */
export function listClinicLisSyncI18nKeys(): string[] {
  return flattenMessageTree(
    (en.clinicLis as MessageTree).sync as MessageTree,
    'clinicLis.sync',
  ).sort();
}

/** Tenant-facing worker / API error toasts for LIS inbound processing. */
export function listClinicLisWorkerErrorI18nKeys(): string[] {
  return flattenMessageTree(
    (en.clinicLis as MessageTree).workerErrors as MessageTree,
    'clinicLis.workerErrors',
  ).sort();
}

/** LIS integration admin tab — registry, sync status, and worker toasts. */
export function listClinicLisAdminI18nKeys(): string[] {
  return flattenMessageTree(en.clinicLis as MessageTree, 'clinicLis').sort();
}

export function clinicLisLocaleParityReport(): {
  enCount: number;
  missingByLocale: Record<Exclude<ClinicLocaleCatalog, 'en'>, string[]>;
  extraByLocale: Record<Exclude<ClinicLocaleCatalog, 'en'>, string[]>;
} {
  const enKeys = new Set(listClinicLisAdminI18nKeys());
  const hyKeys = flattenMessageTree(hy.clinicLis as MessageTree, 'clinicLis');
  const ruKeys = flattenMessageTree(ru.clinicLis as MessageTree, 'clinicLis');
  return {
    enCount: enKeys.size,
    missingByLocale: {
      hy: [...enKeys].filter((key) => !hyKeys.includes(key)),
      ru: [...enKeys].filter((key) => !ruKeys.includes(key)),
    },
    extraByLocale: {
      hy: hyKeys.filter((key) => !enKeys.has(key)),
      ru: ruKeys.filter((key) => !enKeys.has(key)),
    },
  };
}

/** Services → Billing codes tab (diagnostic & procedure catalog admin). */
export function listClinicDiagnosticCodesI18nKeys(): string[] {
  return flattenMessageTree(
    en.clinicDiagnosticCodes as MessageTree,
    'clinicDiagnosticCodes',
  ).sort();
}

/** Patient chart / booking detail after-visit summary authoring and export. */
export function listClinicAfterVisitSummaryI18nKeys(): string[] {
  return flattenMessageTree(
    (en.clinic as MessageTree).afterVisitSummary as MessageTree,
    'clinic.afterVisitSummary',
  ).sort();
}

/** Billing codes catalog admin plus after-visit summary dashboard copy. */
export function listClinicBillingCodesDashboardI18nKeys(): string[] {
  return [
    ...new Set([
      ...listClinicDiagnosticCodesI18nKeys(),
      ...listClinicAfterVisitSummaryI18nKeys(),
    ]),
  ].sort();
}

export function clinicDiagnosticCodesLocaleParityReport(): {
  enCount: number;
  missingByLocale: Record<Exclude<ClinicLocaleCatalog, 'en'>, string[]>;
  extraByLocale: Record<Exclude<ClinicLocaleCatalog, 'en'>, string[]>;
} {
  const enKeys = new Set(listClinicDiagnosticCodesI18nKeys());
  const hyKeys = flattenMessageTree(
    hy.clinicDiagnosticCodes as MessageTree,
    'clinicDiagnosticCodes',
  );
  const ruKeys = flattenMessageTree(
    ru.clinicDiagnosticCodes as MessageTree,
    'clinicDiagnosticCodes',
  );
  return {
    enCount: enKeys.size,
    missingByLocale: {
      hy: [...enKeys].filter((key) => !hyKeys.includes(key)),
      ru: [...enKeys].filter((key) => !ruKeys.includes(key)),
    },
    extraByLocale: {
      hy: hyKeys.filter((key) => !enKeys.has(key)),
      ru: ruKeys.filter((key) => !enKeys.has(key)),
    },
  };
}

export function clinicAfterVisitSummaryLocaleParityReport(): {
  enCount: number;
  missingByLocale: Record<Exclude<ClinicLocaleCatalog, 'en'>, string[]>;
  extraByLocale: Record<Exclude<ClinicLocaleCatalog, 'en'>, string[]>;
} {
  const enKeys = new Set(listClinicAfterVisitSummaryI18nKeys());
  const hyKeys = flattenMessageTree(
    (hy.clinic as MessageTree).afterVisitSummary as MessageTree,
    'clinic.afterVisitSummary',
  );
  const ruKeys = flattenMessageTree(
    (ru.clinic as MessageTree).afterVisitSummary as MessageTree,
    'clinic.afterVisitSummary',
  );
  return {
    enCount: enKeys.size,
    missingByLocale: {
      hy: [...enKeys].filter((key) => !hyKeys.includes(key)),
      ru: [...enKeys].filter((key) => !ruKeys.includes(key)),
    },
    extraByLocale: {
      hy: hyKeys.filter((key) => !enKeys.has(key)),
      ru: ruKeys.filter((key) => !enKeys.has(key)),
    },
  };
}

export function listClinicPatientChartDashboardI18nKeys(): string[] {
  return [...new Set([...listClinicPatientChartI18nKeys()])].sort();
}

export function clinicPatientChartLocaleParityReport(): {
  enCount: number;
  missingByLocale: Record<Exclude<ClinicLocaleCatalog, 'en'>, string[]>;
  extraByLocale: Record<Exclude<ClinicLocaleCatalog, 'en'>, string[]>;
} {
  const enKeys = new Set(listClinicPatientChartI18nKeys());
  const hyKeys = flattenMessageTree(
    (hy.clinic as MessageTree).patientChart as MessageTree,
    'clinic.patientChart',
  );
  const ruKeys = flattenMessageTree(
    (ru.clinic as MessageTree).patientChart as MessageTree,
    'clinic.patientChart',
  );
  return {
    enCount: enKeys.size,
    missingByLocale: {
      hy: [...enKeys].filter((key) => !hyKeys.includes(key)),
      ru: [...enKeys].filter((key) => !ruKeys.includes(key)),
    },
    extraByLocale: {
      hy: hyKeys.filter((key) => !enKeys.has(key)),
      ru: ruKeys.filter((key) => !enKeys.has(key)),
    },
  };
}

export function externalDoctorsLocaleParityReport(): {
  enCount: number;
  missingByLocale: Record<Exclude<ClinicLocaleCatalog, 'en'>, string[]>;
  extraByLocale: Record<Exclude<ClinicLocaleCatalog, 'en'>, string[]>;
} {
  const enKeys = new Set(listExternalDoctorsI18nKeys());
  const hyKeys = flattenMessageTree(hy.externalDoctors as MessageTree, 'externalDoctors');
  const ruKeys = flattenMessageTree(ru.externalDoctors as MessageTree, 'externalDoctors');
  return {
    enCount: enKeys.size,
    missingByLocale: {
      hy: [...enKeys].filter((key) => !hyKeys.includes(key)),
      ru: [...enKeys].filter((key) => !ruKeys.includes(key)),
    },
    extraByLocale: {
      hy: hyKeys.filter((key) => !enKeys.has(key)),
      ru: ruKeys.filter((key) => !enKeys.has(key)),
    },
  };
}

/** Dashboard intake engine — patient chart, booking detail, questionnaire admin. */
export function listClinicIntakeFormI18nKeys(): string[] {
  return flattenMessageTree(
    (en.clinic as MessageTree).intakeForm as MessageTree,
    'clinic.intakeForm',
  ).sort();
}

/** Public booking optional pre-visit step before checkout. */
export function listClinicPublicIntakeI18nKeys(): string[] {
  return flattenMessageTree(
    (en.clinic as MessageTree).publicIntake as MessageTree,
    'clinic.publicIntake',
  ).sort();
}

/** Services → Questionnaires tab (questionnaire engine admin). */
export function listClinicQuestionnairesI18nKeys(): string[] {
  return flattenMessageTree(
    en.clinicQuestionnaires as MessageTree,
    'clinicQuestionnaires',
  ).sort();
}

const CLINIC_PRE_VISIT_INTAKE_ALERT_KEYS = [
  'clinic.patientAlerts.titles.IntakeIncomplete',
  'clinic.patientAlerts.bodies.IntakeIncomplete',
] as const;

export function listClinicPreVisitIntakeDashboardI18nKeys(): string[] {
  return [
    ...new Set([
      ...listClinicIntakeFormI18nKeys(),
      ...listClinicPublicIntakeI18nKeys(),
      ...CLINIC_PRE_VISIT_INTAKE_ALERT_KEYS,
    ]),
  ].sort();
}

export function clinicIntakeFormLocaleParityReport(): {
  enCount: number;
  missingByLocale: Record<Exclude<ClinicLocaleCatalog, 'en'>, string[]>;
  extraByLocale: Record<Exclude<ClinicLocaleCatalog, 'en'>, string[]>;
} {
  const enKeys = new Set(listClinicIntakeFormI18nKeys());
  const hyKeys = flattenMessageTree(
    (hy.clinic as MessageTree).intakeForm as MessageTree,
    'clinic.intakeForm',
  );
  const ruKeys = flattenMessageTree(
    (ru.clinic as MessageTree).intakeForm as MessageTree,
    'clinic.intakeForm',
  );
  return {
    enCount: enKeys.size,
    missingByLocale: {
      hy: [...enKeys].filter((key) => !hyKeys.includes(key)),
      ru: [...enKeys].filter((key) => !ruKeys.includes(key)),
    },
    extraByLocale: {
      hy: hyKeys.filter((key) => !enKeys.has(key)),
      ru: ruKeys.filter((key) => !enKeys.has(key)),
    },
  };
}

export function clinicPublicIntakeLocaleParityReport(): {
  enCount: number;
  missingByLocale: Record<Exclude<ClinicLocaleCatalog, 'en'>, string[]>;
  extraByLocale: Record<Exclude<ClinicLocaleCatalog, 'en'>, string[]>;
} {
  const enKeys = new Set(listClinicPublicIntakeI18nKeys());
  const hyKeys = flattenMessageTree(
    (hy.clinic as MessageTree).publicIntake as MessageTree,
    'clinic.publicIntake',
  );
  const ruKeys = flattenMessageTree(
    (ru.clinic as MessageTree).publicIntake as MessageTree,
    'clinic.publicIntake',
  );
  return {
    enCount: enKeys.size,
    missingByLocale: {
      hy: [...enKeys].filter((key) => !hyKeys.includes(key)),
      ru: [...enKeys].filter((key) => !ruKeys.includes(key)),
    },
    extraByLocale: {
      hy: hyKeys.filter((key) => !enKeys.has(key)),
      ru: ruKeys.filter((key) => !enKeys.has(key)),
    },
  };
}

export function clinicQuestionnairesLocaleParityReport(): {
  enCount: number;
  missingByLocale: Record<Exclude<ClinicLocaleCatalog, 'en'>, string[]>;
  extraByLocale: Record<Exclude<ClinicLocaleCatalog, 'en'>, string[]>;
} {
  const enKeys = new Set(listClinicQuestionnairesI18nKeys());
  const hyKeys = flattenMessageTree(
    hy.clinicQuestionnaires as MessageTree,
    'clinicQuestionnaires',
  );
  const ruKeys = flattenMessageTree(
    ru.clinicQuestionnaires as MessageTree,
    'clinicQuestionnaires',
  );
  return {
    enCount: enKeys.size,
    missingByLocale: {
      hy: [...enKeys].filter((key) => !hyKeys.includes(key)),
      ru: [...enKeys].filter((key) => !ruKeys.includes(key)),
    },
    extraByLocale: {
      hy: hyKeys.filter((key) => !enKeys.has(key)),
      ru: ruKeys.filter((key) => !enKeys.has(key)),
    },
  };
}

export function clinicLocaleParityReport(): {
  enCount: number;
  missingByLocale: Record<Exclude<ClinicLocaleCatalog, 'en'>, string[]>;
  extraByLocale: Record<Exclude<ClinicLocaleCatalog, 'en'>, string[]>;
} {
  const enKeys = new Set(listClinicI18nKeys('en'));
  const missingByLocale = {
    hy: [...enKeys].filter((key) => !listClinicI18nKeys('hy').includes(key)),
    ru: [...enKeys].filter((key) => !listClinicI18nKeys('ru').includes(key)),
  };
  const extraByLocale = {
    hy: listClinicI18nKeys('hy').filter((key) => !enKeys.has(key)),
    ru: listClinicI18nKeys('ru').filter((key) => !enKeys.has(key)),
  };
  return { enCount: enKeys.size, missingByLocale, extraByLocale };
}
