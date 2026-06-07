import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Booking } from '../booking/entities/booking.entity.js';
import { BusinessService } from '../business/business.service.js';
import {
  assertClinicLabFeaturesEnabled,
  readBusinessTypeFromSettings,
} from '../clinic-test-results/shared/clinic-test-results-gate.util.js';
import { PatientStaffNote } from './entities/patient-staff-note.entity.js';
import type { CreatePatientStaffNoteDto } from './dto/create-patient-staff-note.dto.js';
import { PatientStaffNoteAccessService } from './shared/patient-staff-note-access.service.js';
import type { PatientStaffNoteAccessContext } from './shared/patient-staff-note-access.service.js';
import { PatientStaffNotePhiService } from './shared/patient-staff-note-phi.service.js';

export interface PatientStaffNoteView {
  id: string;
  body: string | null;
  authorEmployeeId: string | null;
  authorName: string | null;
  bookingId: string | null;
  createdAt: string;
  phiMasked?: boolean;
}

export interface PatientStaffNotesListView {
  notes: PatientStaffNoteView[];
  canCreate: boolean;
}

@Injectable()
export class PatientStaffNotesService {
  constructor(
    @InjectRepository(PatientStaffNote)
    private readonly noteRepo: Repository<PatientStaffNote>,
    @InjectRepository(Booking)
    private readonly bookingRepo: Repository<Booking>,
    private readonly businessService: BusinessService,
    private readonly accessService: PatientStaffNoteAccessService,
    private readonly phiService: PatientStaffNotePhiService,
  ) {}

  private async assertEnabled(businessId: string): Promise<void> {
    const business = await this.businessService.findOne(businessId);
    assertClinicLabFeaturesEnabled(
      readBusinessTypeFromSettings(
        business.settings as Record<string, unknown> | undefined,
      ),
    );
  }

  private noteHasPhiContent(note: Pick<PatientStaffNote, 'body'>): boolean {
    return !!note.body?.trim();
  }

  private async mapNoteView(
    note: PatientStaffNote,
    access: PatientStaffNoteAccessContext,
  ): Promise<PatientStaffNoteView> {
    const business = await this.businessService.findOne(note.businessId);
    const decrypted = await this.phiService.decryptNoteForStaff(
      business,
      note,
      this.accessService.toPhiStaffContext(access.ctx),
      access.phiAccess,
    );
    const hadPhi = this.noteHasPhiContent(note);
    const body = decrypted.body ?? null;
    const phiMasked =
      hadPhi && !this.noteHasPhiContent({ body: decrypted.body ?? null });

    return {
      id: note.id,
      body,
      authorEmployeeId: note.authorEmployeeId,
      authorName: note.author?.name ?? null,
      bookingId: note.bookingId,
      createdAt: note.createdAt.toISOString(),
      ...(phiMasked ? { phiMasked: true } : {}),
    };
  }

  async listNotesForCustomer(
    businessId: string,
    customerId: string,
    access: PatientStaffNoteAccessContext,
  ): Promise<PatientStaffNotesListView> {
    await this.assertEnabled(businessId);

    const notes = await this.noteRepo.find({
      where: { businessId, customerId },
      relations: { author: true },
      order: { createdAt: 'DESC' },
      take: 100,
    });

    const mapped: PatientStaffNoteView[] = [];
    for (const note of notes) {
      mapped.push(await this.mapNoteView(note, access));
    }

    return {
      notes: mapped,
      canCreate: access.canWrite,
    };
  }

  async createNoteForCustomer(
    businessId: string,
    customerId: string,
    access: PatientStaffNoteAccessContext,
    dto: CreatePatientStaffNoteDto,
  ): Promise<PatientStaffNoteView> {
    await this.assertEnabled(businessId);

    if (!access.canWrite) {
      throw new ForbiddenException(
        'You do not have permission to create staff notes for this patient',
      );
    }

    if (dto.bookingId) {
      const booking = await this.bookingRepo.findOne({
        where: { id: dto.bookingId, businessId, customerId },
        select: { id: true },
      });
      if (!booking) {
        throw new BadRequestException('Booking not found for this patient');
      }
    }

    const business = await this.businessService.findOne(businessId);
    let note = this.noteRepo.create({
      businessId,
      customerId,
      authorEmployeeId: access.ctx.employeeId,
      bookingId: dto.bookingId ?? null,
      body: dto.body.trim(),
    });

    const encrypted = await this.phiService.encryptNoteForStorage(business, {
      ...note,
      id: note.id ?? '',
      businessId,
    });
    Object.assign(note, encrypted);
    note = await this.noteRepo.save(note);

    await this.phiService.auditNotePhiWrite(
      business,
      note,
      this.accessService.toPhiStaffContext(access.ctx),
    );

    const withAuthor = await this.noteRepo.findOne({
      where: { id: note.id },
      relations: { author: true },
    });
    if (!withAuthor) {
      throw new NotFoundException('Staff note not found after create');
    }

    return this.mapNoteView(withAuthor, access);
  }
}
