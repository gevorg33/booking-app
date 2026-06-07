import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import {
  CreateClinicQuestionnaireDto,
  ReplaceClinicQuestionnaireDefinitionDto,
  StartClinicQuestionnaireResponseDto,
  SubmitClinicQuestionnaireAnswersDto,
  UpdateClinicQuestionnaireDto,
} from './dto/clinic-questionnaire.dto.js';
import { ClinicQuestionnairesService } from './clinic-questionnaires.service.js';
import { ClinicQuestionnaireEngineService } from './clinic-questionnaire-engine.service.js';

@Controller('businesses/:businessId/clinic-questionnaires')
@UseGuards(JwtAuthGuard)
export class ClinicQuestionnairesController {
  constructor(
    private readonly questionnairesService: ClinicQuestionnairesService,
    private readonly engineService: ClinicQuestionnaireEngineService,
  ) {}

  @Get()
  async list(
    @Param('businessId') businessId: string,
    @CurrentUser() user: { id: string },
  ) {
    return {
      data: await this.questionnairesService.listQuestionnaires(
        businessId,
        user.id,
      ),
    };
  }

  @Post()
  async create(
    @Param('businessId') businessId: string,
    @CurrentUser() user: { id: string },
    @Body() dto: CreateClinicQuestionnaireDto,
  ) {
    return {
      data: await this.questionnairesService.createQuestionnaire(
        businessId,
        user.id,
        dto,
      ),
    };
  }

  @Get('responses/:responseId')
  async getResponse(
    @Param('businessId') businessId: string,
    @Param('responseId') responseId: string,
    @CurrentUser() user: { id: string },
  ) {
    return {
      data: await this.engineService.getResponseFlow(
        businessId,
        user.id,
        responseId,
      ),
    };
  }

  @Post('responses/:responseId/answers')
  async submitAnswers(
    @Param('businessId') businessId: string,
    @Param('responseId') responseId: string,
    @CurrentUser() user: { id: string },
    @Body() dto: SubmitClinicQuestionnaireAnswersDto,
  ) {
    return {
      data: await this.engineService.submitAnswers(
        businessId,
        user.id,
        responseId,
        dto,
      ),
    };
  }

  @Get(':questionnaireId')
  async getDefinition(
    @Param('businessId') businessId: string,
    @Param('questionnaireId') questionnaireId: string,
    @CurrentUser() user: { id: string },
  ) {
    return {
      data: await this.questionnairesService.getQuestionnaireDefinition(
        businessId,
        user.id,
        questionnaireId,
      ),
    };
  }

  @Put(':questionnaireId')
  async update(
    @Param('businessId') businessId: string,
    @Param('questionnaireId') questionnaireId: string,
    @CurrentUser() user: { id: string },
    @Body() dto: UpdateClinicQuestionnaireDto,
  ) {
    return {
      data: await this.questionnairesService.updateQuestionnaire(
        businessId,
        user.id,
        questionnaireId,
        dto,
      ),
    };
  }

  @Put(':questionnaireId/definition')
  async replaceDefinition(
    @Param('businessId') businessId: string,
    @Param('questionnaireId') questionnaireId: string,
    @CurrentUser() user: { id: string },
    @Body() dto: ReplaceClinicQuestionnaireDefinitionDto,
  ) {
    return {
      data: await this.questionnairesService.replaceQuestionnaireDefinition(
        businessId,
        user.id,
        questionnaireId,
        dto,
      ),
    };
  }

  @Post(':questionnaireId/publish')
  async publish(
    @Param('businessId') businessId: string,
    @Param('questionnaireId') questionnaireId: string,
    @CurrentUser() user: { id: string },
  ) {
    return {
      data: await this.questionnairesService.publishQuestionnaire(
        businessId,
        user.id,
        questionnaireId,
      ),
    };
  }

  @Post(':questionnaireId/responses')
  async startResponse(
    @Param('businessId') businessId: string,
    @Param('questionnaireId') questionnaireId: string,
    @CurrentUser() user: { id: string },
    @Body() dto: StartClinicQuestionnaireResponseDto,
  ) {
    return {
      data: await this.engineService.startResponse(
        businessId,
        user.id,
        questionnaireId,
        dto,
      ),
    };
  }
}
