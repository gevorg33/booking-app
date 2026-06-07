import type { VerticalPlaybook } from '../../onboarding/vertical-playbooks.constants.js';
import { buildClinicTestTypeCode } from './clinic-test-catalog.util.js';

export interface PlaybookLabTestDraft {
  categoryName: string;
  name: string;
  description?: string | null;
  price: number;
  requiresFasting: boolean;
  preparationNotes?: string | null;
}

export interface PlaybookPanelDraft {
  categoryName: string;
  title: string;
  code: string;
  testNames: string[];
}

export interface ParsedClinicCatalogCsvRow {
  kind: 'type' | 'panel';
  title: string;
  code?: string;
  serviceName?: string;
  price?: number;
  requiresFasting?: boolean;
  preparationNotes?: string | null;
  unit?: string | null;
  abbreviation?: string | null;
  description?: string | null;
  panelItems?: string[];
  lineNumber: number;
}

export interface ClinicCatalogImportSummary {
  testTypesCreated: number;
  testTypesSkipped: number;
  panelsCreated: number;
  panelsSkipped: number;
  unmatchedServiceNames: string[];
  csvErrors: string[];
}

export function normalizeCatalogMatchKey(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, ' ');
}

export function extractPlaybookLabTestDrafts(
  playbook: VerticalPlaybook,
): PlaybookLabTestDraft[] {
  const drafts: PlaybookLabTestDraft[] = [];
  for (const category of playbook.categories) {
    for (const service of category.services) {
      if (service.serviceType !== 'lab_test') continue;
      drafts.push({
        categoryName: category.name,
        name: service.name,
        description: service.description ?? null,
        price: service.price ?? 0,
        requiresFasting: service.requiresFasting ?? false,
        preparationNotes: service.preparationNotes ?? null,
      });
    }
  }
  return drafts;
}

export function buildPlaybookCategoryPanelDrafts(
  playbook: VerticalPlaybook,
): PlaybookPanelDraft[] {
  const panels: PlaybookPanelDraft[] = [];
  for (const category of playbook.categories) {
    const labTests = category.services.filter(
      (service) => service.serviceType === 'lab_test',
    );
    if (labTests.length < 2) continue;
    panels.push({
      categoryName: category.name,
      title: `${category.name} panel`,
      code: buildClinicTestTypeCode({ title: `${category.name} panel` }),
      testNames: labTests.map((service) => service.name),
    });
  }
  return panels;
}

function splitCsvLine(line: string): string[] {
  const cells: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (char === ',' && !inQuotes) {
      cells.push(current.trim());
      current = '';
      continue;
    }
    current += char;
  }
  cells.push(current.trim());
  return cells;
}

function parseBooleanCell(value: string | undefined): boolean | undefined {
  if (value === undefined || value === '') return undefined;
  const normalized = value.trim().toLowerCase();
  if (['true', '1', 'yes', 'y'].includes(normalized)) return true;
  if (['false', '0', 'no', 'n'].includes(normalized)) return false;
  return undefined;
}

function parseNumberCell(value: string | undefined): number | undefined {
  if (value === undefined || value === '') return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

const CSV_HEADERS = [
  'kind',
  'title',
  'code',
  'serviceName',
  'price',
  'requiresFasting',
  'preparationNotes',
  'unit',
  'abbreviation',
  'description',
  'panelItems',
] as const;

export function parseClinicTestCatalogCsv(csv: string): {
  rows: ParsedClinicCatalogCsvRow[];
  errors: string[];
} {
  const errors: string[] = [];
  const lines = csv
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith('#'));

  if (lines.length === 0) {
    return { rows: [], errors: ['CSV is empty'] };
  }

  const headerCells = splitCsvLine(lines[0]).map((cell) =>
    cell.trim().toLowerCase(),
  );
  const hasHeader = headerCells.includes('title');
  const headerIndex = hasHeader
    ? Object.fromEntries(
        CSV_HEADERS.map((header) => [
          header,
          headerCells.indexOf(header.toLowerCase()),
        ]),
      )
    : null;

  const dataLines = hasHeader ? lines.slice(1) : lines;
  const rows: ParsedClinicCatalogCsvRow[] = [];

  dataLines.forEach((line, index) => {
    const lineNumber = hasHeader ? index + 2 : index + 1;
    const cells = splitCsvLine(line);
    const readCell = (
      header: (typeof CSV_HEADERS)[number],
    ): string | undefined => {
      if (headerIndex) {
        const idx = headerIndex[header];
        if (idx < 0) return undefined;
        return cells[idx];
      }
      const positional: Record<(typeof CSV_HEADERS)[number], number> = {
        kind: 0,
        title: 1,
        code: 2,
        serviceName: 3,
        price: 4,
        requiresFasting: 5,
        preparationNotes: 6,
        unit: 7,
        abbreviation: 8,
        description: 9,
        panelItems: 10,
      };
      return cells[positional[header]];
    };

    const title = readCell('title')?.trim();
    if (!title) {
      errors.push(`Line ${lineNumber}: title is required`);
      return;
    }

    const kindRaw = readCell('kind')?.trim().toLowerCase();
    const kind: 'type' | 'panel' =
      kindRaw === 'panel' || kindRaw === 'test_panel' ? 'panel' : 'type';

    const panelItemsRaw = readCell('panelItems');
    const panelItems = panelItemsRaw
      ? panelItemsRaw
          .split('|')
          .map((item) => item.trim())
          .filter(Boolean)
      : undefined;

    rows.push({
      kind,
      title,
      code: readCell('code')?.trim() || undefined,
      serviceName: readCell('serviceName')?.trim() || undefined,
      price: parseNumberCell(readCell('price')),
      requiresFasting: parseBooleanCell(readCell('requiresFasting')),
      preparationNotes: readCell('preparationNotes')?.trim() || null,
      unit: readCell('unit')?.trim() || null,
      abbreviation: readCell('abbreviation')?.trim() || null,
      description: readCell('description')?.trim() || null,
      panelItems,
      lineNumber,
    });
  });

  return { rows, errors };
}

export function matchServiceByName<T extends { name: string }>(
  services: T[],
  serviceName: string,
): T | null {
  const target = normalizeCatalogMatchKey(serviceName);
  return (
    services.find(
      (service) => normalizeCatalogMatchKey(service.name) === target,
    ) ?? null
  );
}
