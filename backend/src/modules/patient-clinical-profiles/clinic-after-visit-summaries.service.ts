import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  canAuthorClinicAfterVisitSummary,
  canExportClinicAfterVisitSummaryPdf,
  canReleaseClinicAfterVisitSummary,
} from '../../common/utils/clinic-after-visit-summary-access.util.js';
import { buildClinicAfterVisitSummaryPdfHtmlFromBusinessSettings } from '../../common/utils/clinic-after-visit-summary-pdf.util.js';
import { getBusinessDefaultLocale } from '../../common/utils/business-locale.util.js';
import {
  clinicAfterVisitSummaryHasPhiContent,
  normalizeClinicAfterVisitSummaryDescription,
} from '../../common/utils/clinic-after-visit-summary.util.js';
import { isCompletedConsultationBooking } from '../../common/utils/patient-encounter-access.util.js';
import { Booking } from '../booking/entities/booking.entity.js';
import { BusinessService } from '../business/business.service.js';
import { Customer } from '../customer/entities/customer.entity.js';
import {
  assertClinicLabFeaturesEnabled,
  readBusinessTypeFromSettings,
} from '../clinic-test-results/shared/clinic-test-results-gate.util.js';
import type {
  UpdateClinicAfterVisitSummaryReleaseDto,
  UpsertClinicAfterVisitSummaryDto,
} from './dto/clinic-after-visit-summary.dto.js';
import { ClinicAfterVisitSummary } from './entities/clinic-after-visit-summary.entity.js';
import type { PatientClinicalProfileAccessContext } from './shared/patient-clinical-profile-access.service.js';
import { PatientClinicalProfileAccessService } from './shared/patient-clinical-profile-access.service.js';
import { ClinicAfterVisitSummaryPhiService } from './shared/clinic-after-visit-summary-phi.service.js';

export interface ClinicAfterVisitSummaryView {
  id: string;
  bookingId: string;
  description: string | null;
  authorEmployeeId: string | null;
  authorName: string | null;
  releasedToPatient: boolean;
  createdAt: string;
  updatedAt: string;
  phiMasked?: boolean;
  canAuthor: boolean;
  canRelease: boolean;
  canExportPdf: boolean;
}

@Injectable()
export class ClinicAfterVisitSummariesService {
  constructor(
    @InjectRepository(ClinicAfterVisitSummary)
    private readonly summaryRepo: Repository<ClinicAfterVisitSummary>,
    @InjectRepository(Booking)
    private readonly bookingRepo: Repository<Booking>,
    @InjectRepository(Customer)
    private readonly customerRepo: Repository<Customer>,
    private readonly businessService: BusinessService,
    private readonly accessService: PatientClinicalProfileAccessService,
    private readonly phiService: ClinicAfterVisitSummaryPhiService,
  ) {}

  private async assertEnabled(businessId: string) {
    const business = await this.businessService.findOne(businessId);
    assertClinicLabFeaturesEnabled(
      readBusinessTypeFromSettings(
        business.settings as Record<string, unknown> | undefined,
      ),
    );
    return business;
  }

  private toStaff(access: PatientClinicalProfileAccessContext) {
    return this.accessService.toPhiStaffContext(access.ctx);
  }

  private bookingTarget(booking: Booking) {
    return {
      status: booking.status,
      employeeId: booking.employeeId,
      linkedEmployeeIds: booking.linkedEmployeeIds,
      serviceMetadata: booking.service?.metadata as Record<
        string,
        unknown
      > | null,
    };
  }

  private async loadConsultationBookingOrThrow(
    businessId: string,
    customerId: string,
    bookingId: string,
  ): Promise<Booking> {
    const booking = await this.bookingRepo.findOne({
      where: { id: bookingId, businessId, customerId },
      relations: { service: true, employee: true },
    });
    if (!booking) {
      throw new NotFoundException('Booking not found');
    }
    const target = this.bookingTarget(booking);
    if (!isCompletedConsultationBooking(target)) {
      throw new BadRequestException(
        'After-visit summaries require a completed consultation appointment',
      );
    }
    return booking;
  }

  private async mapSummaryView(
    summary: ClinicAfterVisitSummary | null,
    booking: Booking,
    access: PatientClinicalProfileAccessContext,
  ): Promise<ClinicAfterVisitSummaryView | null> {
    const target = this.bookingTarget(booking);
    const canAuthor = canAuthorClinicAfterVisitSummary(access.ctx, target);
    const canRelease = canReleaseClinicAfterVisitSummary(access.ctx, target);
    const canExportPdf = canExportClinicAfterVisitSummaryPdf(
      access.ctx,
      target,
    );

    if (!summary) {
      return {
        id: '',
        bookingId: booking.id,
        description: null,
        authorEmployeeId: null,
        authorName: null,
        releasedToPatient: false,
        createdAt: '',
        updatedAt: '',
        canAuthor,
        canRelease,
        canExportPdf,
      };
    }

    const business = await this.businessService.findOne(summary.businessId);
    const decrypted = await this.phiService.decryptSummaryForStaff(
      business,
      summary,
      this.toStaff(access),
      access.phiAccess,
    );
    const hadPhi = clinicAfterVisitSummaryHasPhiContent(summary);
    const phiMasked =
      hadPhi &&
      !clinicAfterVisitSummaryHasPhiContent({
        description: decrypted.description,
      });

    return {
      id: summary.id,
      bookingId: summary.bookingId,
      description: decrypted.description ?? null,
      authorEmployeeId: summary.authorEmployeeId,
      authorName: summary.author?.name ?? null,
      releasedToPatient: summary.releasedToPatient,
      createdAt: summary.createdAt.toISOString(),
      updatedAt: summary.updatedAt.toISOString(),
      ...(phiMasked ? { phiMasked: true } : {}),
      canAuthor,
      canRelease,
      canExportPdf,
    };
  }

  async getSummaryByBooking(
    businessId: string,
    customerId: string,
    bookingId: string,
    access: PatientClinicalProfileAccessContext,
  ): Promise<ClinicAfterVisitSummaryView> {
    await this.assertEnabled(businessId);
    const booking = await this.loadConsultationBookingOrThrow(
      businessId,
      customerId,
      bookingId,
    );
    const summary = await this.summaryRepo.findOne({
      where: { businessId, bookingId },
      relations: { author: true },
    });
    const view = await this.mapSummaryView(summary, booking, access);
    return view!;
  }

  async upsertSummaryForBooking(
    businessId: string,
    customerId: string,
    bookingId: string,
    access: PatientClinicalProfileAccessContext,
    dto: UpsertClinicAfterVisitSummaryDto,
  ): Promise<ClinicAfterVisitSummaryView> {
    await this.assertEnabled(businessId);
    const booking = await this.loadConsultationBookingOrThrow(
      businessId,
      customerId,
      bookingId,
    );
    const target = this.bookingTarget(booking);
    if (!canAuthorClinicAfterVisitSummary(access.ctx, target)) {
      throw new ForbiddenException(
        'Only the assigned provider or clinic managers can author this after-visit summary',
      );
    }

    const business = await this.businessService.findOne(businessId);
    const description = normalizeClinicAfterVisitSummaryDescription(
      dto.description,
    );
    let summary = await this.summaryRepo.findOne({
      where: { businessId, bookingId },
      relations: { author: true },
    });
    const beforePhi = summary ? { description: summary.description } : null;

    if (!summary) {
      summary = this.summaryRepo.create({
        businessId,
        customerId,
        bookingId,
        authorEmployeeId: access.ctx.employeeId,
        description,
        releasedToPatient: false,
      });
    } else {
      summary.description = description;
      if (!summary.authorEmployeeId && access.ctx.employeeId) {
        summary.authorEmployeeId = access.ctx.employeeId;
      }
    }

    const encrypted = await this.phiService.encryptSummaryForStorage(business, {
      ...summary,
      id: summary.id ?? 'pending',
      businessId,
    });
    Object.assign(summary, encrypted);
    summary = await this.summaryRepo.save(summary);

    await this.phiService.auditSummaryPhiWrite(
      business,
      summary,
      beforePhi,
      this.toStaff(access),
    );

    const refreshed = await this.summaryRepo.findOne({
      where: { id: summary.id },
      relations: { author: true },
    });
    const view = await this.mapSummaryView(
      refreshed ?? summary,
      booking,
      access,
    );
    return view!;
  }

  async updateSummaryReleaseForBooking(
    businessId: string,
    customerId: string,
    bookingId: string,
    access: PatientClinicalProfileAccessContext,
    dto: UpdateClinicAfterVisitSummaryReleaseDto,
  ): Promise<ClinicAfterVisitSummaryView> {
    await this.assertEnabled(businessId);
    const booking = await this.loadConsultationBookingOrThrow(
      businessId,
      customerId,
      bookingId,
    );
    const target = this.bookingTarget(booking);
    if (!canReleaseClinicAfterVisitSummary(access.ctx, target)) {
      throw new ForbiddenException(
        'Only the assigned provider or clinic managers can release after-visit summaries',
      );
    }

    const summary = await this.summaryRepo.findOne({
      where: { businessId, bookingId },
      relations: { author: true },
    });
    if (!summary) {
      throw new NotFoundException('After-visit summary not found');
    }
    if (dto.releasedToPatient && !summary.description?.trim()) {
      throw new BadRequestException(
        'Author an after-visit summary before releasing it to the patient',
      );
    }

    summary.releasedToPatient = dto.releasedToPatient;
    const saved = await this.summaryRepo.save(summary);
    const view = await this.mapSummaryView(saved, booking, access);
    return view!;
  }

  async exportPdfHtmlForBooking(
    businessId: string,
    customerId: string,
    bookingId: string,
    access: PatientClinicalProfileAccessContext,
  ): Promise<string> {
    const business = await this.assertEnabled(businessId);
    const booking = await this.loadConsultationBookingOrThrow(
      businessId,
      customerId,
      bookingId,
    );
    const target = this.bookingTarget(booking);
    if (!canExportClinicAfterVisitSummaryPdf(access.ctx, target)) {
      throw new ForbiddenException(
        'You do not have access to export this after-visit summary',
      );
    }

    const summary = await this.summaryRepo.findOne({
      where: { businessId, bookingId },
    });
    if (!summary) {
      throw new NotFoundException('After-visit summary not found');
    }

    const decrypted = await this.phiService.decryptSummaryForStaff(
      business,
      summary,
      this.toStaff(access),
      access.phiAccess,
    );
    if (!decrypted.description?.trim()) {
      throw new BadRequestException(
        'After-visit summary has no content to export',
      );
    }

    const customer = await this.customerRepo.findOne({
      where: { id: customerId, businessId },
      select: { id: true, name: true },
    });
    if (!customer) {
      throw new NotFoundException('Patient not found');
    }

    const businessSettings = business.settings as
      | Record<string, unknown>
      | undefined;
    return buildClinicAfterVisitSummaryPdfHtmlFromBusinessSettings({
      businessName: business.name,
      businessSettings,
      locale: getBusinessDefaultLocale(businessSettings),
      patientName: customer.name,
      providerName: booking.employee?.name ?? null,
      serviceName: booking.service?.name ?? null,
      visitStart: booking.startTime,
      description: decrypted.description,
    });
  }
}
