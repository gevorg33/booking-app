import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Booking, BookingStatus } from '../booking/entities/booking.entity.js';
import { BusinessService } from '../business/business.service.js';
import {
  assertClinicLabFeaturesEnabled,
  readBusinessTypeFromSettings,
} from '../clinic-test-results/shared/clinic-test-results-gate.util.js';
import {
  canAppendEncounterAddendum,
  canAuthorEncounterVisitNote,
  isCompletedConsultationBooking,
} from '../../common/utils/patient-encounter-access.util.js';
import { PatientEncounter } from './entities/patient-encounter.entity.js';
import { PatientEncounterAddendum } from './entities/patient-encounter-addendum.entity.js';
import type { UpsertPatientEncounterDto } from './dto/upsert-patient-encounter.dto.js';
import type { CreatePatientEncounterAddendumDto } from './dto/create-patient-encounter-addendum.dto.js';
import { PatientClinicalProfileAccessService } from './shared/patient-clinical-profile-access.service.js';
import type { PatientClinicalProfileAccessContext } from './shared/patient-clinical-profile-access.service.js';
import { PatientEncounterPhiService } from './shared/patient-encounter-phi.service.js';

export interface PatientEncounterAddendumView {
  id: string;
  body: string | null;
  authorEmployeeId: string | null;
  authorName: string | null;
  createdAt: string;
  phiMasked?: boolean;
}

export interface PatientEncounterListItemView {
  encounterId: string | null;
  bookingId: string;
  startTime: string;
  endTime: string;
  serviceName: string | null;
  providerName: string | null;
  visitNote: string | null;
  addendaCount: number;
  authorEmployeeId: string | null;
  authorName: string | null;
  authoredAt: string | null;
  updatedAt: string | null;
  phiMasked?: boolean;
  canAuthorVisitNote: boolean;
  canAddAddendum: boolean;
}

export interface PatientEncounterDetailView extends PatientEncounterListItemView {
  encounterId: string;
  addenda: PatientEncounterAddendumView[];
}

@Injectable()
export class PatientEncountersService {
  constructor(
    @InjectRepository(PatientEncounter)
    private readonly encounterRepo: Repository<PatientEncounter>,
    @InjectRepository(PatientEncounterAddendum)
    private readonly addendumRepo: Repository<PatientEncounterAddendum>,
    @InjectRepository(Booking)
    private readonly bookingRepo: Repository<Booking>,
    private readonly businessService: BusinessService,
    private readonly accessService: PatientClinicalProfileAccessService,
    private readonly phiService: PatientEncounterPhiService,
  ) {}

  private async assertEnabled(businessId: string): Promise<void> {
    const business = await this.businessService.findOne(businessId);
    assertClinicLabFeaturesEnabled(
      readBusinessTypeFromSettings(
        business.settings as Record<string, unknown> | undefined,
      ),
    );
  }

  private toStaff(access: PatientClinicalProfileAccessContext) {
    return this.accessService.toPhiStaffContext(access.ctx);
  }

  private encounterHasPhiContent(
    encounter: Pick<PatientEncounter, 'visitNote'>,
  ): boolean {
    return !!encounter.visitNote?.trim();
  }

  private addendumHasPhiContent(
    addendum: Pick<PatientEncounterAddendum, 'body'>,
  ): boolean {
    return !!addendum.body?.trim();
  }

  private async loadConsultationBookings(
    businessId: string,
    customerId: string,
  ): Promise<Booking[]> {
    const bookings = await this.bookingRepo.find({
      where: { businessId, customerId, status: BookingStatus.COMPLETED },
      relations: { service: true, employee: true },
      order: { startTime: 'DESC' },
      take: 100,
    });
    return bookings.filter((booking) =>
      isCompletedConsultationBooking({
        status: booking.status,
        employeeId: booking.employeeId,
        linkedEmployeeIds: booking.linkedEmployeeIds,
        serviceMetadata: booking.service?.metadata as Record<
          string,
          unknown
        > | null,
      }),
    );
  }

  private async getEncounterMap(
    businessId: string,
    bookingIds: string[],
  ): Promise<Map<string, PatientEncounter>> {
    if (bookingIds.length === 0) return new Map();
    const encounters = await this.encounterRepo.find({
      where: { businessId, bookingId: In(bookingIds) },
      relations: { author: true, addenda: true },
    });
    return new Map(
      encounters.map((encounter) => [encounter.bookingId, encounter]),
    );
  }

  private async mapListItem(
    booking: Booking,
    encounter: PatientEncounter | undefined,
    access: PatientClinicalProfileAccessContext,
    addendaCount: number,
  ): Promise<PatientEncounterListItemView> {
    const business = await this.businessService.findOne(booking.businessId);
    const bookingTarget = {
      status: booking.status,
      employeeId: booking.employeeId,
      linkedEmployeeIds: booking.linkedEmployeeIds,
      serviceMetadata: booking.service?.metadata as Record<
        string,
        unknown
      > | null,
    };
    const canAuthorVisitNote = canAuthorEncounterVisitNote(
      access.ctx,
      bookingTarget,
    );
    const canAddAddendum =
      !!encounter &&
      !!encounter.visitNote?.trim() &&
      canAppendEncounterAddendum(access.ctx, bookingTarget);

    let visitNote: string | null = null;
    let phiMasked = false;
    if (encounter) {
      const decrypted = await this.phiService.decryptEncounterForStaff(
        business,
        encounter,
        this.toStaff(access),
        access.phiAccess,
        encounter.id,
      );
      const hadPhi = this.encounterHasPhiContent(encounter);
      visitNote = decrypted.visitNote ?? null;
      phiMasked =
        hadPhi &&
        !this.encounterHasPhiContent({
          visitNote: decrypted.visitNote ?? null,
        });
    }

    return {
      encounterId: encounter?.id ?? null,
      bookingId: booking.id,
      startTime: booking.startTime.toISOString(),
      endTime: booking.endTime.toISOString(),
      serviceName: booking.service?.name ?? null,
      providerName: booking.employee?.name ?? null,
      visitNote,
      addendaCount,
      authorEmployeeId: encounter?.authorEmployeeId ?? null,
      authorName: encounter?.author?.name ?? null,
      authoredAt: encounter?.createdAt?.toISOString() ?? null,
      updatedAt: encounter?.updatedAt?.toISOString() ?? null,
      ...(phiMasked ? { phiMasked: true } : {}),
      canAuthorVisitNote,
      canAddAddendum,
    };
  }

  async listEncountersForCustomer(
    businessId: string,
    customerId: string,
    access: PatientClinicalProfileAccessContext,
  ): Promise<PatientEncounterListItemView[]> {
    await this.assertEnabled(businessId);
    const bookings = await this.loadConsultationBookings(
      businessId,
      customerId,
    );
    const encounterMap = await this.getEncounterMap(
      businessId,
      bookings.map((booking) => booking.id),
    );
    const items: PatientEncounterListItemView[] = [];
    for (const booking of bookings) {
      const encounter = encounterMap.get(booking.id);
      items.push(
        await this.mapListItem(
          booking,
          encounter,
          access,
          encounter?.addenda?.length ?? 0,
        ),
      );
    }
    return items;
  }

  async getEncounterDetail(
    businessId: string,
    customerId: string,
    encounterId: string,
    access: PatientClinicalProfileAccessContext,
  ): Promise<PatientEncounterDetailView> {
    await this.assertEnabled(businessId);
    const encounter = await this.encounterRepo.findOne({
      where: { id: encounterId, businessId, customerId },
      relations: {
        author: true,
        addenda: { author: true },
        booking: { service: true, employee: true },
      },
    });
    if (!encounter?.booking) {
      throw new NotFoundException('Patient encounter not found');
    }

    const business = await this.businessService.findOne(businessId);
    const staff = this.toStaff(access);
    const decryptedEncounter = await this.phiService.decryptEncounterForStaff(
      business,
      encounter,
      staff,
      access.phiAccess,
      encounter.id,
    );
    const hadPhi = this.encounterHasPhiContent(encounter);
    const visitNote = decryptedEncounter.visitNote ?? null;
    const phiMasked =
      hadPhi &&
      !this.encounterHasPhiContent({
        visitNote: decryptedEncounter.visitNote ?? null,
      });

    const addenda: PatientEncounterAddendumView[] = [];
    const sortedAddenda = [...(encounter.addenda ?? [])].sort(
      (left, right) => left.createdAt.getTime() - right.createdAt.getTime(),
    );
    for (const addendum of sortedAddenda) {
      const decryptedAddendum = await this.phiService.decryptAddendumForStaff(
        business,
        addendum,
        staff,
        access.phiAccess,
      );
      const hadAddendumPhi = this.addendumHasPhiContent(addendum);
      const body = decryptedAddendum.body ?? null;
      addenda.push({
        id: addendum.id,
        body,
        authorEmployeeId: addendum.authorEmployeeId,
        authorName: addendum.author?.name ?? null,
        createdAt: addendum.createdAt.toISOString(),
        ...(hadAddendumPhi && !body?.trim() ? { phiMasked: true } : {}),
      });
    }

    const bookingTarget = {
      status: encounter.booking.status,
      employeeId: encounter.booking.employeeId,
      linkedEmployeeIds: encounter.booking.linkedEmployeeIds,
      serviceMetadata: encounter.booking.service?.metadata as Record<
        string,
        unknown
      > | null,
    };

    return {
      encounterId: encounter.id,
      bookingId: encounter.bookingId,
      startTime: encounter.booking.startTime.toISOString(),
      endTime: encounter.booking.endTime.toISOString(),
      serviceName: encounter.booking.service?.name ?? null,
      providerName: encounter.booking.employee?.name ?? null,
      visitNote,
      addendaCount: addenda.length,
      authorEmployeeId: encounter.authorEmployeeId,
      authorName: encounter.author?.name ?? null,
      authoredAt: encounter.createdAt.toISOString(),
      updatedAt: encounter.updatedAt.toISOString(),
      ...(phiMasked ? { phiMasked: true } : {}),
      canAuthorVisitNote: canAuthorEncounterVisitNote(
        access.ctx,
        bookingTarget,
      ),
      canAddAddendum:
        !!visitNote?.trim() &&
        canAppendEncounterAddendum(access.ctx, bookingTarget),
      addenda,
    };
  }

  async upsertEncounterForBooking(
    businessId: string,
    customerId: string,
    bookingId: string,
    access: PatientClinicalProfileAccessContext,
    dto: UpsertPatientEncounterDto,
  ): Promise<PatientEncounterDetailView> {
    await this.assertEnabled(businessId);
    const booking = await this.bookingRepo.findOne({
      where: { id: bookingId, businessId, customerId },
      relations: { service: true, employee: true },
    });
    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    const bookingTarget = {
      status: booking.status,
      employeeId: booking.employeeId,
      linkedEmployeeIds: booking.linkedEmployeeIds,
      serviceMetadata: booking.service?.metadata as Record<
        string,
        unknown
      > | null,
    };
    if (!isCompletedConsultationBooking(bookingTarget)) {
      throw new BadRequestException(
        'Encounters require a completed consultation appointment',
      );
    }
    if (!canAuthorEncounterVisitNote(access.ctx, bookingTarget)) {
      throw new ForbiddenException(
        'Only the assigned provider or clinic managers can author this visit note',
      );
    }

    const business = await this.businessService.findOne(businessId);
    let encounter = await this.encounterRepo.findOne({
      where: { businessId, bookingId },
    });
    const beforePhi = encounter ? { visitNote: encounter.visitNote } : null;

    if (!encounter) {
      if (
        !access.ctx.employeeId &&
        !canAuthorEncounterVisitNote(access.ctx, bookingTarget)
      ) {
        throw new ForbiddenException(
          'Provider employee profile required to author visit notes',
        );
      }
      encounter = this.encounterRepo.create({
        businessId,
        customerId,
        bookingId,
        authorEmployeeId: access.ctx.employeeId,
        visitNote: dto.visitNote.trim(),
      });
    } else {
      encounter.visitNote = dto.visitNote.trim();
      if (!encounter.authorEmployeeId && access.ctx.employeeId) {
        encounter.authorEmployeeId = access.ctx.employeeId;
      }
    }

    const encrypted = await this.phiService.encryptEncounterForStorage(
      business,
      encounter,
    );
    Object.assign(encounter, encrypted);
    encounter = await this.encounterRepo.save(encounter);

    await this.phiService.auditEncounterPhiWrite(
      business,
      encounter,
      beforePhi,
      this.toStaff(access),
    );

    return this.getEncounterDetail(
      businessId,
      customerId,
      encounter.id,
      access,
    );
  }

  async appendAddendum(
    businessId: string,
    customerId: string,
    encounterId: string,
    access: PatientClinicalProfileAccessContext,
    dto: CreatePatientEncounterAddendumDto,
  ): Promise<PatientEncounterDetailView> {
    await this.assertEnabled(businessId);
    const encounter = await this.encounterRepo.findOne({
      where: { id: encounterId, businessId, customerId },
      relations: { booking: { service: true } },
    });
    if (!encounter?.booking) {
      throw new NotFoundException('Patient encounter not found');
    }
    if (!encounter.visitNote?.trim()) {
      throw new BadRequestException(
        'Add an initial visit note before appending addenda',
      );
    }

    const bookingTarget = {
      status: encounter.booking.status,
      employeeId: encounter.booking.employeeId,
      linkedEmployeeIds: encounter.booking.linkedEmployeeIds,
      serviceMetadata: encounter.booking.service?.metadata as Record<
        string,
        unknown
      > | null,
    };
    if (!canAppendEncounterAddendum(access.ctx, bookingTarget)) {
      throw new ForbiddenException(
        'Only the assigned provider or clinic managers can append encounter addenda',
      );
    }

    const business = await this.businessService.findOne(businessId);
    let addendum = this.addendumRepo.create({
      encounterId: encounter.id,
      authorEmployeeId: access.ctx.employeeId,
      body: dto.body.trim(),
    });
    addendum = await this.addendumRepo.save(addendum);
    const encrypted = await this.phiService.encryptAddendumForStorage(
      business,
      addendum,
      businessId,
    );
    Object.assign(addendum, encrypted);
    addendum = await this.addendumRepo.save(addendum);

    await this.phiService.auditAddendumPhiWrite(
      business,
      addendum,
      this.toStaff(access),
    );

    return this.getEncounterDetail(
      businessId,
      customerId,
      encounter.id,
      access,
    );
  }
}
