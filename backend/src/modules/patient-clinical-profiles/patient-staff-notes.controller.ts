import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { CreatePatientStaffNoteDto } from './dto/create-patient-staff-note.dto.js';
import { PatientStaffNotesService } from './patient-staff-notes.service.js';
import { PatientStaffNoteAccessService } from './shared/patient-staff-note-access.service.js';

@Controller('businesses/:businessId/customers/:customerId/staff-notes')
@UseGuards(JwtAuthGuard)
export class PatientStaffNotesController {
  constructor(
    private readonly staffNotesService: PatientStaffNotesService,
    private readonly accessService: PatientStaffNoteAccessService,
  ) {}

  @Get()
  async listNotes(
    @Param('businessId') businessId: string,
    @Param('customerId') customerId: string,
    @CurrentUser() user: { id: string },
  ) {
    const access = await this.accessService.assertCustomerStaffNoteAccess(
      businessId,
      user.id,
      customerId,
    );
    return {
      data: await this.staffNotesService.listNotesForCustomer(
        businessId,
        customerId,
        access,
      ),
    };
  }

  @Post()
  async createNote(
    @Param('businessId') businessId: string,
    @Param('customerId') customerId: string,
    @Body() dto: CreatePatientStaffNoteDto,
    @CurrentUser() user: { id: string },
  ) {
    const access = await this.accessService.assertCustomerStaffNoteAccess(
      businessId,
      user.id,
      customerId,
    );
    return {
      data: await this.staffNotesService.createNoteForCustomer(
        businessId,
        customerId,
        access,
        dto,
      ),
    };
  }
}
