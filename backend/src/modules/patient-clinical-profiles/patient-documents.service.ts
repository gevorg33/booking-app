import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  PATIENT_DOCUMENT_CATEGORIES,
  type PatientDocumentCategory,
  normalizePatientDocumentCategoryFilter,
} from '../../common/utils/patient-document-category.util.js';
import {
  canCustomerAccessReleasedDocument,
  type PatientReleasedDocumentCustomerView,
} from '../../common/utils/patient-customer-document-access.util.js';
import { Booking } from '../booking/entities/booking.entity.js';
import { BusinessService } from '../business/business.service.js';
import {
  assertClinicLabFeaturesEnabled,
  readBusinessTypeFromSettings,
} from '../clinic-test-results/shared/clinic-test-results-gate.util.js';
import { UploadService } from '../upload/upload.service.js';
import type { CreatePatientDocumentDto } from './dto/create-patient-document.dto.js';
import { PatientChartDocument } from './entities/patient-chart-document.entity.js';
import type { PatientClinicalProfileAccessContext } from './shared/patient-clinical-profile-access.service.js';
import { PatientClinicalProfileAccessService } from './shared/patient-clinical-profile-access.service.js';
import { PatientDocumentPhiService } from './shared/patient-document-phi.service.js';

export interface PatientChartDocumentView {
  id: string;
  category: PatientDocumentCategory;
  title: string | null;
  originalFileName: string | null;
  mimeType: string;
  fileSizeBytes: number;
  downloadUrl: string | null;
  bookingId: string | null;
  uploadedByEmployeeId: string | null;
  uploadedByName: string | null;
  releasedToPatient: boolean;
  createdAt: string;
  phiMasked?: boolean;
}

export interface PatientChartDocumentsListView {
  documents: PatientChartDocumentView[];
  categories: readonly PatientDocumentCategory[];
  canUpload: boolean;
}

@Injectable()
export class PatientDocumentsService {
  constructor(
    @InjectRepository(PatientChartDocument)
    private readonly documentRepo: Repository<PatientChartDocument>,
    @InjectRepository(Booking)
    private readonly bookingRepo: Repository<Booking>,
    private readonly businessService: BusinessService,
    private readonly accessService: PatientClinicalProfileAccessService,
    private readonly phiService: PatientDocumentPhiService,
    private readonly uploadService: UploadService,
  ) {}

  private async assertEnabled(businessId: string): Promise<void> {
    const business = await this.businessService.findOne(businessId);
    assertClinicLabFeaturesEnabled(
      readBusinessTypeFromSettings(
        business.settings as Record<string, unknown> | undefined,
      ),
    );
  }

  private documentHasPhiMetadata(
    document: Pick<PatientChartDocument, 'title' | 'originalFileName'>,
  ): boolean {
    return !!(document.title?.trim() || document.originalFileName?.trim());
  }

  private async mapDocumentView(
    document: PatientChartDocument,
    access: PatientClinicalProfileAccessContext,
  ): Promise<PatientChartDocumentView> {
    const business = await this.businessService.findOne(document.businessId);
    const decrypted = await this.phiService.decryptDocumentForStaff(
      business,
      document,
      this.accessService.toPhiStaffContext(access.ctx),
      access.phiAccess,
    );
    const hadPhi = this.documentHasPhiMetadata(document);
    const phiMasked =
      hadPhi &&
      !this.documentHasPhiMetadata({
        title: decrypted.title ?? null,
        originalFileName: decrypted.originalFileName ?? null,
      });

    return {
      id: document.id,
      category: document.category,
      title: decrypted.title ?? null,
      originalFileName: decrypted.originalFileName ?? null,
      mimeType: document.mimeType,
      fileSizeBytes: document.fileSizeBytes,
      downloadUrl: phiMasked ? null : document.storageUrl,
      bookingId: document.bookingId,
      uploadedByEmployeeId: document.uploadedByEmployeeId,
      uploadedByName: document.uploadedBy?.name ?? null,
      releasedToPatient: document.releasedToPatient,
      createdAt: document.createdAt.toISOString(),
      ...(phiMasked ? { phiMasked: true } : {}),
    };
  }

  async listDocumentsForCustomer(
    businessId: string,
    customerId: string,
    access: PatientClinicalProfileAccessContext,
    categoryFilter?: string | null,
  ): Promise<PatientChartDocumentsListView> {
    await this.assertEnabled(businessId);

    const normalizedCategory =
      normalizePatientDocumentCategoryFilter(categoryFilter);
    const where: Record<string, unknown> = { businessId, customerId };
    if (normalizedCategory) where.category = normalizedCategory;

    const documents = await this.documentRepo.find({
      where,
      relations: { uploadedBy: true },
      order: { createdAt: 'DESC' },
      take: 100,
    });

    const mapped: PatientChartDocumentView[] = [];
    for (const document of documents) {
      mapped.push(await this.mapDocumentView(document, access));
    }

    return {
      documents: mapped,
      categories: PATIENT_DOCUMENT_CATEGORIES,
      canUpload: true,
    };
  }

  async getDocumentForCustomer(
    businessId: string,
    customerId: string,
    documentId: string,
    access: PatientClinicalProfileAccessContext,
  ): Promise<PatientChartDocumentView> {
    await this.assertEnabled(businessId);

    const document = await this.documentRepo.findOne({
      where: { id: documentId, businessId, customerId },
      relations: { uploadedBy: true },
    });
    if (!document) {
      throw new NotFoundException('Document not found');
    }

    return this.mapDocumentView(document, access);
  }

  async uploadDocumentForCustomer(
    businessId: string,
    customerId: string,
    access: PatientClinicalProfileAccessContext,
    dto: CreatePatientDocumentDto,
    file: Express.Multer.File,
  ): Promise<PatientChartDocumentView> {
    await this.assertEnabled(businessId);

    if (dto.bookingId) {
      const booking = await this.bookingRepo.findOne({
        where: { id: dto.bookingId, businessId, customerId },
        select: { id: true },
      });
      if (!booking) {
        throw new BadRequestException('Booking not found for this patient');
      }
    }

    const uploaded = await this.uploadService.uploadPatientChartDocument(
      file,
      businessId,
      customerId,
    );

    const business = await this.businessService.findOne(businessId);
    let document = this.documentRepo.create({
      businessId,
      customerId,
      category: dto.category,
      title: dto.title?.trim() || null,
      originalFileName: file.originalname,
      mimeType: uploaded.mimeType,
      fileSizeBytes: uploaded.bytes,
      storagePublicId: uploaded.publicId,
      storageUrl: uploaded.url,
      bookingId: dto.bookingId ?? null,
      uploadedByEmployeeId: access.ctx.employeeId,
      releasedToPatient: false,
    });

    const encrypted = await this.phiService.encryptDocumentForStorage(
      business,
      { ...document, id: document.id ?? '', businessId },
    );
    Object.assign(document, encrypted);
    document = await this.documentRepo.save(document);

    await this.phiService.auditDocumentPhiWrite(
      business,
      document,
      this.accessService.toPhiStaffContext(access.ctx),
    );

    const withUploader = await this.documentRepo.findOne({
      where: { id: document.id },
      relations: { uploadedBy: true },
    });
    if (!withUploader) {
      throw new NotFoundException('Document not found after upload');
    }

    return this.mapDocumentView(withUploader, access);
  }

  private async mapReleasedDocumentForCustomer(
    document: PatientChartDocument,
    customerUserId: string,
  ): Promise<PatientReleasedDocumentCustomerView> {
    const business = await this.businessService.findOne(document.businessId);
    const decrypted = await this.phiService.decryptDocumentForCustomer(
      business,
      document,
      customerUserId,
    );

    return {
      id: document.id,
      category: document.category,
      title: decrypted.title ?? null,
      originalFileName: decrypted.originalFileName ?? null,
      mimeType: document.mimeType,
      fileSizeBytes: document.fileSizeBytes,
      downloadUrl: document.storageUrl,
      createdAt: document.createdAt.toISOString(),
    };
  }

  async listReleasedDocumentsForCustomerAccount(
    businessId: string,
    customerId: string,
    customerUserId: string,
    categoryFilter?: string | null,
  ): Promise<PatientReleasedDocumentCustomerView[]> {
    await this.assertEnabled(businessId);

    const normalizedCategory =
      normalizePatientDocumentCategoryFilter(categoryFilter);
    const where: Record<string, unknown> = {
      businessId,
      customerId,
      releasedToPatient: true,
    };
    if (normalizedCategory) where.category = normalizedCategory;

    const documents = await this.documentRepo.find({
      where,
      order: { createdAt: 'DESC' },
      take: 100,
    });

    const mapped: PatientReleasedDocumentCustomerView[] = [];
    for (const document of documents) {
      if (
        !canCustomerAccessReleasedDocument({
          customerId: document.customerId,
          releasedToPatient: document.releasedToPatient,
          requestCustomerId: customerId,
        })
      ) {
        continue;
      }
      mapped.push(
        await this.mapReleasedDocumentForCustomer(document, customerUserId),
      );
    }
    return mapped;
  }

  async getReleasedDocumentForCustomerAccount(
    businessId: string,
    customerId: string,
    documentId: string,
    customerUserId: string,
  ): Promise<PatientReleasedDocumentCustomerView> {
    await this.assertEnabled(businessId);

    const document = await this.documentRepo.findOne({
      where: {
        id: documentId,
        businessId,
        customerId,
        releasedToPatient: true,
      },
    });
    if (
      !document ||
      !canCustomerAccessReleasedDocument({
        customerId: document.customerId,
        releasedToPatient: document.releasedToPatient,
        requestCustomerId: customerId,
      })
    ) {
      throw new NotFoundException('Document not found');
    }

    return this.mapReleasedDocumentForCustomer(document, customerUserId);
  }

  async updateDocumentReleaseForCustomer(
    businessId: string,
    customerId: string,
    documentId: string,
    access: PatientClinicalProfileAccessContext,
    releasedToPatient: boolean,
  ): Promise<PatientChartDocumentView> {
    await this.assertEnabled(businessId);

    const document = await this.documentRepo.findOne({
      where: { id: documentId, businessId, customerId },
      relations: { uploadedBy: true },
    });
    if (!document) {
      throw new NotFoundException('Document not found');
    }

    document.releasedToPatient = releasedToPatient;
    const saved = await this.documentRepo.save(document);
    return this.mapDocumentView(saved, access);
  }
}
