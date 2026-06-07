import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  assertAllowedClinicLabInfoType,
  assertAllowedClinicLabIntegrationVendorCode,
  assertAllowedClinicLabLocation,
  listExternalClinicLabInfo,
  normalizeClinicLabInfoName,
} from '../../common/utils/clinic-lab-info.util.js';
import {
  canAssignClinicLabMachine,
  canListClinicLabRegistry,
  canManageClinicLabRegistry,
} from '../../common/utils/clinic-lab-sync-access.util.js';
import {
  isValidClinicLabMachineName,
  normalizeClinicLabMachineName,
} from '../../common/utils/clinic-lab-machine.util.js';
import type { ClinicLabStaffContext } from '../../common/utils/clinic-lab-access.util.js';
import { BusinessService } from '../business/business.service.js';
import { Employee } from '../employee/entities/employee.entity.js';
import { ClinicSpecimen } from '../clinic-test-results/entities/clinic-specimen.entity.js';
import {
  assertClinicLabFeaturesEnabled,
  readBusinessTypeFromSettings,
} from '../clinic-test-results/shared/clinic-test-results-gate.util.js';
import {
  mapClinicLabInfoListItem,
  mapClinicLabInfoSummary,
  mapClinicLabMachineListItem,
  mapClinicLabMachineSummary,
} from './clinic-lis-map.util.js';
import type {
  AssignClinicLabMachineDto,
  CreateClinicLabInfoDto,
  CreateClinicLabMachineDto,
  UpdateClinicLabInfoDto,
  UpdateClinicLabMachineDto,
} from './dto/clinic-lis.dto.js';
import { ClinicLabInfo } from './entities/clinic-lab-info.entity.js';
import { ClinicLabMachine } from './entities/clinic-lab-machine.entity.js';

@Injectable()
export class ClinicLabRegistryService {
  constructor(
    @InjectRepository(ClinicLabInfo)
    private readonly labInfoRepo: Repository<ClinicLabInfo>,
    @InjectRepository(ClinicLabMachine)
    private readonly labMachineRepo: Repository<ClinicLabMachine>,
    @InjectRepository(ClinicSpecimen)
    private readonly specimenRepo: Repository<ClinicSpecimen>,
    @InjectRepository(Employee)
    private readonly employeeRepo: Repository<Employee>,
    private readonly businessService: BusinessService,
  ) {}

  private async assertEnabled(businessId: string) {
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
    if (!canListClinicLabRegistry(ctx)) {
      throw new ForbiddenException(
        'You do not have access to the clinic lab registry',
      );
    }
    return ctx;
  }

  private async assertManageAccess(businessId: string, userId: string) {
    const ctx = await this.assertListAccess(businessId, userId);
    if (!canManageClinicLabRegistry(ctx)) {
      throw new ForbiddenException(
        'You do not have permission to manage the clinic lab registry',
      );
    }
    return ctx;
  }

  async listLabInfo(businessId: string, userId: string) {
    await this.assertListAccess(businessId, userId);
    const labs = await this.labInfoRepo.find({
      where: { businessId },
      order: { name: 'ASC' },
    });
    return labs.map(mapClinicLabInfoSummary);
  }

  async listExternalLabs(businessId: string, userId: string) {
    await this.assertListAccess(businessId, userId);
    const labs = await this.labInfoRepo.find({
      where: { businessId, isActive: true },
      order: { name: 'ASC' },
    });
    return listExternalClinicLabInfo(labs).map(mapClinicLabInfoListItem);
  }

  async createLabInfo(
    businessId: string,
    userId: string,
    dto: CreateClinicLabInfoDto,
  ) {
    await this.assertManageAccess(businessId, userId);
    const labType = assertAllowedClinicLabInfoType(dto.labType);
    if (labType) {
      const existingInternal = await this.labInfoRepo.findOne({
        where: { businessId, labType },
      });
      if (existingInternal) {
        throw new ConflictException(
          'An internal lab is already registered for this business',
        );
      }
    }

    const saved = await this.labInfoRepo.save(
      this.labInfoRepo.create({
        businessId,
        name: normalizeClinicLabInfoName(dto.name),
        location: dto.location.trim(),
        phone: dto.phone.trim(),
        labLocation: assertAllowedClinicLabLocation(dto.labLocation),
        labType,
        integrationVendorCode: assertAllowedClinicLabIntegrationVendorCode(
          dto.integrationVendorCode,
        ),
        isActive: dto.isActive ?? true,
      }),
    );
    return mapClinicLabInfoSummary(saved);
  }

  async updateLabInfo(
    businessId: string,
    userId: string,
    labInfoId: string,
    dto: UpdateClinicLabInfoDto,
  ) {
    await this.assertManageAccess(businessId, userId);
    const lab = await this.labInfoRepo.findOne({
      where: { id: labInfoId, businessId },
    });
    if (!lab) throw new NotFoundException('Lab not found');

    if (dto.labType !== undefined) {
      const labType = assertAllowedClinicLabInfoType(dto.labType);
      if (labType && labType !== lab.labType) {
        const existingInternal = await this.labInfoRepo.findOne({
          where: { businessId, labType },
        });
        if (existingInternal && existingInternal.id !== lab.id) {
          throw new ConflictException(
            'An internal lab is already registered for this business',
          );
        }
      }
      lab.labType = labType;
    }

    if (dto.name != null) lab.name = normalizeClinicLabInfoName(dto.name);
    if (dto.location != null) lab.location = dto.location.trim();
    if (dto.phone != null) lab.phone = dto.phone.trim();
    if (dto.labLocation != null) {
      lab.labLocation = assertAllowedClinicLabLocation(dto.labLocation);
    }
    if (dto.integrationVendorCode !== undefined) {
      lab.integrationVendorCode = assertAllowedClinicLabIntegrationVendorCode(
        dto.integrationVendorCode,
      );
    }
    if (dto.isActive != null) lab.isActive = dto.isActive;

    return mapClinicLabInfoSummary(await this.labInfoRepo.save(lab));
  }

  async listLabMachines(businessId: string, userId: string) {
    await this.assertListAccess(businessId, userId);
    const machines = await this.labMachineRepo.find({
      where: { businessId },
      relations: { labInfo: true },
      order: { name: 'ASC' },
    });
    return machines.map((machine) => mapClinicLabMachineSummary(machine));
  }

  async listLabMachineOptions(businessId: string, userId: string) {
    await this.assertListAccess(businessId, userId);
    const machines = await this.labMachineRepo.find({
      where: { businessId, isActive: true },
      order: { name: 'ASC' },
    });
    return machines.map(mapClinicLabMachineListItem);
  }

  async createLabMachine(
    businessId: string,
    userId: string,
    dto: CreateClinicLabMachineDto,
  ) {
    await this.assertManageAccess(businessId, userId);
    if (!isValidClinicLabMachineName(dto.name)) {
      throw new BadRequestException('Invalid lab machine name');
    }
    if (dto.labInfoId) {
      const lab = await this.labInfoRepo.findOne({
        where: { id: dto.labInfoId, businessId },
      });
      if (!lab)
        throw new BadRequestException('Lab not found for machine assignment');
    }

    const saved = await this.labMachineRepo.save(
      this.labMachineRepo.create({
        businessId,
        name: normalizeClinicLabMachineName(dto.name),
        labInfoId: dto.labInfoId ?? null,
        isActive: dto.isActive ?? true,
      }),
    );
    return mapClinicLabMachineSummary(saved);
  }

  async updateLabMachine(
    businessId: string,
    userId: string,
    machineId: string,
    dto: UpdateClinicLabMachineDto,
  ) {
    await this.assertManageAccess(businessId, userId);
    const machine = await this.labMachineRepo.findOne({
      where: { id: machineId, businessId },
      relations: { labInfo: true },
    });
    if (!machine) throw new NotFoundException('Lab machine not found');

    if (dto.name != null) {
      if (!isValidClinicLabMachineName(dto.name)) {
        throw new BadRequestException('Invalid lab machine name');
      }
      machine.name = normalizeClinicLabMachineName(dto.name);
    }
    if (dto.labInfoId !== undefined) {
      if (dto.labInfoId) {
        const lab = await this.labInfoRepo.findOne({
          where: { id: dto.labInfoId, businessId },
        });
        if (!lab)
          throw new BadRequestException('Lab not found for machine assignment');
      }
      machine.labInfoId = dto.labInfoId;
    }
    if (dto.isActive != null) machine.isActive = dto.isActive;

    return mapClinicLabMachineSummary(await this.labMachineRepo.save(machine));
  }

  async assignLabMachineToSpecimen(
    businessId: string,
    userId: string,
    specimenId: string,
    dto: AssignClinicLabMachineDto,
  ) {
    const ctx = await this.assertManageAccess(businessId, userId);
    if (!canAssignClinicLabMachine(ctx)) {
      throw new ForbiddenException(
        'You do not have permission to assign lab machines',
      );
    }

    const specimen = await this.specimenRepo.findOne({
      where: { id: specimenId, businessId },
    });
    if (!specimen) throw new NotFoundException('Specimen not found');

    if (dto.labMachineId) {
      const machine = await this.labMachineRepo.findOne({
        where: { id: dto.labMachineId, businessId, isActive: true },
      });
      if (!machine)
        throw new BadRequestException('Active lab machine not found');
    }

    specimen.labMachineId = dto.labMachineId ?? null;
    const saved = await this.specimenRepo.save(specimen);
    return {
      specimenId: saved.id,
      labMachineId: saved.labMachineId,
    };
  }
}
