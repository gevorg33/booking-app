import { Injectable } from '@nestjs/common';
import { BusinessService } from '../business/business.service.js';
import { ClinicTestCatalogService } from '../clinic-test-results/catalog/clinic-test-catalog.service.js';
import type { CommandResult } from './command-completion.types.js';
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
import { dispatchClinicTestCatalogLogicIntent } from './ai-clinic-test-catalog-dispatch.util.js';
import type { ClinicTestCatalogDispatchContext } from './ai-clinic-test-catalog-dispatch.build.js';

@Injectable()
export class AiClinicTestCatalogService {
  private readonly deps: ClinicTestCatalogLogicDeps;

  constructor(
    businessService: BusinessService,
    catalogService: ClinicTestCatalogService,
  ) {
    this.deps = { businessService, catalogService };
  }

  handleCreateTestType(
    businessId: string,
    userId: string,
    params: Record<string, any>,
  ): Promise<CommandResult> {
    return handleCreateTestTypeLogic(this.deps, businessId, userId, params);
  }

  handleUpdateTestType(
    businessId: string,
    userId: string,
    params: Record<string, any>,
  ): Promise<CommandResult> {
    return handleUpdateTestTypeLogic(this.deps, businessId, userId, params);
  }

  handleDeleteTestType(
    businessId: string,
    userId: string,
    params: Record<string, any>,
  ): Promise<CommandResult> {
    return handleDeleteTestTypeLogic(this.deps, businessId, userId, params);
  }

  handleCreateTestPanel(
    businessId: string,
    userId: string,
    params: Record<string, any>,
  ): Promise<CommandResult> {
    return handleCreateTestPanelLogic(this.deps, businessId, userId, params);
  }

  handleUpdateTestPanel(
    businessId: string,
    userId: string,
    params: Record<string, any>,
  ): Promise<CommandResult> {
    return handleUpdateTestPanelLogic(this.deps, businessId, userId, params);
  }

  handleSetTestPanelItems(
    businessId: string,
    userId: string,
    params: Record<string, any>,
  ): Promise<CommandResult> {
    return handleSetTestPanelItemsLogic(this.deps, businessId, userId, params);
  }

  handleImportClinicCatalogCsv(
    businessId: string,
    userId: string,
    params: Record<string, any>,
  ): Promise<CommandResult> {
    return handleImportClinicCatalogCsvLogic(
      this.deps,
      businessId,
      userId,
      params,
    );
  }

  /** Registry-driven dispatch (ai-cmd-ext-0.5). Returns null when action is not a clinic-test-catalog intent. */
  dispatchIntent(
    ctx: ClinicTestCatalogDispatchContext,
  ): Promise<CommandResult | null> {
    return dispatchClinicTestCatalogLogicIntent(this.deps, ctx);
  }
}
