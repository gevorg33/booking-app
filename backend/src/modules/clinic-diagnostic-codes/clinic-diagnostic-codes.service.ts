import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository } from 'typeorm';
import {
  canListClinicDiagnosticCodes,
  canManageClinicDiagnosticCodes,
} from '../../common/utils/clinic-diagnostic-code-access.util.js';
import type {
  ClinicDiagnosticCodeListResponse,
  ClinicDiagnosticCodeSummary,
  ClinicDiagnosticCodeView,
} from '../../common/utils/clinic-diagnostic-code.types.js';
import {
  assertAllowedClinicDiagnosticCodeKind,
  assertAllowedClinicDiagnosticCodeSystem,
  buildClinicDiagnosticCodeSearchDescription,
  CLINIC_DIAGNOSTIC_CODE_LIST_DEFAULT_PAGE_SIZE,
  CLINIC_DIAGNOSTIC_CODE_SEARCH_MIN_LENGTH,
  normalizeClinicDiagnosticCode,
  normalizeClinicDiagnosticCodeDescription,
} from '../../common/utils/clinic-diagnostic-code.util.js';
import type { ClinicLabStaffContext } from '../../common/utils/clinic-lab-access.util.js';
import { BusinessService } from '../business/business.service.js';
import { Employee } from '../employee/entities/employee.entity.js';
import {
  assertClinicLabFeaturesEnabled,
  readBusinessTypeFromSettings,
} from '../clinic-test-results/shared/clinic-test-results-gate.util.js';
import {
  mapClinicDiagnosticCodeSummary,
  mapClinicDiagnosticCodeView,
} from './clinic-diagnostic-code-map.util.js';
import type {
  CreateClinicDiagnosticCodeDto,
  ListClinicDiagnosticCodesQueryDto,
  UpdateClinicDiagnosticCodeDto,
} from './dto/clinic-diagnostic-code.dto.js';
import { ClinicDiagnosticCode } from './entities/clinic-diagnostic-code.entity.js';

@Injectable()
export class ClinicDiagnosticCodesService {
  constructor(
    @InjectRepository(ClinicDiagnosticCode)
    private readonly codeRepo: Repository<ClinicDiagnosticCode>,
    @InjectRepository(Employee)
    private readonly employeeRepo: Repository<Employee>,
    private readonly businessService: BusinessService,
  ) {}

  private async assertEnabled(businessId: string): Promise<void> {
    const business = await this.businessService.findOne(businessId);
    assertClinicLabFeaturesEnabled(
      readBusinessTypeFromSettings(
        business.settings as Record<string, unknown> | undefined,
      ),
    );
  }

  private async resolveStaffContext(
    businessId: string,
    userId: string,
  ): Promise<ClinicLabStaffContext> {
    const membership = await this.businessService.ensureMember(
      businessId,
      userId,
    );
    const employee = await this.employeeRepo.findOne({
      where: { businessId, userId, isActive: true },
      select: { id: true },
    });
    return {
      userId,
      membershipRole: membership.role,
      employeeId: employee?.id ?? null,
    };
  }

  private async assertListAccess(businessId: string, userId: string) {
    await this.assertEnabled(businessId);
    const ctx = await this.resolveStaffContext(businessId, userId);
    if (!canListClinicDiagnosticCodes(ctx)) {
      throw new ForbiddenException(
        'You do not have access to the clinic diagnostic code catalog',
      );
    }
    return ctx;
  }

  private async assertManageAccess(businessId: string, userId: string) {
    const ctx = await this.assertListAccess(businessId, userId);
    if (!canManageClinicDiagnosticCodes(ctx)) {
      throw new ForbiddenException(
        'You do not have permission to manage clinic diagnostic codes',
      );
    }
    return ctx;
  }

  private async resolveEmployeeId(
    businessId: string,
    userId: string,
  ): Promise<string | null> {
    const employee = await this.employeeRepo.findOne({
      where: { businessId, userId, isActive: true },
      select: { id: true },
    });
    return employee?.id ?? null;
  }

  private async loadCodeOrThrow(
    businessId: string,
    codeId: string,
  ): Promise<ClinicDiagnosticCode> {
    const code = await this.codeRepo.findOne({
      where: { id: codeId, businessId },
    });
    if (!code) {
      throw new NotFoundException('Clinic diagnostic code not found');
    }
    return code;
  }

  private normalizeCreateDto(dto: CreateClinicDiagnosticCodeDto) {
    let codeKind;
    let codeSystem;
    try {
      codeKind = assertAllowedClinicDiagnosticCodeKind(dto.codeKind);
      codeSystem = assertAllowedClinicDiagnosticCodeSystem(dto.codeSystem);
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error
          ? error.message
          : 'Invalid clinic diagnostic code',
      );
    }

    const code = normalizeClinicDiagnosticCode(dto.code);
    const description = normalizeClinicDiagnosticCodeDescription(
      dto.description,
    );
    if (!code) {
      throw new BadRequestException('Code is required');
    }
    if (!description) {
      throw new BadRequestException('Description is required');
    }

    const searchDescription = buildClinicDiagnosticCodeSearchDescription({
      code,
      description,
      searchDescription: dto.searchDescription,
    });

    return { codeKind, codeSystem, code, description, searchDescription };
  }

  async listClinicDiagnosticCodes(
    businessId: string,
    userId: string,
    query: ListClinicDiagnosticCodesQueryDto = {},
  ): Promise<ClinicDiagnosticCodeListResponse> {
    await this.assertListAccess(businessId, userId);

    const page = query.page && query.page > 0 ? query.page : 1;
    const pageSize =
      query.pageSize && query.pageSize > 0
        ? Math.min(query.pageSize, 100)
        : CLINIC_DIAGNOSTIC_CODE_LIST_DEFAULT_PAGE_SIZE;
    const search = query.q?.trim() ?? '';
    const activeOnly = query.activeOnly !== false;

    const qb = this.codeRepo
      .createQueryBuilder('code')
      .where('code.businessId = :businessId', { businessId });

    if (query.codeKind) {
      qb.andWhere('code.codeKind = :codeKind', { codeKind: query.codeKind });
    }
    if (query.codeSystem) {
      qb.andWhere('code.codeSystem = :codeSystem', {
        codeSystem: query.codeSystem,
      });
    }
    if (activeOnly) {
      qb.andWhere('code.isActive = :isActive', { isActive: true });
    }
    if (search.length >= CLINIC_DIAGNOSTIC_CODE_SEARCH_MIN_LENGTH) {
      qb.andWhere(
        new Brackets((sub) => {
          sub
            .where('UPPER(code.code) LIKE UPPER(:term)', {
              term: `%${search}%`,
            })
            .orWhere('LOWER(code.description) LIKE LOWER(:term)', {
              term: `%${search}%`,
            })
            .orWhere('LOWER(code.searchDescription) LIKE LOWER(:term)', {
              term: `%${search}%`,
            });
        }),
      );
    }

    qb.orderBy('code.codeKind', 'ASC')
      .addOrderBy('code.codeSystem', 'ASC')
      .addOrderBy('code.code', 'ASC')
      .skip((page - 1) * pageSize)
      .take(pageSize);

    const [codes, totalItems] = await qb.getManyAndCount();

    return {
      items: codes.map(mapClinicDiagnosticCodeView),
      totalItems,
      page,
      pageSize,
    };
  }

  async getClinicDiagnosticCode(
    businessId: string,
    userId: string,
    codeId: string,
  ): Promise<ClinicDiagnosticCodeView> {
    await this.assertListAccess(businessId, userId);
    const code = await this.loadCodeOrThrow(businessId, codeId);
    return mapClinicDiagnosticCodeView(code);
  }

  async createClinicDiagnosticCode(
    businessId: string,
    userId: string,
    dto: CreateClinicDiagnosticCodeDto,
  ): Promise<ClinicDiagnosticCodeView> {
    await this.assertManageAccess(businessId, userId);
    const employeeId = await this.resolveEmployeeId(businessId, userId);
    const normalized = this.normalizeCreateDto(dto);

    const existing = await this.codeRepo.findOne({
      where: {
        businessId,
        codeKind: normalized.codeKind,
        codeSystem: normalized.codeSystem,
        code: normalized.code,
      },
    });
    if (existing) {
      throw new ConflictException(
        'A catalog entry with this kind, system, and code already exists',
      );
    }

    const entity = this.codeRepo.create({
      businessId,
      ...normalized,
      isActive: true,
      createdByEmployeeId: employeeId,
      updatedByEmployeeId: employeeId,
    });
    const saved = await this.codeRepo.save(entity);
    return mapClinicDiagnosticCodeView(saved);
  }

  async updateClinicDiagnosticCode(
    businessId: string,
    userId: string,
    codeId: string,
    dto: UpdateClinicDiagnosticCodeDto,
  ): Promise<ClinicDiagnosticCodeView> {
    await this.assertManageAccess(businessId, userId);
    const employeeId = await this.resolveEmployeeId(businessId, userId);
    const code = await this.loadCodeOrThrow(businessId, codeId);

    if (dto.description !== undefined) {
      const description = normalizeClinicDiagnosticCodeDescription(
        dto.description,
      );
      if (!description) {
        throw new BadRequestException('Description is required');
      }
      code.description = description;
    }
    if (dto.searchDescription !== undefined || dto.description !== undefined) {
      code.searchDescription = buildClinicDiagnosticCodeSearchDescription({
        code: code.code,
        description: code.description,
        searchDescription: dto.searchDescription,
      });
    }
    if (dto.isActive !== undefined) {
      code.isActive = dto.isActive;
    }
    code.updatedByEmployeeId = employeeId;

    const saved = await this.codeRepo.save(code);
    return mapClinicDiagnosticCodeView(saved);
  }

  async resolveActiveClinicDiagnosticCode(
    businessId: string,
    codeId: string | null | undefined,
  ): Promise<ClinicDiagnosticCodeSummary | null> {
    if (!codeId?.trim()) return null;
    const code = await this.codeRepo.findOne({
      where: { id: codeId.trim(), businessId, isActive: true },
    });
    if (!code) {
      throw new NotFoundException('Clinic diagnostic code not found');
    }
    return mapClinicDiagnosticCodeSummary(code);
  }
}
