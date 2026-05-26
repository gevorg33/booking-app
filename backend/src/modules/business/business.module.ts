import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Business } from './entities/business.entity.js';
import { BusinessMember } from './entities/business-member.entity.js';
import { BusinessService } from './business.service.js';
import { BusinessController } from './business.controller.js';

@Module({
  imports: [TypeOrmModule.forFeature([Business, BusinessMember])],
  controllers: [BusinessController],
  providers: [BusinessService],
  exports: [BusinessService],
})
export class BusinessModule {}
