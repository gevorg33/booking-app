import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import {
  AssignClinicPreVisitIntakeDto,
  SubmitClinicPreVisitIntakeAnswersDto,
} from './dto/clinic-pre-visit-intake.dto.js';
import { ClinicPreVisitIntakeService } from './clinic-pre-visit-intake.service.js';

@Controller('businesses/:businessId')
@UseGuards(JwtAuthGuard)
export class ClinicPreVisitIntakesController {
  constructor(private readonly intakeService: ClinicPreVisitIntakeService) {}

  @Get('customers/:customerId/pre-visit-intakes')
  async listForCustomer(
    @Param('businessId') businessId: string,
    @Param('customerId') customerId: string,
    @CurrentUser() user: { id: string },
  ) {
    return {
      data: await this.intakeService.listForCustomer(
        businessId,
        user.id,
        customerId,
      ),
    };
  }

  @Post('customers/:customerId/pre-visit-intakes')
  async assignForCustomer(
    @Param('businessId') businessId: string,
    @Param('customerId') customerId: string,
    @CurrentUser() user: { id: string },
    @Body() dto: AssignClinicPreVisitIntakeDto,
  ) {
    return {
      data: await this.intakeService.assignForCustomer(
        businessId,
        user.id,
        customerId,
        dto,
      ),
    };
  }

  @Get('bookings/:bookingId/pre-visit-intake')
  async getForBooking(
    @Param('businessId') businessId: string,
    @Param('bookingId') bookingId: string,
    @CurrentUser() user: { id: string },
  ) {
    return {
      data: await this.intakeService.getForBooking(
        businessId,
        user.id,
        bookingId,
      ),
    };
  }

  @Post('bookings/:bookingId/pre-visit-intake')
  async assignForBooking(
    @Param('businessId') businessId: string,
    @Param('bookingId') bookingId: string,
    @CurrentUser() user: { id: string },
    @Body() dto: AssignClinicPreVisitIntakeDto,
  ) {
    return {
      data: await this.intakeService.assignForBooking(
        businessId,
        user.id,
        bookingId,
        dto,
      ),
    };
  }

  @Get('pre-visit-intakes/:intakeId')
  async getFlow(
    @Param('businessId') businessId: string,
    @Param('intakeId') intakeId: string,
    @CurrentUser() user: { id: string },
  ) {
    return {
      data: await this.intakeService.getIntakeFlow(
        businessId,
        user.id,
        intakeId,
      ),
    };
  }

  @Post('pre-visit-intakes/:intakeId/start')
  async start(
    @Param('businessId') businessId: string,
    @Param('intakeId') intakeId: string,
    @CurrentUser() user: { id: string },
  ) {
    return {
      data: await this.intakeService.startIntake(businessId, user.id, intakeId),
    };
  }

  @Post('pre-visit-intakes/:intakeId/answers')
  async submitAnswers(
    @Param('businessId') businessId: string,
    @Param('intakeId') intakeId: string,
    @CurrentUser() user: { id: string },
    @Body() dto: SubmitClinicPreVisitIntakeAnswersDto,
  ) {
    return {
      data: await this.intakeService.submitAnswers(
        businessId,
        user.id,
        intakeId,
        dto,
      ),
    };
  }
}
