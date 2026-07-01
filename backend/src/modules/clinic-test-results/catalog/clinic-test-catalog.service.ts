import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { extractClinicMetadata } from '../../../common/utils/clinic-service.util.js';
import { getVerticalPlaybook } from '../../onboarding/vertical-playbooks.constants.js';
import { BusinessService } from '../../business/business.service.js';
import { MemberRole } from '../../business/entities/business-member.entity.js';
import { Service } from '../../service/entities/service.entity.js';
import { ClinicTestPanel } from '../entities/clinic-test-panel.entity.js';
import { ClinicTestPanelItem } from '../entities/clinic-test-panel-item.entity.js';
import { ClinicTestType } from '../entities/clinic-test-type.entity.js';
import { assertClinicLabFeaturesEnabled } from '../shared/clinic-test-results-gate.util.js';
import {
  applyClinicTestTypeLinkToServiceMetadata,
  assertClinicReferenceRangeBounds,
  buildClinicTestTypeCode,
  inheritCatalogFieldsFromService,
  parseClinicReferenceRangeBound,
  readClinicTestTypeIdFromServiceMetadata,
  resolveClinicalDepartmentLabel,
} from './clinic-test-catalog.util.js';
import {
  applyClinicDiagnosticCodeLinkToServiceMetadata,
  mapClinicDiagnosticCodeLinkView,
  readClinicDiagnosticCodeIdFromServiceMetadata,
  type ClinicDiagnosticCodeLinkView,
  validateClinicTestTypeDiagnosticCodeKind,
} from '../../../common/utils/clinic-diagnostic-code-link.util.js';
import { ClinicDiagnosticCodesService } from '../../clinic-diagnostic-codes/clinic-diagnostic-codes.service.js';
import {
  buildPlaybookCategoryPanelDrafts,
  extractPlaybookLabTestDrafts,
  matchServiceByName,
  normalizeCatalogMatchKey,
  parseClinicTestCatalogCsv,
  type ClinicCatalogImportSummary,
} from './clinic-test-catalog-seed.util.js';
import type {
  CreateClinicTestPanelDto,
  CreateClinicTestTypeDto,
  UpdateClinicTestPanelDto,
  UpdateClinicTestTypeDto,
  UpsertClinicTestPanelItemsDto,
} from './dto/clinic-test-catalog.dto.js';

const CATALOG_MUTATION_ROLES = new Set<string>([
  MemberRole.OWNER,
  MemberRole.ADMIN,
  MemberRole.MANAGER,
]);

export interface ClinicTestTypeView {
  id: string;
  businessId: string;
  code: string;
  title: string;
  abbreviation?: string | null;
  description?: string | null;
  unit?: string | null;
  normalLow?: number | null;
  normalHigh?: number | null;
  price: number;
  requiresFasting: boolean;
  preparationNotes?: string | null;
  serviceId?: string | null;
  department?: string | null;
  isActive: boolean;
  clinicDiagnosticCodeId?: string | null;
  diagnosticCode?: ClinicDiagnosticCodeLinkView | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ClinicTestPanelView {
  id: string;
  businessId: string;
  code: string;
  title: string;
  abbreviation?: string | null;
  description?: string | null;
  price: number;
  isActive: boolean;
  items: Array<{
    id: string;
    testTypeId: string;
    sortOrder: number;
    testType?: Pick<ClinicTestTypeView, 'id' | 'title' | 'code'>;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

export type { ClinicCatalogImportSummary };

@Injectable()
export class ClinicTestCatalogService {
  constructor(
    private readonly businessService: BusinessService,
    @InjectRepository(ClinicTestType)
    private readonly testTypeRepo: Repository<ClinicTestType>,
    @InjectRepository(ClinicTestPanel)
    private readonly testPanelRepo: Repository<ClinicTestPanel>,
    @InjectRepository(ClinicTestPanelItem)
    private readonly panelItemRepo: Repository<ClinicTestPanelItem>,
    @InjectRepository(Service)
    private readonly serviceRepo: Repository<Service>,
    private readonly clinicDiagnosticCodesService: ClinicDiagnosticCodesService,
  ) {}

  private async assertCatalogEnabled(businessId: string): Promise<void> {
    const business = await this.businessService.findOne(businessId);
    assertClinicLabFeaturesEnabled(
      business.settings?.businessType as string | undefined,
    );
  }

  private assertCatalogMutationRole(role: string): void {
    if (!CATALOG_MUTATION_ROLES.has(role)) {
      throw new BadRequestException(
        'Only owner, admin, or manager can manage the clinic test catalog',
      );
    }
  }

  private mapTestType(
    entity: ClinicTestType,
    department?: string | null,
  ): ClinicTestTypeView {
    return {
      id: entity.id,
      businessId: entity.businessId,
      code: entity.code,
      title: entity.title,
      abbreviation: entity.abbreviation ?? null,
      description: entity.description ?? null,
      unit: entity.unit ?? null,
      normalLow: entity.normalLow == null ? null : Number(entity.normalLow),
      normalHigh: entity.normalHigh == null ? null : Number(entity.normalHigh),
      price: Number(entity.price),
      requiresFasting: entity.requiresFasting,
      preparationNotes: entity.preparationNotes ?? null,
      serviceId: entity.serviceId ?? null,
      department: department ?? null,
      isActive: entity.isActive,
      clinicDiagnosticCodeId: entity.clinicDiagnosticCodeId ?? null,
      diagnosticCode: entity.clinicDiagnosticCode
        ? mapClinicDiagnosticCodeLinkView(entity.clinicDiagnosticCode)
        : null,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }

  private async resolveTestTypeDiagnosticCodeId(
    businessId: string,
    clinicDiagnosticCodeId: string | null | undefined,
  ): Promise<string | null | undefined> {
    if (clinicDiagnosticCodeId === undefined) return undefined;
    if (!clinicDiagnosticCodeId) return null;
    const summary =
      await this.clinicDiagnosticCodesService.resolveActiveClinicDiagnosticCode(
        businessId,
        clinicDiagnosticCodeId,
      );
    const kindError = validateClinicTestTypeDiagnosticCodeKind(
      summary!.codeKind,
    );
    if (kindError) {
      throw new BadRequestException(kindError);
    }
    return summary!.id;
  }

  private async loadServiceLink(
    businessId: string,
    serviceId: string | null | undefined,
  ): Promise<Service | null> {
    if (!serviceId) return null;
    const service = await this.serviceRepo.findOne({
      where: { id: serviceId, businessId },
      relations: { category: true },
    });
    if (!service) {
      throw new NotFoundException('Linked service not found for this business');
    }
    return service;
  }

  private readServiceLink(service: Service) {
    const clinic = extractClinicMetadata(service.metadata);
    return {
      id: service.id,
      name: service.name,
      categoryId: service.categoryId,
      categoryName: service.category?.name ?? null,
      serviceType: clinic?.serviceType ?? null,
      requiresFasting: clinic?.requiresFasting,
      preparationNotes: clinic?.preparationNotes ?? null,
      price: Number(service.price),
    };
  }

  private async syncServiceLink(
    testType: ClinicTestType,
    previousServiceId?: string | null,
  ): Promise<void> {
    if (previousServiceId && previousServiceId !== testType.serviceId) {
      const previous = await this.serviceRepo.findOne({
        where: { id: previousServiceId, businessId: testType.businessId },
      });
      if (previous) {
        let metadata = applyClinicTestTypeLinkToServiceMetadata(
          previous.metadata,
          null,
        );
        const linkedCodeId =
          readClinicDiagnosticCodeIdFromServiceMetadata(metadata);
        if (linkedCodeId && linkedCodeId === testType.clinicDiagnosticCodeId) {
          metadata = applyClinicDiagnosticCodeLinkToServiceMetadata(
            metadata,
            null,
          );
        }
        previous.metadata = metadata;
        await this.serviceRepo.save(previous);
      }
    }

    if (!testType.serviceId) return;

    const service = await this.serviceRepo.findOne({
      where: { id: testType.serviceId, businessId: testType.businessId },
    });
    if (!service) return;

    const linkedTypeId = readClinicTestTypeIdFromServiceMetadata(
      service.metadata,
    );
    if (linkedTypeId && linkedTypeId !== testType.id) {
      throw new BadRequestException(
        'Service is already linked to another clinic test type',
      );
    }

    service.metadata = applyClinicTestTypeLinkToServiceMetadata(
      service.metadata,
      testType.id,
    );
    service.metadata = applyClinicDiagnosticCodeLinkToServiceMetadata(
      service.metadata,
      testType.clinicDiagnosticCodeId ?? null,
    );
    await this.serviceRepo.save(service);
  }

  async listTestTypes(businessId: string): Promise<ClinicTestTypeView[]> {
    await this.assertCatalogEnabled(businessId);
    const rows = await this.testTypeRepo.find({
      where: { businessId },
      relations: { service: { category: true }, clinicDiagnosticCode: true },
      order: { title: 'ASC' },
    });
    return rows.map((row) =>
      this.mapTestType(
        row,
        resolveClinicalDepartmentLabel(row.service?.category?.name),
      ),
    );
  }

  async getTestType(
    businessId: string,
    testTypeId: string,
  ): Promise<ClinicTestTypeView> {
    await this.assertCatalogEnabled(businessId);
    const row = await this.testTypeRepo.findOne({
      where: { id: testTypeId, businessId },
      relations: { service: { category: true }, clinicDiagnosticCode: true },
    });
    if (!row) throw new NotFoundException('Clinic test type not found');
    return this.mapTestType(
      row,
      resolveClinicalDepartmentLabel(row.service?.category?.name),
    );
  }

  async createTestType(
    businessId: string,
    dto: CreateClinicTestTypeDto,
    role: string,
  ): Promise<ClinicTestTypeView> {
    await this.assertCatalogEnabled(businessId);
    this.assertCatalogMutationRole(role);

    const service = await this.loadServiceLink(businessId, dto.serviceId);
    const inherited = service
      ? inheritCatalogFieldsFromService(this.readServiceLink(service), dto)
      : {
          requiresFasting: dto.requiresFasting ?? false,
          preparationNotes: dto.preparationNotes ?? null,
          price: dto.price ?? 0,
          department: null,
        };

    const code = buildClinicTestTypeCode({ code: dto.code, title: dto.title });
    const existingCode = await this.testTypeRepo.findOne({
      where: { businessId, code },
    });
    if (existingCode) {
      throw new BadRequestException(`Test type code "${code}" already exists`);
    }

    const clinicDiagnosticCodeId = await this.resolveTestTypeDiagnosticCodeId(
      businessId,
      dto.clinicDiagnosticCodeId,
    );

    const hasRangeInput =
      dto.normalLow !== undefined || dto.normalHigh !== undefined;
    const normalLow =
      dto.normalLow === undefined
        ? null
        : parseClinicReferenceRangeBound(dto.normalLow);
    const normalHigh =
      dto.normalHigh === undefined
        ? null
        : parseClinicReferenceRangeBound(dto.normalHigh);
    if (hasRangeInput) {
      const rangeError = assertClinicReferenceRangeBounds(
        normalLow,
        normalHigh,
      );
      if (rangeError) {
        throw new BadRequestException(rangeError);
      }
    }

    const entity = this.testTypeRepo.create({
      businessId,
      code,
      title: dto.title.trim(),
      abbreviation: dto.abbreviation?.trim() || null,
      description: dto.description?.trim() || null,
      unit: dto.unit?.trim() || null,
      normalLow: hasRangeInput ? normalLow : null,
      normalHigh: hasRangeInput ? normalHigh : null,
      price: inherited.price,
      requiresFasting: inherited.requiresFasting,
      preparationNotes: inherited.preparationNotes,
      serviceId: dto.serviceId ?? null,
      clinicDiagnosticCodeId: clinicDiagnosticCodeId ?? null,
      isActive: true,
    });
    const saved = await this.testTypeRepo.save(entity);
    await this.syncServiceLink(saved);
    const refreshed = await this.testTypeRepo.findOne({
      where: { id: saved.id },
      relations: { service: { category: true }, clinicDiagnosticCode: true },
    });
    return this.mapTestType(refreshed ?? saved, inherited.department);
  }

  async updateTestType(
    businessId: string,
    testTypeId: string,
    dto: UpdateClinicTestTypeDto,
    role: string,
  ): Promise<ClinicTestTypeView> {
    await this.assertCatalogEnabled(businessId);
    this.assertCatalogMutationRole(role);

    const entity = await this.testTypeRepo.findOne({
      where: { id: testTypeId, businessId },
      relations: { service: { category: true } },
    });
    if (!entity) throw new NotFoundException('Clinic test type not found');

    const previousServiceId = entity.serviceId;
    if (dto.code !== undefined) {
      const code = dto.code.trim();
      const duplicate = await this.testTypeRepo.findOne({
        where: { businessId, code },
      });
      if (duplicate && duplicate.id !== entity.id) {
        throw new BadRequestException(
          `Test type code "${code}" already exists`,
        );
      }
      entity.code = code;
    }
    if (dto.title !== undefined) entity.title = dto.title.trim();
    if (dto.abbreviation !== undefined) {
      entity.abbreviation = dto.abbreviation?.trim() || null;
    }
    if (dto.description !== undefined) {
      entity.description = dto.description?.trim() || null;
    }
    if (dto.unit !== undefined) entity.unit = dto.unit?.trim() || null;
    if (dto.normalLow !== undefined) {
      entity.normalLow = parseClinicReferenceRangeBound(dto.normalLow);
    }
    if (dto.normalHigh !== undefined) {
      entity.normalHigh = parseClinicReferenceRangeBound(dto.normalHigh);
    }
    if (dto.normalLow !== undefined || dto.normalHigh !== undefined) {
      const rangeError = assertClinicReferenceRangeBounds(
        entity.normalLow ?? null,
        entity.normalHigh ?? null,
      );
      if (rangeError) {
        throw new BadRequestException(rangeError);
      }
    }
    if (dto.price !== undefined) entity.price = dto.price;
    if (dto.requiresFasting !== undefined) {
      entity.requiresFasting = dto.requiresFasting;
    }
    if (dto.preparationNotes !== undefined) {
      entity.preparationNotes = dto.preparationNotes?.trim() || null;
    }
    if (dto.isActive !== undefined) entity.isActive = dto.isActive;
    if (dto.serviceId !== undefined) {
      await this.loadServiceLink(businessId, dto.serviceId);
      entity.serviceId = dto.serviceId;
    }
    if (dto.clinicDiagnosticCodeId !== undefined) {
      entity.clinicDiagnosticCodeId =
        (await this.resolveTestTypeDiagnosticCodeId(
          businessId,
          dto.clinicDiagnosticCodeId,
        )) ?? null;
    }

    const saved = await this.testTypeRepo.save(entity);
    await this.syncServiceLink(saved, previousServiceId);

    const refreshed = await this.testTypeRepo.findOne({
      where: { id: saved.id },
      relations: { service: { category: true }, clinicDiagnosticCode: true },
    });
    return this.mapTestType(
      refreshed!,
      resolveClinicalDepartmentLabel(refreshed?.service?.category?.name),
    );
  }

  async deactivateTestType(
    businessId: string,
    testTypeId: string,
    role: string,
  ): Promise<ClinicTestTypeView> {
    return this.updateTestType(
      businessId,
      testTypeId,
      { isActive: false, serviceId: null },
      role,
    );
  }

  private async findTestTypeByMeasurementCode(
    businessId: string,
    measurementCode: string,
  ): Promise<ClinicTestType | null> {
    const normalized = measurementCode.trim().toLowerCase();
    if (!normalized) return null;
    return this.testTypeRepo
      .createQueryBuilder('testType')
      .where('testType.business_id = :businessId', { businessId })
      .andWhere(
        '(LOWER(testType.code) = :normalized OR LOWER(testType.abbreviation) = :normalized)',
        { normalized },
      )
      .getOne();
  }

  async updateReferenceRangeByCode(
    businessId: string,
    measurementCode: string,
    normalLowInput: unknown,
    normalHighInput: unknown,
    role: string,
  ): Promise<ClinicTestTypeView> {
    await this.assertCatalogEnabled(businessId);
    this.assertCatalogMutationRole(role);

    const code = measurementCode.trim();
    if (!code) {
      throw new BadRequestException('measurementCode is required');
    }

    const normalLow = parseClinicReferenceRangeBound(normalLowInput);
    const normalHigh = parseClinicReferenceRangeBound(normalHighInput);
    const rangeError = assertClinicReferenceRangeBounds(normalLow, normalHigh);
    if (rangeError) {
      throw new BadRequestException(rangeError);
    }

    const entity = await this.findTestTypeByMeasurementCode(businessId, code);
    if (!entity) {
      throw new NotFoundException(
        `Clinic test type not found for measurement code "${code}"`,
      );
    }

    entity.normalLow = normalLow;
    entity.normalHigh = normalHigh;
    const saved = await this.testTypeRepo.save(entity);
    const refreshed = await this.testTypeRepo.findOne({
      where: { id: saved.id },
      relations: { service: { category: true }, clinicDiagnosticCode: true },
    });
    return this.mapTestType(
      refreshed ?? saved,
      resolveClinicalDepartmentLabel(refreshed?.service?.category?.name),
    );
  }

  async listPanels(businessId: string): Promise<ClinicTestPanelView[]> {
    await this.assertCatalogEnabled(businessId);
    const panels = await this.testPanelRepo.find({
      where: { businessId },
      relations: { items: { testType: true } },
      order: { title: 'ASC' },
    });
    return panels.map((panel) => this.mapPanel(panel));
  }

  private mapPanel(panel: ClinicTestPanel): ClinicTestPanelView {
    return {
      id: panel.id,
      businessId: panel.businessId,
      code: panel.code,
      title: panel.title,
      abbreviation: panel.abbreviation ?? null,
      description: panel.description ?? null,
      price: Number(panel.price),
      isActive: panel.isActive,
      items: (panel.items ?? [])
        .slice()
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map((item) => ({
          id: item.id,
          testTypeId: item.testTypeId,
          sortOrder: item.sortOrder,
          testType: item.testType
            ? {
                id: item.testType.id,
                title: item.testType.title,
                code: item.testType.code,
              }
            : undefined,
        })),
      createdAt: panel.createdAt,
      updatedAt: panel.updatedAt,
    };
  }

  async createPanel(
    businessId: string,
    dto: CreateClinicTestPanelDto,
    role: string,
  ): Promise<ClinicTestPanelView> {
    await this.assertCatalogEnabled(businessId);
    this.assertCatalogMutationRole(role);

    const code = buildClinicTestTypeCode({ code: dto.code, title: dto.title });
    const duplicate = await this.testPanelRepo.findOne({
      where: { businessId, code },
    });
    if (duplicate) {
      throw new BadRequestException(`Test panel code "${code}" already exists`);
    }

    const saved = await this.testPanelRepo.save(
      this.testPanelRepo.create({
        businessId,
        code,
        title: dto.title.trim(),
        abbreviation: dto.abbreviation?.trim() || null,
        description: dto.description?.trim() || null,
        price: dto.price ?? 0,
        isActive: true,
      }),
    );
    return this.mapPanel(saved);
  }

  async updatePanel(
    businessId: string,
    panelId: string,
    dto: UpdateClinicTestPanelDto,
    role: string,
  ): Promise<ClinicTestPanelView> {
    await this.assertCatalogEnabled(businessId);
    this.assertCatalogMutationRole(role);

    const panel = await this.testPanelRepo.findOne({
      where: { id: panelId, businessId },
      relations: { items: { testType: true } },
    });
    if (!panel) throw new NotFoundException('Clinic test panel not found');

    if (dto.code !== undefined) {
      const code = dto.code.trim();
      const duplicate = await this.testPanelRepo.findOne({
        where: { businessId, code },
      });
      if (duplicate && duplicate.id !== panel.id) {
        throw new BadRequestException(
          `Test panel code "${code}" already exists`,
        );
      }
      panel.code = code;
    }
    if (dto.title !== undefined) panel.title = dto.title.trim();
    if (dto.abbreviation !== undefined) {
      panel.abbreviation = dto.abbreviation?.trim() || null;
    }
    if (dto.description !== undefined) {
      panel.description = dto.description?.trim() || null;
    }
    if (dto.price !== undefined) panel.price = dto.price;
    if (dto.isActive !== undefined) panel.isActive = dto.isActive;

    const saved = await this.testPanelRepo.save(panel);
    return this.mapPanel(saved);
  }

  async upsertPanelItems(
    businessId: string,
    panelId: string,
    dto: UpsertClinicTestPanelItemsDto,
    role: string,
  ): Promise<ClinicTestPanelView> {
    await this.assertCatalogEnabled(businessId);
    this.assertCatalogMutationRole(role);

    const panel = await this.testPanelRepo.findOne({
      where: { id: panelId, businessId },
    });
    if (!panel) throw new NotFoundException('Clinic test panel not found');

    const testTypeIds = dto.items.map((item) => item.testTypeId);
    const testTypes = await this.testTypeRepo.find({
      where: { id: In(testTypeIds), businessId },
    });
    if (testTypes.length !== testTypeIds.length) {
      throw new BadRequestException(
        'One or more panel test types were not found',
      );
    }

    await this.panelItemRepo.delete({ panelId });
    await this.panelItemRepo.save(
      dto.items.map((item, index) =>
        this.panelItemRepo.create({
          panelId,
          testTypeId: item.testTypeId,
          sortOrder: item.sortOrder ?? index,
        }),
      ),
    );

    const refreshed = await this.testPanelRepo.findOne({
      where: { id: panelId },
      relations: { items: { testType: true } },
    });
    return this.mapPanel(refreshed!);
  }

  private async listLabServicesForBusiness(
    businessId: string,
  ): Promise<Service[]> {
    return this.serviceRepo.find({
      where: { businessId },
      relations: { category: true },
      order: { name: 'ASC' },
    });
  }

  private isLabTestService(service: Service): boolean {
    const clinic = extractClinicMetadata(service.metadata);
    return clinic?.serviceType === 'lab_test';
  }

  private findExistingTestType(
    existing: ClinicTestType[],
    title: string,
    code?: string,
  ): ClinicTestType | undefined {
    const normalizedTitle = normalizeCatalogMatchKey(title);
    const normalizedCode = code?.trim().toLowerCase();
    return existing.find((row) => {
      if (normalizedCode && row.code?.toLowerCase() === normalizedCode)
        return true;
      return normalizeCatalogMatchKey(row.title) === normalizedTitle;
    });
  }

  private findExistingPanel(
    existing: ClinicTestPanel[],
    title: string,
    code?: string,
  ): ClinicTestPanel | undefined {
    const normalizedTitle = normalizeCatalogMatchKey(title);
    const normalizedCode = code?.trim().toLowerCase();
    return existing.find((row) => {
      if (normalizedCode && row.code?.toLowerCase() === normalizedCode)
        return true;
      return normalizeCatalogMatchKey(row.title) === normalizedTitle;
    });
  }

  private resolveTestTypeIdsForPanelItems(
    testTypes: ClinicTestType[],
    panelItems: string[] | undefined,
  ): string[] {
    if (!panelItems?.length) return [];
    return panelItems
      .map((item) => {
        const normalized = normalizeCatalogMatchKey(item);
        const byCode = testTypes.find(
          (type) => type.code.toLowerCase() === item.trim().toLowerCase(),
        );
        if (byCode) return byCode.id;
        const byTitle = testTypes.find(
          (type) => normalizeCatalogMatchKey(type.title) === normalized,
        );
        return byTitle?.id ?? null;
      })
      .filter((id): id is string => !!id);
  }

  async seedFromPlaybook(
    businessId: string,
    role: string,
  ): Promise<ClinicCatalogImportSummary> {
    await this.assertCatalogEnabled(businessId);
    this.assertCatalogMutationRole(role);

    const business = await this.businessService.findOne(businessId);
    const businessType =
      (business.settings?.businessType as string | undefined) ?? 'clinic';
    const playbook = getVerticalPlaybook(businessType);
    const labTestDrafts = extractPlaybookLabTestDrafts(playbook);
    const panelDrafts = buildPlaybookCategoryPanelDrafts(playbook);
    const services = await this.listLabServicesForBusiness(businessId);
    const labServices = services.filter((service) =>
      this.isLabTestService(service),
    );

    const existingTypes = await this.testTypeRepo.find({
      where: { businessId },
    });
    const existingPanels = await this.testPanelRepo.find({
      where: { businessId },
    });

    const summary: ClinicCatalogImportSummary = {
      testTypesCreated: 0,
      testTypesSkipped: 0,
      panelsCreated: 0,
      panelsSkipped: 0,
      unmatchedServiceNames: [],
      csvErrors: [],
    };

    for (const draft of labTestDrafts) {
      const code = buildClinicTestTypeCode({ title: draft.name });
      if (this.findExistingTestType(existingTypes, draft.name, code)) {
        summary.testTypesSkipped += 1;
        continue;
      }

      const matchedService = matchServiceByName(labServices, draft.name);
      if (!matchedService) {
        summary.unmatchedServiceNames.push(draft.name);
      }

      const created = await this.createTestType(
        businessId,
        {
          title: draft.name,
          code,
          description: draft.description ?? undefined,
          price: draft.price,
          requiresFasting: draft.requiresFasting,
          preparationNotes: draft.preparationNotes ?? undefined,
          serviceId: matchedService?.id,
        },
        role,
      );
      existingTypes.push({
        id: created.id,
        businessId,
        code: created.code,
        title: created.title,
        isActive: true,
      } as ClinicTestType);
      summary.testTypesCreated += 1;
    }

    for (const draft of panelDrafts) {
      if (this.findExistingPanel(existingPanels, draft.title, draft.code)) {
        summary.panelsSkipped += 1;
        continue;
      }

      const testTypeIds = draft.testNames
        .map((name) => {
          const match = this.findExistingTestType(existingTypes, name);
          return match?.id ?? null;
        })
        .filter((id): id is string => !!id);

      if (testTypeIds.length < 2) {
        summary.panelsSkipped += 1;
        continue;
      }

      const panel = await this.createPanel(
        businessId,
        { title: draft.title, code: draft.code },
        role,
      );
      await this.upsertPanelItems(
        businessId,
        panel.id,
        {
          items: testTypeIds.map((testTypeId, index) => ({
            testTypeId,
            sortOrder: index,
          })),
        },
        role,
      );
      existingPanels.push({
        id: panel.id,
        businessId,
        code: panel.code,
        title: panel.title,
        isActive: true,
      } as ClinicTestPanel);
      summary.panelsCreated += 1;
    }

    return summary;
  }

  async importFromCsv(
    businessId: string,
    csv: string,
    role: string,
  ): Promise<ClinicCatalogImportSummary> {
    await this.assertCatalogEnabled(businessId);
    this.assertCatalogMutationRole(role);

    const parsed = parseClinicTestCatalogCsv(csv);
    if (parsed.errors.length > 0) {
      throw new BadRequestException(parsed.errors.join('; '));
    }
    if (parsed.rows.length === 0) {
      throw new BadRequestException('CSV contains no import rows');
    }

    const services = await this.listLabServicesForBusiness(businessId);
    const labServices = services.filter((service) =>
      this.isLabTestService(service),
    );
    const existingTypes = await this.testTypeRepo.find({
      where: { businessId },
    });
    const existingPanels = await this.testPanelRepo.find({
      where: { businessId },
    });

    const summary: ClinicCatalogImportSummary = {
      testTypesCreated: 0,
      testTypesSkipped: 0,
      panelsCreated: 0,
      panelsSkipped: 0,
      unmatchedServiceNames: [],
      csvErrors: [],
    };

    for (const row of parsed.rows.filter((entry) => entry.kind === 'type')) {
      const code = buildClinicTestTypeCode({
        code: row.code,
        title: row.title,
      });
      if (this.findExistingTestType(existingTypes, row.title, code)) {
        summary.testTypesSkipped += 1;
        continue;
      }

      let matchedService = null as Service | null;
      if (row.serviceName) {
        matchedService = matchServiceByName(labServices, row.serviceName);
        if (!matchedService) {
          summary.unmatchedServiceNames.push(row.serviceName);
        }
      }

      const created = await this.createTestType(
        businessId,
        {
          title: row.title,
          code,
          abbreviation: row.abbreviation ?? undefined,
          description: row.description ?? undefined,
          unit: row.unit ?? undefined,
          price: row.price,
          requiresFasting: row.requiresFasting,
          preparationNotes: row.preparationNotes ?? undefined,
          serviceId: matchedService?.id,
        },
        role,
      );
      existingTypes.push({
        id: created.id,
        businessId,
        code: created.code,
        title: created.title,
        isActive: true,
      } as ClinicTestType);
      summary.testTypesCreated += 1;
    }

    for (const row of parsed.rows.filter((entry) => entry.kind === 'panel')) {
      const code = buildClinicTestTypeCode({
        code: row.code,
        title: row.title,
      });
      if (this.findExistingPanel(existingPanels, row.title, code)) {
        summary.panelsSkipped += 1;
        continue;
      }

      const testTypeIds = this.resolveTestTypeIdsForPanelItems(
        existingTypes,
        row.panelItems,
      );
      if (testTypeIds.length === 0) {
        summary.panelsSkipped += 1;
        continue;
      }

      const panel = await this.createPanel(
        businessId,
        {
          title: row.title,
          code,
          description: row.description ?? undefined,
          price: row.price,
        },
        role,
      );
      await this.upsertPanelItems(
        businessId,
        panel.id,
        {
          items: testTypeIds.map((testTypeId, index) => ({
            testTypeId,
            sortOrder: index,
          })),
        },
        role,
      );
      existingPanels.push({
        id: panel.id,
        businessId,
        code: panel.code,
        title: panel.title,
        isActive: true,
      } as ClinicTestPanel);
      summary.panelsCreated += 1;
    }

    return summary;
  }
}
