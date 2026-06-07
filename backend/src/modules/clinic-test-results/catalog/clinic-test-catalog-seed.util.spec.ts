import { getVerticalPlaybook } from '../../onboarding/vertical-playbooks.constants.js';
import { buildClinicTestTypeCode } from './clinic-test-catalog.util.js';
import {
  buildPlaybookCategoryPanelDrafts,
  extractPlaybookLabTestDrafts,
  matchServiceByName,
  normalizeCatalogMatchKey,
  parseClinicTestCatalogCsv,
  type ClinicCatalogImportSummary,
  type ParsedClinicCatalogCsvRow,
  type PlaybookLabTestDraft,
} from './clinic-test-catalog-seed.util.js';

export {
  buildPlaybookCategoryPanelDrafts,
  extractPlaybookLabTestDrafts,
  matchServiceByName,
  normalizeCatalogMatchKey,
  parseClinicTestCatalogCsv,
  type ClinicCatalogImportSummary,
  type ParsedClinicCatalogCsvRow,
  type PlaybookLabTestDraft,
};

/** Fixture playbook for unit tests — generic clinic lab tests only. */
export const CLINIC_PLAYBOOK_LAB_TEST_FIXTURES = extractPlaybookLabTestDrafts(
  getVerticalPlaybook('clinic'),
);

export const CLINIC_PLAYBOOK_PANEL_FIXTURES = buildPlaybookCategoryPanelDrafts(
  getVerticalPlaybook('clinic'),
);

describe('clinic-test-catalog-seed.util', () => {
  it('extracts lab_test services from the clinic playbook', () => {
    expect(
      CLINIC_PLAYBOOK_LAB_TEST_FIXTURES.map((draft) => draft.name),
    ).toEqual(['Complete blood count', 'Lipid panel', 'Thyroid panel']);
    expect(
      CLINIC_PLAYBOOK_LAB_TEST_FIXTURES.every(
        (draft) => draft.categoryName === 'Laboratory',
      ),
    ).toBe(true);
  });

  it('builds category panels when a playbook category has multiple lab tests', () => {
    expect(CLINIC_PLAYBOOK_PANEL_FIXTURES).toEqual([
      {
        categoryName: 'Laboratory',
        title: 'Laboratory panel',
        code: 'laboratory_panel',
        testNames: ['Complete blood count', 'Lipid panel', 'Thyroid panel'],
      },
    ]);
  });

  it('matches services by normalized name', () => {
    expect(
      matchServiceByName(
        [{ name: '  Complete Blood Count ' }, { name: 'ECG' }],
        'complete blood count',
      )?.name,
    ).toBe('  Complete Blood Count ');
  });

  it('parses CSV rows with header and positional fallback', () => {
    const withHeader = parseClinicTestCatalogCsv(
      [
        'kind,title,code,serviceName,price,requiresFasting,preparationNotes,unit,abbreviation,description,panelItems',
        'type,Complete blood count,cbc,CBC,25,false,,g/L,CBC,Full CBC,',
        'panel,Laboratory panel,laboratory_panel,,60,,,,,,"cbc|lipid_panel"',
      ].join('\n'),
    );
    expect(withHeader.errors).toEqual([]);
    expect(withHeader.rows).toHaveLength(2);
    expect(withHeader.rows[0]).toMatchObject({
      kind: 'type',
      title: 'Complete blood count',
      code: 'cbc',
      serviceName: 'CBC',
      price: 25,
      requiresFasting: false,
    });
    expect(withHeader.rows[1].panelItems).toEqual(['cbc', 'lipid_panel']);

    const positional = parseClinicTestCatalogCsv(
      'type,Lipid panel,lipid,,35,true,Fast 12 hours,,,,',
    );
    expect(positional.errors).toEqual([]);
    expect(positional.rows[0]).toMatchObject({
      title: 'Lipid panel',
      requiresFasting: true,
      preparationNotes: 'Fast 12 hours',
    });
  });

  it('reports CSV validation errors', () => {
    const parsed = parseClinicTestCatalogCsv('type,,missing-title');
    expect(
      parsed.errors.some((error) => error.includes('title is required')),
    ).toBe(true);
  });

  it('builds stable panel codes from category titles', () => {
    expect(buildClinicTestTypeCode({ title: 'Laboratory panel' })).toBe(
      'laboratory_panel',
    );
  });
});
