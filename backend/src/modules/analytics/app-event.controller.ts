import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { AppEventService } from './app-event.service.js';
import { IngestAppEventsDto } from './dto/ingest-app-events.dto.js';

@Controller('events')
export class AppEventController {
  constructor(private readonly appEventService: AppEventService) {}

  /** adopt-1.3 — batched client telemetry ingest (consent-gated, redacted, rate-limited). */
  @Post('app')
  @HttpCode(200)
  ingest(@Body() dto: IngestAppEventsDto) {
    return this.appEventService.ingestEvents(dto);
  }
}
