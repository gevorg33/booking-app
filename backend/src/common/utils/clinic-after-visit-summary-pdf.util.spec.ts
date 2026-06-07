import {
  buildClinicAfterVisitSummaryPdfHtml,
  buildClinicAfterVisitSummaryPdfHtmlFromBusinessSettings,
} from './clinic-after-visit-summary-pdf.util.js';
import { CLINIC_AFTER_VISIT_SUMMARY_PDF_CONTEXT } from '../../modules/patient-clinical-profiles/clinic-after-visit-summaries.fixtures.js';

describe('clinic-after-visit-summary-pdf.util', () => {
  it('builds printable html with escaped content', () => {
    const html = buildClinicAfterVisitSummaryPdfHtmlFromBusinessSettings(
      CLINIC_AFTER_VISIT_SUMMARY_PDF_CONTEXT,
    );

    expect(html).toContain('<title>After-Visit Summary</title>');
    expect(html).toContain('City Polyclinic');
    expect(html).toContain('Jane Doe');
    expect(html).toContain('Continue medication.<br/>Schedule follow-up.');
    expect(html).toContain('Print / Save as PDF');
  });

  it('localizes section headings for hy and ru', () => {
    const hy = buildClinicAfterVisitSummaryPdfHtml({
      ...CLINIC_AFTER_VISIT_SUMMARY_PDF_CONTEXT,
      locale: 'hy',
    });
    const ru = buildClinicAfterVisitSummaryPdfHtml({
      ...CLINIC_AFTER_VISIT_SUMMARY_PDF_CONTEXT,
      locale: 'ru',
    });

    expect(hy).toContain('<title>Հետայցային ամփոփում</title>');
    expect(hy).toContain('Հիվանդ՝ Jane Doe');
    expect(hy).toContain('Տպել / PDF');
    expect(ru).toContain('<title>Сводка после визита</title>');
    expect(ru).toContain('Пациент: Jane Doe');
    expect(ru).toContain('Печать / сохранить как PDF');
  });

  it('uses tenant default locale from business settings', () => {
    const html = buildClinicAfterVisitSummaryPdfHtmlFromBusinessSettings({
      ...CLINIC_AFTER_VISIT_SUMMARY_PDF_CONTEXT,
      businessSettings: { defaultLocale: 'hy' },
    });

    expect(html).toContain('Հետայցային ամփոփում');
    expect(html).toContain('Հիվանդ՝');
  });

  it('escapes html in patient-facing fields', () => {
    const html = buildClinicAfterVisitSummaryPdfHtml({
      businessName: 'Clinic <script>',
      patientName: 'Pat &amp; Co',
      providerName: 'Dr. Lee',
      serviceName: 'Visit',
      visitStart: new Date('2026-06-01T09:00:00.000Z'),
      description: '<b>bold</b> & more',
    });

    expect(html).not.toContain('<script>');
    expect(html).toContain('Clinic &lt;script&gt;');
    expect(html).toContain('&lt;b&gt;bold&lt;/b&gt; &amp; more');
  });

  it('uses localized default provider and service when omitted', () => {
    const hy = buildClinicAfterVisitSummaryPdfHtml({
      businessName: 'Clinic',
      patientName: 'Pat',
      providerName: null,
      serviceName: null,
      visitStart: new Date('2026-06-01T09:00:00.000Z'),
      description: 'Summary text',
      locale: 'hy',
    });

    expect(hy).toContain('Մասնագետ՝ Մասնագետ');
    expect(hy).toContain('Ծառայություն՝ Խորհրդատվություն');
  });
});
