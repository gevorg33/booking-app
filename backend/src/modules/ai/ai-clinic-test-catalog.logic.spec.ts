import { describe, expect, it, jest } from '@jest/globals';
import {
  handleCreateTestPanelLogic,
  handleCreateTestTypeLogic,
  handleDeleteTestTypeLogic,
  handleImportClinicCatalogCsvLogic,
  handleSetTestPanelItemsLogic,
  handleUpdateTestPanelLogic,
  handleUpdateTestTypeLogic,
  type ClinicTestCatalogLogicDeps,
} from './ai-clinic-test-catalog.logic.js';

const testType = { id: 'tt1', code: 'CBC', title: 'CBC' };
const panel = { id: 'p1', code: 'LIPID', title: 'Lipid Panel' };

function buildDeps(
  overrides: Record<string, any> = {},
): ClinicTestCatalogLogicDeps {
  return {
    businessService: {
      ensureMember: jest.fn(async () => ({ role: 'owner' })),
      ...overrides.businessService,
    },
    catalogService: {
      listTestTypes: jest.fn(async () => [testType]),
      createTestType: jest.fn(async (_biz: string, dto: any) => ({
        id: 'tt2',
        code: dto.code ?? 'NEW',
        title: dto.title,
      })),
      updateTestType: jest.fn(async (_biz: string, id: string, dto: any) => ({
        ...testType,
        id,
        ...dto,
      })),
      deactivateTestType: jest.fn(async (_biz: string, id: string) => ({
        ...testType,
        id,
        isActive: false,
      })),
      listPanels: jest.fn(async () => [panel]),
      createPanel: jest.fn(async (_biz: string, dto: any) => ({
        id: 'p2',
        code: dto.code ?? 'NEW',
        title: dto.title,
      })),
      updatePanel: jest.fn(async (_biz: string, id: string, dto: any) => ({
        ...panel,
        id,
        ...dto,
      })),
      upsertPanelItems: jest.fn(async (_biz: string, id: string) => ({
        ...panel,
        id,
      })),
      importFromCsv: jest.fn(async () => ({
        testTypesCreated: 2,
        testTypesSkipped: 1,
        panelsCreated: 1,
        panelsSkipped: 0,
        unmatchedServiceNames: [],
        csvErrors: [],
      })),
      ...overrides.catalogService,
    },
  } as any;
}

describe('ai-clinic-test-catalog.logic (ai-cmd-dashboard-6.9)', () => {
  describe('handleCreateTestTypeLogic', () => {
    it('clarifies when title missing', async () => {
      const deps = buildDeps();
      const result = await handleCreateTestTypeLogic(deps, 'biz-1', 'user-1', {});
      expect(result.success).toBe(false);
      expect(result.details.clarify).toBe(true);
    });

    it('creates the test type', async () => {
      const deps = buildDeps();
      const result = await handleCreateTestTypeLogic(deps, 'biz-1', 'user-1', {
        title: 'CBC',
        requiresFasting: true,
      });
      expect(result.success).toBe(true);
      expect(deps.catalogService.createTestType).toHaveBeenCalledWith(
        'biz-1',
        { title: 'CBC', requiresFasting: true },
        'owner',
      );
    });

    it('fails when the caller is not a business member', async () => {
      const deps = buildDeps({
        businessService: {
          ensureMember: jest.fn(async () => {
            throw new Error('not a member');
          }),
        },
      });
      const result = await handleCreateTestTypeLogic(deps, 'biz-1', 'user-1', {
        title: 'CBC',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('handleUpdateTestTypeLogic', () => {
    it('clarifies when the test type cannot be resolved', async () => {
      const deps = buildDeps();
      const result = await handleUpdateTestTypeLogic(deps, 'biz-1', 'user-1', {
        title: 'New',
      });
      expect(result.success).toBe(false);
      expect(result.details.clarify).toBe(true);
    });

    it('updates the resolved test type', async () => {
      const deps = buildDeps();
      const result = await handleUpdateTestTypeLogic(deps, 'biz-1', 'user-1', {
        testTypeCode: 'CBC',
        price: 25,
      });
      expect(result.success).toBe(true);
      expect(deps.catalogService.updateTestType).toHaveBeenCalledWith(
        'biz-1',
        'tt1',
        { price: 25 },
        'owner',
      );
    });
  });

  describe('handleDeleteTestTypeLogic', () => {
    it('deactivates the resolved test type', async () => {
      const deps = buildDeps();
      const result = await handleDeleteTestTypeLogic(deps, 'biz-1', 'user-1', {
        testTypeId: 'tt1',
      });
      expect(result.success).toBe(true);
      expect(deps.catalogService.deactivateTestType).toHaveBeenCalledWith(
        'biz-1',
        'tt1',
        'owner',
      );
    });
  });

  describe('handleCreateTestPanelLogic', () => {
    it('creates the panel', async () => {
      const deps = buildDeps();
      const result = await handleCreateTestPanelLogic(deps, 'biz-1', 'user-1', {
        title: 'Lipid Panel',
      });
      expect(result.success).toBe(true);
    });
  });

  describe('handleUpdateTestPanelLogic', () => {
    it('clarifies when no field is given', async () => {
      const deps = buildDeps();
      const result = await handleUpdateTestPanelLogic(deps, 'biz-1', 'user-1', {
        panelCode: 'LIPID',
      });
      expect(result.success).toBe(false);
      expect(deps.catalogService.updatePanel).not.toHaveBeenCalled();
    });

    it('updates the resolved panel', async () => {
      const deps = buildDeps();
      const result = await handleUpdateTestPanelLogic(deps, 'biz-1', 'user-1', {
        panelName: 'Lipid Panel',
        isActive: false,
      });
      expect(result.success).toBe(true);
    });
  });

  describe('handleSetTestPanelItemsLogic', () => {
    it('clarifies when no test types are given', async () => {
      const deps = buildDeps();
      const result = await handleSetTestPanelItemsLogic(deps, 'biz-1', 'user-1', {
        panelId: 'p1',
      });
      expect(result.success).toBe(false);
    });

    it('sets panel items by testTypeIds', async () => {
      const deps = buildDeps();
      const result = await handleSetTestPanelItemsLogic(deps, 'biz-1', 'user-1', {
        panelId: 'p1',
        testTypeIds: ['tt1'],
      });
      expect(result.success).toBe(true);
      expect(deps.catalogService.upsertPanelItems).toHaveBeenCalledWith(
        'biz-1',
        'p1',
        { items: [{ testTypeId: 'tt1' }] },
        'owner',
      );
    });

    it('resolves panel items by testTypeNames', async () => {
      const deps = buildDeps();
      const result = await handleSetTestPanelItemsLogic(deps, 'biz-1', 'user-1', {
        panelId: 'p1',
        testTypeNames: ['CBC'],
      });
      expect(result.success).toBe(true);
      expect(deps.catalogService.upsertPanelItems).toHaveBeenCalledWith(
        'biz-1',
        'p1',
        { items: [{ testTypeId: 'tt1' }] },
        'owner',
      );
    });

    it('fails when names do not match the catalog', async () => {
      const deps = buildDeps();
      const result = await handleSetTestPanelItemsLogic(deps, 'biz-1', 'user-1', {
        panelId: 'p1',
        testTypeNames: ['Nonexistent'],
      });
      expect(result.success).toBe(false);
    });
  });

  describe('handleImportClinicCatalogCsvLogic', () => {
    it('clarifies when csv is missing', async () => {
      const deps = buildDeps();
      const result = await handleImportClinicCatalogCsvLogic(
        deps,
        'biz-1',
        'user-1',
        {},
      );
      expect(result.success).toBe(false);
      expect(result.details.clarify).toBe(true);
    });

    it('imports the csv', async () => {
      const deps = buildDeps();
      const result = await handleImportClinicCatalogCsvLogic(
        deps,
        'biz-1',
        'user-1',
        { csv: 'type,CBC,,,,\n' },
      );
      expect(result.success).toBe(true);
      expect(deps.catalogService.importFromCsv).toHaveBeenCalledWith(
        'biz-1',
        'type,CBC,,,,\n',
        'owner',
      );
    });
  });
});
