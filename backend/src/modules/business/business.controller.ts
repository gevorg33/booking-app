import { Controller, Get, Put, Body, Param, UseGuards } from '@nestjs/common';
import { BusinessService } from './business.service.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';

@Controller('businesses')
export class BusinessController {
  constructor(private businessService: BusinessService) {}

  @Get('my')
  @UseGuards(JwtAuthGuard)
  getMyBusinesses(@CurrentUser() user: any) {
    return this.businessService.getUserBusinesses(user.id);
  }

  @Get('by-slug/:slug')
  findBySlug(@Param('slug') slug: string) {
    return this.businessService.findBySlug(slug);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.businessService.findOne(id);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  update(@Param('id') id: string, @Body() data: any) {
    return this.businessService.update(id, data);
  }
}
