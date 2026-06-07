import { describe, expect, it } from 'vitest';
import { getMessages, translate, type AppLocale } from '@/i18n';
import {
  clinicLabOrdersQueueLocaleParityReport,
  clinicLabResultsLocaleParityReport,
  clinicLabSpecimensLocaleParityReport,
  clinicLocaleParityReport,
  clinicTestCatalogLocaleParityReport,
  flattenMessageTree,
  listClinicCatalogAdminI18nKeys,
  listClinicI18nKeys,
  listClinicLabOrdersQueueDashboardI18nKeys,
  listClinicLabResultsDashboardI18nKeys,
  listClinicLabResultsPanelI18nKeys,
  listClinicLabSpecimensDashboardI18nKeys,
  listClinicLabSpecimensPanelI18nKeys,
  clinicIntakeFormLocaleParityReport,
  clinicPatientChartLocaleParityReport,
  clinicPublicIntakeLocaleParityReport,
  clinicQuestionnairesLocaleParityReport,
  clinicAfterVisitSummaryLocaleParityReport,
  clinicDiagnosticCodesLocaleParityReport,
  clinicLisLocaleParityReport,
  clinicSpecimenLabelLocaleParityReport,
  externalDoctorsLocaleParityReport,
  listClinicIntakeFormI18nKeys,
  listClinicLabStateI18nKeys,
  listClinicPatientChartDashboardI18nKeys,
  listClinicPatientChartI18nKeys,
  listClinicPreVisitIntakeDashboardI18nKeys,
  listClinicPublicIntakeI18nKeys,
  listClinicQuestionnairesI18nKeys,
  listClinicAfterVisitSummaryI18nKeys,
  listClinicBillingCodesDashboardI18nKeys,
  listClinicDiagnosticCodesI18nKeys,
  listClinicLisAdminI18nKeys,
  listClinicLisRegistryI18nKeys,
  listClinicLisSyncI18nKeys,
  listClinicLisWorkerErrorI18nKeys,
  listClinicSpecimenLabelI18nKeys,
  listClinicTestCatalogI18nKeys,
  listExternalDoctorsI18nKeys,
  listPublicMyResultsI18nKeys,
  publicMyResultsLocaleParityReport,
} from './clinic-i18n';

const LOCALES: AppLocale[] = ['en', 'hy', 'ru'];

describe('clinic i18n integration (i18n-clinic-v2 gate)', () => {
  it('keeps clinic.* key parity across en, hy, and ru catalogs', () => {
    const report = clinicLocaleParityReport();
    expect(report.enCount).toBeGreaterThan(200);
    expect(report.missingByLocale.hy).toEqual([]);
    expect(report.missingByLocale.ru).toEqual([]);
    expect(report.extraByLocale.hy).toEqual([]);
    expect(report.extraByLocale.ru).toEqual([]);
    expect(listClinicI18nKeys('en').length).toBe(report.enCount);
  });

  it('resolves every clinic key through merged messages in en, hy, and ru', () => {
    const keys = listClinicI18nKeys('en');
    for (const locale of LOCALES) {
      const messages = getMessages(locale);
      for (const key of keys) {
        const value = translate(messages, key);
        expect(value, `${locale}:${key}`).not.toBe(key);
        expect(value.trim().length, `${locale}:${key}`).toBeGreaterThan(0);
      }
    }
  });

  it('keeps clinicTestCatalog key parity across en, hy, and ru (i18n-clinic-v2-1)', () => {
    const report = clinicTestCatalogLocaleParityReport();
    expect(report.enCount).toBeGreaterThan(25);
    expect(report.missingByLocale.hy).toEqual([]);
    expect(report.missingByLocale.ru).toEqual([]);
    expect(report.extraByLocale.hy).toEqual([]);
    expect(report.extraByLocale.ru).toEqual([]);
    expect(listClinicTestCatalogI18nKeys().length).toBe(report.enCount);
  });

  it('resolves clinic catalog admin keys in en, hy, and ru (i18n-clinic-v2-1)', () => {
    const keys = listClinicCatalogAdminI18nKeys();
    expect(keys).toContain('clinicTestCatalog.tabLabel');
    expect(keys).toContain('clinic.admin.requiresFasting');
    expect(keys).toContain('clinic.serviceType.lab_test');

    for (const locale of LOCALES) {
      const messages = getMessages(locale);
      for (const key of keys) {
        const value = translate(messages, key);
        expect(value, `${locale}:${key}`).not.toBe(key);
        expect(value.trim().length, `${locale}:${key}`).toBeGreaterThan(0);
      }
    }
  });

  it('localizes lab catalog tab, import summaries, and fasting/prep labels in hy and ru', () => {
    const hy = getMessages('hy');
    const ru = getMessages('ru');
    expect(translate(hy, 'clinicTestCatalog.tabLabel')).toContain('Լաբորատոր');
    expect(translate(ru, 'clinicTestCatalog.seedSuccess')).toContain('playbook');
    expect(translate(hy, 'clinicTestCatalog.fastingBadge')).toBe('Ծոմ');
    expect(translate(ru, 'clinic.admin.preparationNotes')).toContain('подготовке');
    expect(
      translate(hy, 'clinicTestCatalog.importSummaryTypes', { created: 2, skipped: 1 }),
    ).toContain('2');
    expect(
      translate(ru, 'clinicTestCatalog.importCsvErrors', { errors: 'row 3' }),
    ).toContain('row 3');
  });

  it('keeps lab results and change-history key parity across en, hy, and ru (i18n-clinic-v2-4)', () => {
    const report = clinicLabResultsLocaleParityReport();
    expect(report.enCount).toBeGreaterThan(20);
    expect(report.missingByLocale.hy).toEqual([]);
    expect(report.missingByLocale.ru).toEqual([]);
    expect(report.extraByLocale.hy).toEqual([]);
    expect(report.extraByLocale.ru).toEqual([]);
    expect(listClinicLabResultsPanelI18nKeys().length).toBe(report.enCount);
  });

  it('keeps public.myResults key parity across en, hy, and ru (i18n-clinic-v2-4)', () => {
    const report = publicMyResultsLocaleParityReport();
    expect(report.enCount).toBeGreaterThan(4);
    expect(report.missingByLocale.hy).toEqual([]);
    expect(report.missingByLocale.ru).toEqual([]);
    expect(listPublicMyResultsI18nKeys().length).toBe(report.enCount);
  });

  it('resolves dashboard results, public my results, and change-history keys in en, hy, and ru (i18n-clinic-v2-4)', () => {
    const keys = [
      ...listClinicLabResultsDashboardI18nKeys(),
      ...listPublicMyResultsI18nKeys(),
    ];
    expect(keys).toContain('clinic.labResults.changeHistory.actions.ResultReleased');
    expect(keys).toContain('clinic.labState.resultsTab.tabLabel');
    expect(keys).toContain('public.myResults.empty');

    for (const locale of LOCALES) {
      const messages = getMessages(locale);
      for (const key of keys) {
        const value = translate(messages, key);
        expect(value, `${locale}:${key}`).not.toBe(key);
        expect(value.trim().length, `${locale}:${key}`).toBeGreaterThan(0);
      }
    }
  });

  it('localizes results workflow, change-history actions, and public my results in hy and ru (i18n-clinic-v2-4)', () => {
    const hy = getMessages('hy');
    const ru = getMessages('ru');
    expect(translate(hy, 'clinic.labResults.actions.markReleased')).toContain('հիվանդ');
    expect(translate(ru, 'clinic.labResults.changeHistory.actions.StatusChanged')).toContain('измен');
    expect(translate(hy, 'clinic.labResults.changeHistory.actions.ResultReviewed')).toContain('վերանայ');
    expect(translate(ru, 'public.myResults.title')).toBe('Мои результаты');
    expect(translate(hy, 'clinic.labState.resultsTab.title')).toContain('արդյունք');
  });

  it('keeps lab specimens key parity across en, hy, and ru (i18n-clinic-v2-3)', () => {
    const report = clinicLabSpecimensLocaleParityReport();
    expect(report.enCount).toBeGreaterThan(30);
    expect(report.missingByLocale.hy).toEqual([]);
    expect(report.missingByLocale.ru).toEqual([]);
    expect(report.extraByLocale.hy).toEqual([]);
    expect(report.extraByLocale.ru).toEqual([]);
    expect(listClinicLabSpecimensPanelI18nKeys().length).toBe(report.enCount);
  });

  it('resolves specimen collection, tracking, and storage labels in en, hy, and ru (i18n-clinic-v2-3)', () => {
    const keys = listClinicLabSpecimensDashboardI18nKeys();
    expect(keys).toContain('clinic.labSpecimens.collection.title');
    expect(keys).toContain('clinic.labSpecimens.trackingDetails.storage');
    expect(keys).toContain('clinic.labSpecimens.trackingDetails.folder');
    expect(keys).toContain('clinic.labState.specimen.InTransit');
    expect(keys).toContain('nav.labSpecimens');

    for (const locale of LOCALES) {
      const messages = getMessages(locale);
      for (const key of keys) {
        const value = translate(messages, key);
        expect(value, `${locale}:${key}`).not.toBe(key);
        expect(value.trim().length, `${locale}:${key}`).toBeGreaterThan(0);
      }
    }
  });

  it('localizes specimen ops nav, storage labels, and actions in hy and ru (i18n-clinic-v2-3)', () => {
    const hy = getMessages('hy');
    const ru = getMessages('ru');
    expect(translate(hy, 'clinic.labSpecimens.tabs.collection')).toBe('Հավաքում');
    expect(translate(ru, 'clinic.labSpecimens.tabs.tracking')).toBe('Отслеживание');
    expect(translate(hy, 'clinic.labSpecimens.trackingDetails.storage')).toBe('Պահեստ');
    expect(translate(ru, 'clinic.labSpecimens.trackingDetails.folder')).toContain('Транспорт');
    expect(translate(hy, 'clinic.labSpecimens.actions.markReadyForTransport')).toContain('տրանսպորտ');
    expect(translate(ru, 'nav.labSpecimens')).toBe('Образцы');
  });

  it('keeps lab orders & queue key parity across en, hy, and ru (i18n-clinic-v2-2)', () => {
    const report = clinicLabOrdersQueueLocaleParityReport();
    expect(report.enCount).toBeGreaterThan(35);
    expect(report.missingByLocale.hy).toEqual([]);
    expect(report.missingByLocale.ru).toEqual([]);
    expect(report.extraByLocale.hy).toEqual([]);
    expect(report.extraByLocale.ru).toEqual([]);
    expect(listClinicLabOrdersQueueDashboardI18nKeys().length).toBe(report.enCount);
  });

  it('resolves lab orders, lab queue, and booking-request keys in en, hy, and ru (i18n-clinic-v2-2)', () => {
    const keys = listClinicLabOrdersQueueDashboardI18nKeys();
    expect(keys).toContain('clinic.labState.ordersTab.tabLabel');
    expect(keys).toContain('clinic.labQueue.title');
    expect(keys).toContain('clinic.labBookingRequest.pushToPatient');
    expect(keys).toContain('nav.labQueue');

    for (const locale of LOCALES) {
      const messages = getMessages(locale);
      for (const key of keys) {
        const value = translate(messages, key);
        expect(value, `${locale}:${key}`).not.toBe(key);
        expect(value.trim().length, `${locale}:${key}`).toBeGreaterThan(0);
      }
    }
  });

  it('localizes booking orders tab, lab queue, and nav in hy and ru (i18n-clinic-v2-2)', () => {
    const hy = getMessages('hy');
    const ru = getMessages('ru');
    expect(translate(hy, 'clinic.labState.ordersTab.tabLabel')).toBe('Պատվերներ');
    expect(translate(ru, 'clinic.labQueue.badges.awaitingPatientBooking')).toContain('пациента');
    expect(translate(hy, 'nav.labQueue')).toContain('Լաբորատոր');
    expect(translate(ru, 'clinic.labQueue.columns.collection')).toBe('Забор');
    expect(
      translate(hy, 'clinic.labState.ordersTab.selectedCount', { count: 3 }),
    ).toContain('3');
  });

  it('resolves every clinic.labState key in en, hy, and ru (i18n-clinic-v2-0)', () => {
    const keys = listClinicLabStateI18nKeys();
    expect(keys.length).toBeGreaterThan(40);
    for (const locale of LOCALES) {
      const messages = getMessages(locale);
      for (const key of keys) {
        const value = translate(messages, key);
        expect(value, `${locale}:${key}`).not.toBe(key);
        expect(value.trim().length, `${locale}:${key}`).toBeGreaterThan(0);
      }
    }
  });

  it('localizes lab status badges and vertical gate copy in hy and ru', () => {
    const hy = getMessages('hy');
    const ru = getMessages('ru');
    expect(translate(hy, 'clinic.labState.gate.disabledReason')).toContain('կլինիկական');
    expect(translate(ru, 'clinic.labState.gate.disabledReason')).toContain('клинической');
    expect(translate(hy, 'clinic.labState.order.AwaitingResults')).toContain('արդյունք');
    expect(translate(ru, 'clinic.labState.result.Released')).toBe('Опубликован');
    expect(translate(hy, 'clinic.labState.specimen.RecollectRequired')).toContain('կրկին');
    expect(translate(ru, 'clinic.labState.measurement.Abnormal')).toBe('Отклонение');
  });

  it('keeps patient chart key parity across en, hy, and ru (i18n-clinic-v2-5)', () => {
    const report = clinicPatientChartLocaleParityReport();
    expect(report.enCount).toBeGreaterThan(80);
    expect(report.missingByLocale.hy).toEqual([]);
    expect(report.missingByLocale.ru).toEqual([]);
    expect(report.extraByLocale.hy).toEqual([]);
    expect(report.extraByLocale.ru).toEqual([]);
    expect(listClinicPatientChartI18nKeys().length).toBe(report.enCount);
  });

  it('keeps external doctors registry key parity across en, hy, and ru (i18n-clinic-v2-5)', () => {
    const report = externalDoctorsLocaleParityReport();
    expect(report.enCount).toBeGreaterThan(15);
    expect(report.missingByLocale.hy).toEqual([]);
    expect(report.missingByLocale.ru).toEqual([]);
    expect(report.extraByLocale.hy).toEqual([]);
    expect(report.extraByLocale.ru).toEqual([]);
    expect(listExternalDoctorsI18nKeys().length).toBe(report.enCount);
  });

  it('resolves patient chart and external doctors keys in en, hy, and ru (i18n-clinic-v2-5)', () => {
    const keys = [
      ...listClinicPatientChartDashboardI18nKeys(),
      ...listExternalDoctorsI18nKeys(),
    ];
    expect(keys).toContain('clinic.patientChart.demographicsTitle');
    expect(keys).toContain('clinic.patientChart.encountersListTitle');
    expect(keys).toContain('clinic.patientChart.staffNotesInternalNotice');
    expect(keys).toContain('clinic.patientChart.documentCategories.lab_report');
    expect(keys).toContain('externalDoctors.tabLabel');

    for (const locale of LOCALES) {
      const messages = getMessages(locale);
      for (const key of keys) {
        const value = translate(messages, key);
        expect(value, `${locale}:${key}`).not.toBe(key);
        expect(value.trim().length, `${locale}:${key}`).toBeGreaterThan(0);
      }
    }
  });

  it('localizes patient chart and referring doctors copy in hy and ru (i18n-clinic-v2-5)', () => {
    const hy = getMessages('hy');
    const ru = getMessages('ru');
    expect(translate(hy, 'clinic.patientChart.demographicsTitle')).toBe('Հիմնական տվյալներ');
    expect(translate(ru, 'clinic.patientChart.clinicalProfileTitle')).toBe('Клинический профиль');
    expect(translate(hy, 'clinic.patientChart.tabs.encounters')).toBe('Հանդիպումներ');
    expect(translate(ru, 'clinic.patientChart.tabs.staffNotes')).toContain('персонала');
    expect(translate(hy, 'clinic.patientChart.appendAddendum')).toContain('լրացում');
    expect(translate(ru, 'clinic.patientChart.releaseDocumentToPatient')).toContain('пациент');
    expect(translate(hy, 'externalDoctors.tabLabel')).toContain('Ուղղորդող');
    expect(translate(ru, 'externalDoctors.fields.specialty')).toBe('Специальность');
  });

  it('keeps pre-visit intake form key parity across en, hy, and ru (i18n-clinic-v2-8)', () => {
    const report = clinicIntakeFormLocaleParityReport();
    expect(report.enCount).toBeGreaterThan(20);
    expect(report.missingByLocale.hy).toEqual([]);
    expect(report.missingByLocale.ru).toEqual([]);
    expect(report.extraByLocale.hy).toEqual([]);
    expect(report.extraByLocale.ru).toEqual([]);
    expect(listClinicIntakeFormI18nKeys().length).toBe(report.enCount);
  });

  it('keeps public booking intake and questionnaire admin key parity (i18n-clinic-v2-8)', () => {
    const publicReport = clinicPublicIntakeLocaleParityReport();
    const questionnaireReport = clinicQuestionnairesLocaleParityReport();
    expect(publicReport.enCount).toBeGreaterThan(4);
    expect(questionnaireReport.enCount).toBeGreaterThan(15);
    expect(publicReport.missingByLocale.hy).toEqual([]);
    expect(publicReport.missingByLocale.ru).toEqual([]);
    expect(questionnaireReport.missingByLocale.hy).toEqual([]);
    expect(questionnaireReport.missingByLocale.ru).toEqual([]);
    expect(listClinicPublicIntakeI18nKeys().length).toBe(publicReport.enCount);
    expect(listClinicQuestionnairesI18nKeys().length).toBe(questionnaireReport.enCount);
  });

  it('resolves pre-visit intake dashboard keys in en, hy, and ru (i18n-clinic-v2-8)', () => {
    const keys = [
      ...listClinicPreVisitIntakeDashboardI18nKeys(),
      ...listClinicQuestionnairesI18nKeys(),
    ];
    expect(keys).toContain('clinic.intakeForm.start');
    expect(keys).toContain('clinic.publicIntake.checkoutTitle');
    expect(keys).toContain('clinic.patientAlerts.titles.IntakeIncomplete');
    expect(keys).toContain('clinicQuestionnaires.publish');

    for (const locale of LOCALES) {
      const messages = getMessages(locale);
      for (const key of keys) {
        const value = translate(messages, key);
        expect(value, `${locale}:${key}`).not.toBe(key);
        expect(value.trim().length, `${locale}:${key}`).toBeGreaterThan(0);
      }
    }
  });

  it('localizes questionnaire engine, public intake, and intake flow copy in hy and ru (i18n-clinic-v2-8)', () => {
    const hy = getMessages('hy');
    const ru = getMessages('ru');
    expect(translate(hy, 'clinic.intakeForm.chartTitle')).toContain('Նախապոստ');
    expect(translate(ru, 'clinic.intakeForm.bookingTitle')).toContain('перед визитом');
    expect(translate(hy, 'clinic.publicIntake.skip')).toBe('Բաց թողնել');
    expect(translate(ru, 'clinic.publicIntake.continueToCheckout')).toContain('оформлению');
    expect(translate(hy, 'clinicQuestionnaires.tabLabel')).toBe('Հարցաթերթիկներ');
    expect(translate(ru, 'clinic.intakeForm.status.in_progress')).toContain('процессе');
    expect(translate(hy, 'clinic.patientAlerts.titles.IntakeIncomplete')).toContain('Նախապոստ');
  });

  it('keeps specimen barcode label key parity across en, hy, and ru (i18n-clinic-v2-9)', () => {
    const report = clinicSpecimenLabelLocaleParityReport();
    expect(report.enCount).toBeGreaterThan(10);
    expect(report.missingByLocale.hy).toEqual([]);
    expect(report.missingByLocale.ru).toEqual([]);
    expect(report.extraByLocale.hy).toEqual([]);
    expect(report.extraByLocale.ru).toEqual([]);
    expect(listClinicSpecimenLabelI18nKeys().length).toBe(report.enCount);
  });

  it('resolves specimen label print sheet keys in en, hy, and ru (i18n-clinic-v2-9)', () => {
    const keys = listClinicSpecimenLabelI18nKeys();
    expect(keys).toContain('clinic.labSpecimens.label.title');
    expect(keys).toContain('clinic.labSpecimens.label.print');
    expect(keys).toContain('clinic.labSpecimens.label.fields.specimenId');

    for (const locale of LOCALES) {
      const messages = getMessages(locale);
      for (const key of keys) {
        const value = translate(messages, key);
        expect(value, `${locale}:${key}`).not.toBe(key);
        expect(value.trim().length, `${locale}:${key}`).toBeGreaterThan(0);
      }
    }
  });

  it('localizes specimen barcode print sheet copy in hy and ru (i18n-clinic-v2-9)', () => {
    const hy = getMessages('hy');
    const ru = getMessages('ru');
    expect(translate(hy, 'clinic.labSpecimens.label.title')).toBe('Նմուշի պիտակ');
    expect(translate(ru, 'clinic.labSpecimens.label.print')).toContain('Печать');
    expect(translate(hy, 'clinic.labSpecimens.label.printShort')).toBe('Պիտակ');
    expect(translate(ru, 'clinic.labSpecimens.label.fields.customer')).toBe('Пациент');
    expect(translate(hy, 'clinic.labSpecimens.label.loadError')).toContain('պիտակ');
  });

  it('keeps billing codes catalog admin key parity across en, hy, and ru (i18n-clinic-v2-10)', () => {
    const report = clinicDiagnosticCodesLocaleParityReport();
    expect(report.enCount).toBeGreaterThan(20);
    expect(report.missingByLocale.hy).toEqual([]);
    expect(report.missingByLocale.ru).toEqual([]);
    expect(report.extraByLocale.hy).toEqual([]);
    expect(report.extraByLocale.ru).toEqual([]);
    expect(listClinicDiagnosticCodesI18nKeys().length).toBe(report.enCount);
  });

  it('keeps after-visit summary dashboard key parity across en, hy, and ru (i18n-clinic-v2-10)', () => {
    const report = clinicAfterVisitSummaryLocaleParityReport();
    expect(report.enCount).toBeGreaterThan(10);
    expect(report.missingByLocale.hy).toEqual([]);
    expect(report.missingByLocale.ru).toEqual([]);
    expect(report.extraByLocale.hy).toEqual([]);
    expect(report.extraByLocale.ru).toEqual([]);
    expect(listClinicAfterVisitSummaryI18nKeys().length).toBe(report.enCount);
  });

  it('resolves billing codes and after-visit summary keys in en, hy, and ru (i18n-clinic-v2-10)', () => {
    const keys = listClinicBillingCodesDashboardI18nKeys();
    expect(keys).toContain('clinicDiagnosticCodes.tabLabel');
    expect(keys).toContain('clinicDiagnosticCodes.codeKinds.diagnostic');
    expect(keys).toContain('clinic.afterVisitSummary.exportPdf');
    expect(keys).toContain('clinic.afterVisitSummary.releasedBadge');

    for (const locale of LOCALES) {
      const messages = getMessages(locale);
      for (const key of keys) {
        const value = translate(messages, key);
        expect(value, `${locale}:${key}`).not.toBe(key);
        expect(value.trim().length, `${locale}:${key}`).toBeGreaterThan(0);
      }
    }
  });

  it('localizes billing codes catalog and after-visit summary copy in hy and ru (i18n-clinic-v2-10)', () => {
    const hy = getMessages('hy');
    const ru = getMessages('ru');
    expect(translate(hy, 'clinicDiagnosticCodes.tabLabel')).toBe('Հաշվարկային կոդեր');
    expect(translate(ru, 'clinicDiagnosticCodes.codeKinds.procedure')).toBe('Процедурный');
    expect(translate(hy, 'clinic.afterVisitSummary.title')).toBe('Հետայցային ամփոփում');
    expect(translate(ru, 'clinic.afterVisitSummary.exportPdf')).toBe('Экспорт PDF');
    expect(translate(hy, 'clinicDiagnosticCodes.fields.codeSystem')).toContain('համակարգ');
    expect(translate(ru, 'clinic.afterVisitSummary.releasedBadge')).toContain('пациент');
  });

  it('keeps LIS admin key parity across en, hy, and ru (i18n-clinic-v2-6)', () => {
    const report = clinicLisLocaleParityReport();
    expect(report.enCount).toBeGreaterThan(60);
    expect(report.missingByLocale.hy).toEqual([]);
    expect(report.missingByLocale.ru).toEqual([]);
    expect(report.extraByLocale.hy).toEqual([]);
    expect(report.extraByLocale.ru).toEqual([]);
    expect(listClinicLisAdminI18nKeys().length).toBe(report.enCount);
  });

  it('resolves LIS registry, sync status, and worker error keys in en, hy, and ru (i18n-clinic-v2-6)', () => {
    const keys = [
      ...listClinicLisRegistryI18nKeys(),
      ...listClinicLisSyncI18nKeys(),
      ...listClinicLisWorkerErrorI18nKeys(),
      'clinicLis.tabLabel',
      'clinicLis.toasts.syncProcessed',
    ];
    expect(keys).toContain('clinicLis.registry.addLab');
    expect(keys).toContain('clinicLis.sync.inboundStatus.Failed');
    expect(keys).toContain('clinicLis.sync.observationStatus.Unlinked');
    expect(keys).toContain('clinicLis.workerErrors.processFailed');

    for (const locale of LOCALES) {
      const messages = getMessages(locale);
      for (const key of keys) {
        const value = translate(messages, key);
        expect(value, `${locale}:${key}`).not.toBe(key);
        expect(value.trim().length, `${locale}:${key}`).toBeGreaterThan(0);
      }
    }
  });

  it('localizes LIS admin registry, sync badges, and worker error toasts in hy and ru (i18n-clinic-v2-6)', () => {
    const hy = getMessages('hy');
    const ru = getMessages('ru');
    expect(translate(hy, 'clinicLis.tabLabel')).toBe('LIS ինտեգրացիա');
    expect(translate(ru, 'clinicLis.registry.title')).toBe('Справочник лабораторий');
    expect(translate(hy, 'clinicLis.sync.inboundStatus.Failed')).toBe('Ձախողված');
    expect(translate(ru, 'clinicLis.sync.observationStatus.Linked')).toBe('Связан');
    expect(translate(hy, 'clinicLis.workerErrors.processFailed')).toContain('LIS');
    expect(translate(ru, 'clinicLis.workerErrors.webhookNotConfigured')).toContain('webhook');
    expect(translate(hy, 'clinicLis.toasts.machineAssigned')).toContain('նմուշ');
  });

  it('returns localized clinic copy for recently added parity keys', () => {
    const hy = getMessages('hy');
    const ru = getMessages('ru');
    expect(translate(hy, 'clinic.patientChart.intakeEmpty')).toContain('նշանակված');
    expect(translate(ru, 'clinic.fastingRequired')).toContain('голодание');
    expect(translate(ru, 'clinic.admin.enableClinic')).toContain('Клиническая');
    expect(translate(hy, 'clinic.labBookingRequest.pushToPatient')).toContain('հիվանդ');
    expect(translate(ru, 'clinic.labBookingRequest.pushToPatient')).toContain('пациент');
    expect(translate(hy, 'public.myLabRequests.bookCollection')).toContain('հավաքում');
    expect(translate(ru, 'public.myLabRequests.bookCollection')).toContain('забор');
  });

  it('flattens nested message trees', () => {
    expect(flattenMessageTree({ a: { b: 'x' }, c: 'y' }, 'root')).toEqual([
      'root.a.b',
      'root.c',
    ]);
    expect(flattenMessageTree({ leaf: 'value' })).toEqual(['leaf']);
  });
});
