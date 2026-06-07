import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository } from 'typeorm';
import { BusinessService } from '../business/business.service.js';
import { Employee } from '../employee/entities/employee.entity.js';
import {
  assertClinicLabFeaturesEnabled,
  readBusinessTypeFromSettings,
} from '../clinic-test-results/shared/clinic-test-results-gate.util.js';
import {
  canListExternalDoctorsRegistry,
  canManageExternalDoctorsRegistry,
} from '../../common/utils/external-doctor-access.util.js';
import type { ClinicLabStaffContext } from '../../common/utils/clinic-lab-access.util.js';
import type {
  CreateExternalDoctorDto,
  ListExternalDoctorsQueryDto,
  UpdateExternalDoctorDto,
} from './dto/external-doctor.dto.js';
import { ExternalDoctor } from './entities/external-doctor.entity.js';
import {
  EXTERNAL_DOCTOR_LIST_DEFAULT_PAGE_SIZE,
  mapExternalDoctorSummary,
  mapExternalDoctorView,
  type ExternalDoctorListResponse,
  type ExternalDoctorView,
} from './external-doctors.util.js';

@Injectable()
export class ExternalDoctorsService {
  constructor(
    @InjectRepository(ExternalDoctor)
    private readonly doctorRepo: Repository<ExternalDoctor>,
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
    if (!canListExternalDoctorsRegistry(ctx)) {
      throw new ForbiddenException(
        'You do not have access to the external doctors registry',
      );
    }
    return ctx;
  }

  private async assertManageAccess(businessId: string, userId: string) {
    const ctx = await this.assertListAccess(businessId, userId);
    if (!canManageExternalDoctorsRegistry(ctx)) {
      throw new ForbiddenException(
        'You do not have permission to manage external doctors',
      );
    }
    return ctx;
  }

  async listExternalDoctors(
    businessId: string,
    userId: string,
    query: ListExternalDoctorsQueryDto = {},
  ): Promise<ExternalDoctorListResponse> {
    await this.assertListAccess(businessId, userId);

    const page = query.page && query.page > 0 ? query.page : 1;
    const pageSize =
      query.pageSize && query.pageSize > 0
        ? Math.min(query.pageSize, 100)
        : EXTERNAL_DOCTOR_LIST_DEFAULT_PAGE_SIZE;
    const search = query.q?.trim() ?? '';
    const activeOnly = query.activeOnly !== false;

    const qb = this.doctorRepo
      .createQueryBuilder('doctor')
      .where('doctor.businessId = :businessId', { businessId });

    if (activeOnly) {
      qb.andWhere('doctor.isActive = :isActive', { isActive: true });
    }

    if (search.length >= 1) {
      qb.andWhere(
        new Brackets((sub) => {
          sub
            .where('LOWER(doctor.name) LIKE LOWER(:term)', {
              term: `%${search}%`,
            })
            .orWhere('LOWER(doctor.clinicName) LIKE LOWER(:term)', {
              term: `%${search}%`,
            })
            .orWhere('LOWER(doctor.specialty) LIKE LOWER(:term)', {
              term: `%${search}%`,
            });
        }),
      );
    }

    qb.orderBy('LOWER(doctor.name)', 'ASC')
      .skip((page - 1) * pageSize)
      .take(pageSize);

    const [doctors, totalItems] = await qb.getManyAndCount();

    return {
      items: doctors.map(mapExternalDoctorView),
      totalItems,
      page,
      pageSize,
    };
  }

  async createExternalDoctor(
    businessId: string,
    userId: string,
    dto: CreateExternalDoctorDto,
  ): Promise<ExternalDoctorView> {
    await this.assertManageAccess(businessId, userId);
    const employeeId = await this.resolveEmployeeId(businessId, userId);

    const doctor = this.doctorRepo.create({
      businessId,
      name: dto.name.trim(),
      clinicName: dto.clinicName?.trim() || null,
      specialty: dto.specialty?.trim() || null,
      street: dto.address.street.trim(),
      unit: dto.address.unit?.trim() || null,
      city: dto.address.city.trim(),
      province: dto.address.province.trim(),
      country: dto.address.country.trim(),
      postalCode: dto.address.postalCode.trim(),
      faxNumber: dto.fax?.trim() || null,
      phone: dto.phone?.trim() || null,
      email: dto.email?.trim() || null,
      isActive: true,
      createdByEmployeeId: employeeId,
      updatedByEmployeeId: employeeId,
    });

    const saved = await this.doctorRepo.save(doctor);
    return mapExternalDoctorView(saved);
  }

  async updateExternalDoctor(
    businessId: string,
    userId: string,
    doctorId: string,
    dto: UpdateExternalDoctorDto,
  ): Promise<ExternalDoctorView> {
    await this.assertManageAccess(businessId, userId);
    const employeeId = await this.resolveEmployeeId(businessId, userId);

    const doctor = await this.doctorRepo.findOne({
      where: { id: doctorId, businessId },
    });
    if (!doctor) {
      throw new NotFoundException('External doctor not found');
    }

    if (dto.name !== undefined) doctor.name = dto.name.trim();
    if (dto.clinicName !== undefined) {
      doctor.clinicName = dto.clinicName?.trim() || null;
    }
    if (dto.specialty !== undefined) {
      doctor.specialty = dto.specialty?.trim() || null;
    }
    if (dto.address) {
      doctor.street = dto.address.street.trim();
      doctor.unit = dto.address.unit?.trim() || null;
      doctor.city = dto.address.city.trim();
      doctor.province = dto.address.province.trim();
      doctor.country = dto.address.country.trim();
      doctor.postalCode = dto.address.postalCode.trim();
    }
    if (dto.fax !== undefined) doctor.faxNumber = dto.fax?.trim() || null;
    if (dto.phone !== undefined) doctor.phone = dto.phone?.trim() || null;
    if (dto.email !== undefined) doctor.email = dto.email?.trim() || null;
    if (dto.isActive !== undefined) doctor.isActive = dto.isActive;
    doctor.updatedByEmployeeId = employeeId;

    const saved = await this.doctorRepo.save(doctor);
    return mapExternalDoctorView(saved);
  }

  async getExternalDoctor(
    businessId: string,
    userId: string,
    doctorId: string,
  ): Promise<ExternalDoctorView> {
    await this.assertListAccess(businessId, userId);
    const doctor = await this.doctorRepo.findOne({
      where: { id: doctorId, businessId },
    });
    if (!doctor) {
      throw new NotFoundException('External doctor not found');
    }
    return mapExternalDoctorView(doctor);
  }

  async resolveActiveReferringDoctor(
    businessId: string,
    doctorId: string | null | undefined,
  ) {
    if (!doctorId?.trim()) return null;
    const doctor = await this.doctorRepo.findOne({
      where: { id: doctorId.trim(), businessId, isActive: true },
    });
    if (!doctor) {
      throw new NotFoundException('Referring external doctor not found');
    }
    return mapExternalDoctorSummary(doctor);
  }
}
